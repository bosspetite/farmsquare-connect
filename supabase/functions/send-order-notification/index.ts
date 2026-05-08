import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface EmailRequestBody {
    orderId: string;
}

const sendEmailWithResend = async (params: {
    apiKey: string;
    from: string;
    to: string[];
    subject: string;
    text: string;
}) => {
    const { apiKey, from, to, subject, text } = params;
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            text,
        }),
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
            `Resend API error (${response.status}): ${responseText}`,
        );
    }
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const serviceRoleClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            },
        );

        const body = (await req.json()) as EmailRequestBody;
        const orderId = body?.orderId;

        if (!orderId) {
            throw new Error("Missing required field: orderId");
        }

        const { data: orderData, error: orderError } = await serviceRoleClient
            .from("orders")
            .select(
                `
                id,
                total_amount,
                buyer:profiles!orders_buyer_id_fkey(full_name, email),
                farmer:profiles!orders_farmer_id_fkey(full_name, email),
                order_items (
                    quantity_kg,
                    listings (
                        commodity,
                        grade
                    )
                )
            `,
            )
            .eq("id", orderId)
            .single();

        if (orderError || !orderData) {
            console.error("[send-order-notification] Order lookup failed", {
                orderId,
                orderError,
            });
            throw new Error("Order not found");
        }

        const listingValue = orderData.order_items?.[0]?.listings;
        const listing =
            Array.isArray(listingValue) && listingValue.length > 0
                ? listingValue[0]
                : !Array.isArray(listingValue)
                  ? listingValue
                  : null;

        const commodity = listing?.commodity || "Produce";
        const quantityKg = Number(orderData.order_items?.[0]?.quantity_kg || 0);
        const amount = Number(orderData.total_amount || 0);
        const buyerName = orderData.buyer?.full_name || "Buyer";
        const buyerEmail = orderData.buyer?.email || "";
        const farmerName = orderData.farmer?.full_name || "Farmer";
        const farmerEmail = orderData.farmer?.email || "";

        const { data: adminRows } = await serviceRoleClient
            .from("profiles")
            .select("email")
            .eq("role", "admin")
            .not("email", "is", null);

        const envAdminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
        const adminRecipients = Array.from(
            new Set(
                [
                    ...(adminRows || [])
                        .map((row) => row.email as string | null)
                        .filter((email): email is string => Boolean(email)),
                    ...(envAdminEmail
                        ? envAdminEmail
                              .split(",")
                              .map((entry) => entry.trim())
                              .filter(Boolean)
                        : []),
                ].filter(Boolean),
            ),
        );

        const subject = "New FarmSquare Order Received";
        const farmerEmailBody = `
Dear ${farmerName},

A new order has been placed on FarmSquare.

Order details:
- Product: ${commodity}
- Requested Quantity: ${quantityKg}kg
- Total Amount: NGN ${amount.toLocaleString()}
- Buyer: ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}

Please log in to your FarmSquare dashboard to review and process this order.
        `.trim();

        const adminEmailBody = `
FarmSquare New Order Alert

Order ID: ${orderId}
Product: ${commodity}
Requested Quantity: ${quantityKg}kg
Total Amount: NGN ${amount.toLocaleString()}
Buyer: ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}
Farmer: ${farmerName}${farmerEmail ? ` (${farmerEmail})` : ""}
        `.trim();

        const resendKey = Deno.env.get("EMAIL_PROVIDER_API_KEY") || "";
        const fromAddress =
            Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@farmsquare.com";

        if (resendKey) {
            const deliveryPromises: Promise<void>[] = [];
            if (farmerEmail) {
                deliveryPromises.push(
                    sendEmailWithResend({
                        apiKey: resendKey,
                        from: fromAddress,
                        to: [farmerEmail],
                        subject,
                        text: farmerEmailBody,
                    }),
                );
            }
            if (adminRecipients.length > 0) {
                deliveryPromises.push(
                    sendEmailWithResend({
                        apiKey: resendKey,
                        from: fromAddress,
                        to: adminRecipients,
                        subject,
                        text: adminEmailBody,
                    }),
                );
            }

            await Promise.allSettled(deliveryPromises);
        } else {
            console.log(
                "[send-order-notification] EMAIL_PROVIDER_API_KEY is missing. Logging emails only.",
            );
            console.log("=== FARMER EMAIL PREVIEW ===", {
                to: farmerEmail,
                subject,
                text: farmerEmailBody,
            });
            console.log("=== ADMIN EMAIL PREVIEW ===", {
                to: adminRecipients,
                subject,
                text: adminEmailBody,
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Order notification handling completed",
                orderId,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error(
            "[send-order-notification] Unhandled function error",
            error,
        );
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
