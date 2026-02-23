// FarmSquare - Paystack Webhook Handler
// Handles Paystack payment webhooks and updates wallet transactions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify webhook signature (implement Paystack signature verification)
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();
    
    // TODO: Verify Paystack signature
    // const isValid = verifyPaystackSignature(body, signature);
    // if (!isValid) {
    //   return new Response(JSON.stringify({ error: "Invalid signature" }), {
    //     status: 401,
    //     headers: { ...corsHeaders, "Content-Type": "application/json" },
    //   });
    // }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(supabaseClient, event.data);
        break;
      case "charge.failed":
        await handleChargeFailed(supabaseClient, event.data);
        break;
      case "transfer.success":
        await handleTransferSuccess(supabaseClient, event.data);
        break;
      case "transfer.failed":
        await handleTransferFailed(supabaseClient, event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function handleChargeSuccess(supabase: any, data: any) {
  const { reference, amount, customer, metadata } = data;
  
  // Find order_group by paystack_reference
  const { data: orderGroup, error: orderGroupError } = await supabase
    .from("order_groups")
    .select("*")
    .eq("paystack_reference", reference)
    .single();

  if (orderGroupError || !orderGroup) {
    console.error("Order group not found:", orderGroupError);
    return;
  }

  // Update order_group status
  await supabase
    .from("order_groups")
    .update({ status: "paid" })
    .eq("id", orderGroup.id);

  // Get buyer's wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", orderGroup.buyer_id)
    .single();

  if (!wallet) {
    console.error("Wallet not found for user:", orderGroup.buyer_id);
    return;
  }

  // Create wallet transaction
  await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    type: "fund",
    title: "Wallet funding via Paystack",
    amount: amount / 100, // Convert from kobo to naira
    status: "completed",
    reference: reference,
    metadata: { paystack_data: data },
  });

  // Update wallet balance
  await supabase
    .from("wallets")
    .update({
      available: wallet.available + amount / 100,
    })
    .eq("id", wallet.id);

  // If this was for an order payment, process orders
  if (metadata?.order_group_id) {
    await processOrderPayment(supabase, orderGroup.id);
  }
}

async function handleChargeFailed(supabase: any, data: any) {
  const { reference, metadata } = data;
  
  // Update order_group status to failed
  if (metadata?.order_group_id) {
    await supabase
      .from("order_groups")
      .update({ status: "failed" })
      .eq("id", metadata.order_group_id);
  }
}

async function handleTransferSuccess(supabase: any, data: any) {
  const { reference, amount, recipient, metadata } = data;
  
  // Update payout_request status
  if (metadata?.payout_request_id) {
    await supabase
      .from("payout_requests")
      .update({ status: "Paid" })
      .eq("id", metadata.payout_request_id);
  }
}

async function handleTransferFailed(supabase: any, data: any) {
  const { reference, metadata } = data;
  
  // Update payout_request status
  if (metadata?.payout_request_id) {
    await supabase
      .from("payout_requests")
      .update({ status: "Rejected" })
      .eq("id", metadata.payout_request_id);
  }
}

async function processOrderPayment(supabase: any, orderGroupId: string) {
  // Get all orders in this order group
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("order_group_id", orderGroupId);

  if (!orders) return;

  // Process each order
  for (const order of orders) {
    // Update order payment status
    await supabase
      .from("orders")
      .update({
        payment_status: "Escrowed",
        status: "Paid",
      })
      .eq("id", order.id);

    // Create escrow
    const commission = order.total_amount * 0.05; // 5% commission
    const farmerAmount = order.total_amount - commission;

    await supabase.from("escrows").insert({
      order_id: order.id,
      buyer_id: order.buyer_id,
      farmer_id: order.farmer_id,
      amount: order.total_amount,
      commission: commission,
      farmer_amount: farmerAmount,
      status: "held",
    });

    // Consume inventory reservations
    await supabase
      .from("inventory_reservations")
      .update({ status: "consumed" })
      .eq("order_id", order.id)
      .eq("status", "active");

    // Deduct from buyer's wallet
    const { data: buyerWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", order.buyer_id)
      .single();

    if (buyerWallet) {
      await supabase
        .from("wallets")
        .update({
          available: buyerWallet.available - order.total_amount,
          locked: buyerWallet.locked + order.total_amount,
        })
        .eq("id", buyerWallet.id);
    }
  }
}

