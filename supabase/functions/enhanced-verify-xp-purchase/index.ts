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

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Use service role for payment verification
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session.metadata) {
      throw new Error("No metadata found in session");
    }

    const userId = session.metadata.user_id;
    const xpAmount = parseInt(session.metadata.xp_amount);
    const creatorId = session.metadata.creator_id || null;
    const xpType = session.metadata.xp_type || 'platform';
    
    // Get line item details for payment amount
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    const totalAmountCents = session.amount_total || 0;

    // Process XP purchase with enhanced revenue sharing
    const { data, error } = await supabaseService.rpc('handle_xp_purchase_with_revenue_sharing', {
      user_id_param: userId,
      xp_amount_param: xpAmount,
      payment_amount_cents_param: totalAmountCents,
      creator_id_param: creatorId,
      xp_type_param: xpType
    });

    if (error) {
      console.error('Error processing XP purchase:', error);
      throw error;
    }

    console.log('XP purchase processed successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        xpAwarded: xpAmount,
        transactionDetails: data 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in enhanced-verify-xp-purchase:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});