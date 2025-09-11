import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get session details
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Get price details to determine XP amount
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    const priceId = lineItems.data[0]?.price?.id;
    
    if (!priceId) throw new Error("No price found");

    // Get price metadata to determine XP amount
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product as string);
    
    const coinAmount = price.metadata?.coin_amount || product.metadata?.coin_amount;
    
    if (!coinAmount) throw new Error("XP amount not found in metadata");

    const xpAmount = parseInt(coinAmount);
    const userId = session.metadata?.user_id;
    
    if (!userId) throw new Error("User ID not found");

    // Initialize Supabase with service role key to bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Add XP to user's balance
    const { error } = await supabaseService
      .from("user_xp_balances")
      .upsert({
        user_id: userId,
        current_xp: xpAmount,
        total_earned_xp: xpAmount,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      // If upsert failed, try to update existing record
      await supabaseService.rpc('handle_xp_purchase', {
        user_id_param: userId,
        xp_amount_param: xpAmount
      });
    }

    return new Response(JSON.stringify({
      success: true,
      xp_added: xpAmount,
      session_id: sessionId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});