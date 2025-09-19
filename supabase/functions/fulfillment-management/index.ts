import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FulfillmentUpdate {
  fulfillmentId: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  shippingAddress?: any;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    // Initialize service role client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (req.method) {
      case 'GET':
        if (action === 'list') {
          // Get fulfillments for creator
          const { data: fulfillments, error: listError } = await supabaseService
            .from('fulfillments')
            .select(`
              *,
              reward_redemptions!inner(
                id,
                reward:rewards(
                  id,
                  title,
                  description,
                  reward_type
                )
              ),
              fan:profiles!fulfillments_fan_id_fkey(
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false });

          if (listError) {
            throw new Error('Failed to fetch fulfillments: ' + listError.message);
          }

          return new Response(JSON.stringify({
            success: true,
            fulfillments: fulfillments || []
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        break;

      case 'POST':
        if (action === 'update') {
          const updates: FulfillmentUpdate = await req.json();
          
          if (!updates.fulfillmentId) {
            throw new Error("Missing fulfillmentId");
          }

          // Verify the fulfillment belongs to the authenticated creator
          const { data: fulfillment, error: verifyError } = await supabaseService
            .from('fulfillments')
            .select('creator_id')
            .eq('id', updates.fulfillmentId)
            .single();

          if (verifyError || !fulfillment) {
            throw new Error("Fulfillment not found");
          }

          if (fulfillment.creator_id !== user.id) {
            throw new Error("Unauthorized: You can only update your own fulfillments");
          }

          // Prepare update data
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          if (updates.status) {
            updateData.status = updates.status;
            if (updates.status === 'shipped') {
              updateData.shipped_at = new Date().toISOString();
            } else if (updates.status === 'delivered') {
              updateData.delivered_at = new Date().toISOString();
            }
          }

          if (updates.trackingNumber) {
            updateData.tracking_number = updates.trackingNumber;
          }

          if (updates.shippingAddress) {
            updateData.shipping_address = updates.shippingAddress;
          }

          if (updates.notes) {
            updateData.notes = updates.notes;
          }

          // Update fulfillment
          const { data: updatedFulfillment, error: updateError } = await supabaseService
            .from('fulfillments')
            .update(updateData)
            .eq('id', updates.fulfillmentId)
            .select()
            .single();

          if (updateError) {
            throw new Error('Failed to update fulfillment: ' + updateError.message);
          }

          // Send notification to fan about status update
          if (updates.status) {
            const notificationMessage = `Your order status has been updated to: ${updates.status}` +
              (updates.trackingNumber ? ` (Tracking: ${updates.trackingNumber})` : '');

            await supabaseService.from('notifications').insert({
              user_id: updatedFulfillment.fan_id,
              type: 'fulfillment_update',
              title: 'Order Status Update',
              message: notificationMessage,
              data: {
                fulfillment_id: updates.fulfillmentId,
                status: updates.status,
                tracking_number: updates.trackingNumber
              },
              priority: 'normal'
            });
          }

          return new Response(JSON.stringify({
            success: true,
            fulfillment: updatedFulfillment
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        if (action === 'create') {
          const { rewardRedemptionId, fanId, shippingAddress } = await req.json();
          
          if (!rewardRedemptionId || !fanId || !shippingAddress) {
            throw new Error("Missing required fields: rewardRedemptionId, fanId, shippingAddress");
          }

          // Create new fulfillment
          const { data: newFulfillment, error: createError } = await supabaseService
            .from('fulfillments')
            .insert({
              reward_redemption_id: rewardRedemptionId,
              creator_id: user.id,
              fan_id: fanId,
              shipping_address: shippingAddress,
              status: 'pending'
            })
            .select()
            .single();

          if (createError) {
            throw new Error('Failed to create fulfillment: ' + createError.message);
          }

          return new Response(JSON.stringify({
            success: true,
            fulfillment: newFulfillment
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        break;

      default:
        throw new Error("Method not allowed");
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error('Error in fulfillment-management:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});