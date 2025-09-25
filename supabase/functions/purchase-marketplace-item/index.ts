import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId, paymentMethod } = await req.json();

    if (!listingId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Missing listingId or paymentMethod" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const authHeader = req.headers.get("Authorization")!;
    
    // Use service role for complex transactions
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Get listing details with reward and seller info
    const { data: listing, error: listingError } = await supabaseService
      .from('marketplace_listings')
      .select(`
        *,
        reward_redemptions!inner(
          reward_id,
          rewards!inner(
            title,
            creator_id,
            type
          )
        )
      `)
      .eq('id', listingId)
      .eq('is_active', true)
      .eq('is_sold', false)
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: "Listing not found or not available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get revenue settings
    const { data: revenueSettings } = await supabaseService
      .from('revenue_settings')
      .select('*')
      .eq('setting_name', 'marketplace_fee')
      .eq('is_active', true)
      .single();

    const marketplaceFeePercent = revenueSettings?.percentage || 5; // Default 5%
    const creatorFeePercent = 2; // 2% to original creator

    if (paymentMethod === 'xp') {
      if (!listing.asking_price_xp) {
        return new Response(
          JSON.stringify({ error: "XP payment not available for this listing" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check buyer's XP balance
      const { data: buyerXP } = await supabaseService
        .from('user_xp_balances')
        .select('current_xp')
        .eq('user_id', user.id)
        .single();

      if (!buyerXP || buyerXP.current_xp < listing.asking_price_xp) {
        return new Response(
          JSON.stringify({ error: "Insufficient XP balance" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Calculate fees
      const streamcentivesFee = Math.floor(listing.asking_price_xp * (marketplaceFeePercent / 100));
      const creatorFee = Math.floor(listing.asking_price_xp * (creatorFeePercent / 100));
      const sellerAmount = listing.asking_price_xp - streamcentivesFee - creatorFee;

      // Execute transaction using the database function
      const { data: result, error: transactionError } = await supabaseService.rpc('execute_marketplace_purchase_xp', {
        listing_id_param: listingId,
        buyer_id_param: user.id,
        xp_amount_param: listing.asking_price_xp
      });

      if (transactionError) throw transactionError;

      return new Response(
        JSON.stringify({ success: true, message: "Purchase completed with XP" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (paymentMethod === 'cash') {
      // Handle cash transactions via Stripe (implement similar to XP but with cash)
      return new Response(
        JSON.stringify({ error: "Cash payments not yet implemented" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 501 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid payment method" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("Error in purchase-marketplace-item:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});