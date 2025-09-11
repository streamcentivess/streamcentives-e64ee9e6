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
    const priceId = lineItems.data[0]?.price?.id as string | undefined;
    if (!priceId) throw new Error("No price found");

    // Try metadata first, then fall back to known price->XP map
    const priceToXp: Record<string, number> = {
      "price_1S65Zr2XJfhJAhD8CuWu3KKI": 500,
      "price_1S65hR2XJfhJAhD8Qal3BZEY": 1220,
      "price_1S65lJ2XJfhJAhD8axA12XlE": 2500,
    };

    const price = await stripe.prices.retrieve(priceId);
    const product = typeof price.product === 'string' ? await stripe.products.retrieve(price.product as string) : null;

    const coinAmount = price.metadata?.coin_amount || product?.metadata?.coin_amount;
    let xpAmount = coinAmount ? parseInt(coinAmount, 10) : NaN;

    if (!coinAmount || Number.isNaN(xpAmount)) {
      const mapped = priceToXp[priceId];
      if (!mapped) throw new Error("XP amount not found (missing metadata and no mapping for price)");
      xpAmount = mapped;
    }

    const userId = session.metadata?.user_id as string | undefined;
    if (!userId) throw new Error("User ID not found in session metadata");

    // Initialize Supabase with service role key to bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Record the purchase in purchase history
    const { error: purchaseError } = await supabaseService
      .from("xp_purchases")
      .insert({
        user_id: userId,
        stripe_session_id: sessionId,
        amount_paid_cents: session.amount_total || 0,
        xp_amount: xpAmount,
        currency: session.currency || 'usd',
        stripe_price_id: priceId,
        purchase_date: new Date().toISOString()
      });

    if (purchaseError) {
      console.error('Failed to record purchase history:', purchaseError);
      // Continue with XP award even if purchase history fails
    }

    // Add XP to user's balance using the function that properly handles addition
    const { error } = await supabaseService.rpc('handle_xp_purchase', {
      user_id_param: userId,
      xp_amount_param: xpAmount
    });

    if (error) {
      console.error('Failed to add XP to user balance:', error);
      throw new Error('Failed to add XP to user balance');
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