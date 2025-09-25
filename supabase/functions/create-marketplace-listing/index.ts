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
    const { redemptionId, askingPriceCents, askingPriceXP, description } = await req.json();

    if (!redemptionId || (!askingPriceCents && !askingPriceXP)) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const authHeader = req.headers.get("Authorization")!;
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

    // Verify ownership of the redemption
    const { data: redemption, error: redemptionError } = await supabaseClient
      .from('reward_redemptions')
      .select('*')
      .eq('id', redemptionId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (redemptionError || !redemption) {
      return new Response(
        JSON.stringify({ error: "Redemption not found or not owned by user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Create marketplace listing
    const { data: listing, error: listingError } = await supabaseClient
      .from('marketplace_listings')
      .insert({
        seller_id: user.id,
        reward_redemption_id: redemptionId,
        asking_price_cents: askingPriceCents,
        asking_price_xp: askingPriceXP,
        description: description,
        is_active: true,
        is_sold: false
      })
      .select()
      .single();

    if (listingError) {
      console.error("Error creating listing:", listingError);
      throw listingError;
    }

    return new Response(
      JSON.stringify({ success: true, listing }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-marketplace-listing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});