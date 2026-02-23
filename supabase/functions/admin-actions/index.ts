// FarmSquare - Admin Actions Edge Function
// Handles admin-only operations: KYC/KYB approval/rejection, role updates, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminActionRequest {
  action: "approve_kyc" | "reject_kyc" | "approve_kyb" | "reject_kyb" | "update_role" | "release_escrow" | "refund_escrow";
  entity_type: string;
  entity_id: string;
  rejection_reason?: string;
  new_role?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: AdminActionRequest = await req.json();
    const { action, entity_type, entity_id, rejection_reason, new_role, metadata } = body;

    // Get IP address and user agent for audit log
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    let result: any;

    switch (action) {
      case "approve_kyc":
        result = await approveKYC(supabaseClient, user.id, entity_id, ipAddress, userAgent);
        break;
      case "reject_kyc":
        result = await rejectKYC(supabaseClient, user.id, entity_id, rejection_reason, ipAddress, userAgent);
        break;
      case "approve_kyb":
        result = await approveKYB(supabaseClient, user.id, entity_id, ipAddress, userAgent);
        break;
      case "reject_kyb":
        result = await rejectKYB(supabaseClient, user.id, entity_id, rejection_reason, ipAddress, userAgent);
        break;
      case "update_role":
        result = await updateUserRole(supabaseClient, user.id, entity_id, new_role, ipAddress, userAgent);
        break;
      case "release_escrow":
        result = await releaseEscrow(supabaseClient, user.id, entity_id, ipAddress, userAgent);
        break;
      case "refund_escrow":
        result = await refundEscrow(supabaseClient, user.id, entity_id, ipAddress, userAgent);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        {
          status: result.status || 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Admin action error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function approveKYC(supabase: any, adminId: string, userId: string, ipAddress: string, userAgent: string) {
  // Update profile KYC status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ kyc_status: "APPROVED" })
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    return { error: profileError.message };
  }

  // Update KYC documents status
  await supabase
    .from("kyc_documents")
    .update({ verification_status: "APPROVED" })
    .eq("user_id", userId);

  // Create audit log
  await supabase.from("admin_audit_logs").insert({
    actor_user_id: adminId,
    action: "approve_kyc",
    entity_type: "profile",
    entity_id: userId,
    after_json: profile,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return { data: profile };
}

async function rejectKYC(supabase: any, adminId: string, userId: string, rejectionReason: string, ipAddress: string, userAgent: string) {
  // Get current profile
  const { data: oldProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Update profile KYC status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ kyc_status: "REJECTED" })
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    return { error: profileError.message };
  }

  // Update KYC documents status
  await supabase
    .from("kyc_documents")
    .update({ verification_status: "REJECTED" })
    .eq("user_id", userId);

  // Create audit log
  await supabase.from("admin_audit_logs").insert({
    actor_user_id: adminId,
    action: "reject_kyc",
    entity_type: "profile",
    entity_id: userId,
    before_json: oldProfile,
    after_json: { ...profile, rejection_reason: rejectionReason },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return { data: { ...profile, rejection_reason: rejectionReason } };
}

async function approveKYB(supabase: any, adminId: string, businessId: string, ipAddress: string, userAgent: string) {
  // Get business record
  const { data: business, error: businessError } = await supabase
    .from("buyer_businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    return { error: "Business not found" };
  }

  // Update business status
  const { data: updatedBusiness, error: updateError } = await supabase
    .from("buyer_businesses")
    .update({ status: "APPROVED" })
    .eq("id", businessId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // Update buyer profile KYB status
  await supabase
    .from("profiles")
    .update({ kyb_status: "APPROVED" })
    .eq("id", business.buyer_id);

  // Update KYB documents status
  await supabase
    .from("kyb_documents")
    .update({ verification_status: "APPROVED" })
    .eq("business_id", businessId);

  // Create audit log
  await supabase.from("admin_audit_logs").insert({
    actor_user_id: adminId,
    action: "approve_kyb",
    entity_type: "buyer_business",
    entity_id: businessId,
    after_json: updatedBusiness,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return { data: updatedBusiness };
}

async function rejectKYB(supabase: any, adminId: string, businessId: string, rejectionReason: string, ipAddress: string, userAgent: string) {
  // Get business record
  const { data: oldBusiness } = await supabase
    .from("buyer_businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  // Update business status
  const { data: business, error: updateError } = await supabase
    .from("buyer_businesses")
    .update({
      status: "REJECTED",
      rejection_reason: rejectionReason,
    })
    .eq("id", businessId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // Update buyer profile KYB status
  await supabase
    .from("profiles")
    .update({ kyb_status: "REJECTED" })
    .eq("id", business.buyer_id);

  // Update KYB documents status
  await supabase
    .from("kyb_documents")
    .update({ verification_status: "REJECTED" })
    .eq("business_id", businessId);

  // Create audit log
  await supabase.from("admin_audit_logs").insert({
    actor_user_id: adminId,
    action: "reject_kyb",
    entity_type: "buyer_business",
    entity_id: businessId,
    before_json: oldBusiness,
    after_json: business,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return { data: business };
}

async function updateUserRole(supabase: any, adminId: string, userId: string, newRole: string, ipAddress: string, userAgent: string) {
  // Get current profile
  const { data: oldProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Validate role
  const validRoles = ["buyer", "farmer", "agent", "admin"];
  if (!validRoles.includes(newRole)) {
    return { error: "Invalid role", status: 400 };
  }

  // Update role
  const { data: profile, error: updateError } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // Create audit log
  await supabase.from("admin_audit_logs").insert({
    actor_user_id: adminId,
    action: "update_role",
    entity_type: "profile",
    entity_id: userId,
    before_json: oldProfile,
    after_json: profile,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return { data: profile };
}

async function releaseEscrow(supabase: any, adminId: string, orderId: string, ipAddress: string, userAgent: string) {
  // Get escrow
  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (escrowError || !escrow) {
    return { error: "Escrow not found" };
  }

  if (escrow.status !== "held") {
    return { error: "Escrow is not in held status", status: 400 };
  }

  // Get farmer wallet
  const { data: farmerWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", escrow.farmer_id)
    .single();

  if (!farmerWallet) {
    return { error: "Farmer wallet not found" };
  }

  // Update escrow status
  const { data: updatedEscrow, error: updateError } = await supabase
    .from("escrows")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("id", escrow.id)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // Update farmer wallet
  await supabase
    .from("wallets")
    .update({
      available: farmerWallet.available + escrow.farmer_amount,
      locked: farmerWallet.locked - escrow.amount,
    })
    .eq("id", farmerWallet.id);

  // Create wallet transaction
  await supabase.from("wallet_transactions").insert({
    wallet_id: farmerWallet.id,
    order_id: orderId,
    type: "release",
    title: "Escrow release",
    amount: escrow.farmer_amount,
    status: "completed",
    metadata: { escrow_id: escrow.id },
  });

  // Create audit log
  await supabase.from("admin_audit_logs").insert({
    actor_user_id: adminId,
    action: "release_escrow",
    entity_type: "escrow",
    entity_id: escrow.id,
    after_json: updatedEscrow,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return { data: updatedEscrow };
}

async function refundEscrow(supabase: any, adminId: string, orderId: string, ipAddress: string, userAgent: string) {
  // Get escrow
  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (escrowError || !escrow) {
    return { error: "Escrow not found" };
  }

  if (escrow.status !== "held") {
    return { error: "Escrow is not in held status", status: 400 };
  }

  // Get buyer wallet
  const { data: buyerWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", escrow.buyer_id)
    .single();

  if (!buyerWallet) {
    return { error: "Buyer wallet not found" };
  }

  // Update escrow status
  const { data: updatedEscrow, error: updateError } = await supabase
    .from("escrows")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
    })
    .eq("id", escrow.id)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // Update buyer wallet
  await supabase
    .from("wallets")
    .update({
      available: buyerWallet.available + escrow.amount,
      locked: buyerWallet.locked - escrow.amount,
    })
    .eq("id", buyerWallet.id);

  // Create wallet transaction
  await supabase.from("wallet_transactions").insert({
    wallet_id: buyerWallet.id,
    order_id: orderId,
    type: "refund",
    title: "Escrow refund",
    amount: escrow.amount,
    status: "completed",
    metadata: { escrow_id: escrow.id },
  });

  // Create audit log
  await supabase.from("admin_audit_logs").insert({
    actor_user_id: adminId,
    action: "refund_escrow",
    entity_type: "escrow",
    entity_id: escrow.id,
    after_json: updatedEscrow,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return { data: updatedEscrow };
}






