// FarmSquare - Update Order Status Edge Function
// Validates and updates order/logistics status transitions server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  order_id?: string;
  logistics_id?: string;
  new_status: string;
  notes?: string;
  location?: { lat: number; lng: number };
  progress_percentage?: number;
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

    // Get user profile to check role
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: StatusUpdateRequest = await req.json();
    const { order_id, logistics_id, new_status, notes, location, progress_percentage } = body;

    // Validate that either order_id or logistics_id is provided
    if (!order_id && !logistics_id) {
      return new Response(
        JSON.stringify({ error: "Either order_id or logistics_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update order status
    if (order_id) {
      const result = await updateOrderStatus(
        supabaseClient,
        user.id,
        profile.role,
        order_id,
        new_status,
        notes
      );

      if (result.error) {
        return new Response(
          JSON.stringify({ error: result.error }),
          {
            status: result.status || 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, order: result.data }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update logistics status
    if (logistics_id) {
      const result = await updateLogisticsStatus(
        supabaseClient,
        user.id,
        profile.role,
        logistics_id,
        new_status,
        location,
        progress_percentage
      );

      if (result.error) {
        return new Response(
          JSON.stringify({ error: result.error }),
          {
            status: result.status || 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, logistics: result.data }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Status update error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function updateOrderStatus(
  supabase: any,
  userId: string,
  userRole: string,
  orderId: string,
  newStatus: string,
  notes?: string
) {
  // Get current order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: "Order not found", status: 404 };
  }

  // Check permissions
  const canUpdate =
    userRole === "admin" ||
    (userRole === "buyer" && order.buyer_id === userId) ||
    (userRole === "farmer" && order.farmer_id === userId);

  if (!canUpdate) {
    return { error: "Unauthorized to update this order", status: 403 };
  }

  // Validate status transition using database function
  const { data: isValid, error: validationError } = await supabase.rpc(
    "validate_order_status_transition",
    {
      current_status: order.status,
      new_status: newStatus,
    }
  );

  if (validationError || !isValid) {
    return {
      error: `Invalid status transition from ${order.status} to ${newStatus}`,
      status: 400,
    };
  }

  // Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message, status: 500 };
  }

  // Create status history entry (trigger should handle this, but ensure it exists)
  if (notes) {
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: newStatus,
      notes: notes,
    });
  }

  return { data: updatedOrder };
}

async function updateLogisticsStatus(
  supabase: any,
  userId: string,
  userRole: string,
  logisticsId: string,
  newStatus: string,
  location?: { lat: number; lng: number },
  progressPercentage?: number
) {
  // Get current logistics
  const { data: logistics, error: logisticsError } = await supabase
    .from("logistics")
    .select("*")
    .eq("id", logisticsId)
    .single();

  if (logisticsError || !logistics) {
    return { error: "Logistics record not found", status: 404 };
  }

  // Check permissions (only agent assigned or admin)
  const canUpdate =
    userRole === "admin" ||
    (userRole === "agent" && logistics.agent_id === userId);

  if (!canUpdate) {
    return { error: "Unauthorized to update this logistics record", status: 403 };
  }

  // Validate status transition
  const { data: isValid, error: validationError } = await supabase.rpc(
    "validate_logistics_status_transition",
    {
      current_status: logistics.status,
      new_status: newStatus,
    }
  );

  if (validationError || !isValid) {
    return {
      error: `Invalid status transition from ${logistics.status} to ${newStatus}`,
      status: 400,
    };
  }

  // Prepare update data
  const updateData: any = { status: newStatus };
  if (location) {
    updateData.current_location = location;
  }
  if (progressPercentage !== undefined) {
    updateData.progress_percentage = progressPercentage;
  }

  // Update logistics status
  const { data: updatedLogistics, error: updateError } = await supabase
    .from("logistics")
    .update(updateData)
    .eq("id", logisticsId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message, status: 500 };
  }

  // Create status update entry (trigger should handle this, but ensure it exists)
  await supabase.from("logistics_status_updates").insert({
    logistics_id: logisticsId,
    status: newStatus,
    location: location,
    progress_percentage: progressPercentage,
  });

  return { data: updatedLogistics };
}






