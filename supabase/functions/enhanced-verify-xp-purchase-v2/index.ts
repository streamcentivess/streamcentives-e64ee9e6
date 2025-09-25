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

    // Extract metadata
    const userId = session.metadata?.user_id;
    const totalXpAmount = parseInt(session.metadata?.xp_amount || '0', 10);
    const fanXpShare = parseInt(session.metadata?.fan_xp_share || '0', 10);
    const platformXpShare = parseInt(session.metadata?.platform_xp_share || '0', 10);
    const creatorId = session.metadata?.creator_id || null;
    const xpType = session.metadata?.xp_type || 'platform';

    if (!userId || !totalXpAmount) {
      throw new Error("Invalid session metadata");
    }

    // Initialize Supabase with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get session payment details for transaction logging
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    const amountPaidCents = session.amount_total || 0;

    // Award XP to fan and log all transactions
    const { error: xpError } = await supabaseService.rpc('handle_xp_purchase_with_revenue_sharing', {
      user_id_param: userId,
      xp_amount_param: fanXpShare,
      payment_amount_cents_param: amountPaidCents,
      creator_id_param: creatorId,
      xp_type_param: xpType
    });

    if (xpError) {
      console.error('Failed to award XP:', xpError);
      throw new Error('Failed to process XP purchase');
    }

    // Log detailed transactions in new transactions table
    const transactionPromises = [];

    // Fan XP share transaction
    transactionPromises.push(
      supabaseService.from('transactions').insert({
        user_id: userId,
        amount_value: fanXpShare,
        currency_type: 'XP',
        type: 'XP_PURCHASE_FAN_SHARE',
        status: 'completed',
        stripe_id: sessionId,
        metadata: {
          original_amount_cents: amountPaidCents,
          session_id: sessionId,
          creator_id: creatorId,
          xp_type: xpType
        }
      })
    );

    // Platform XP share transaction
    transactionPromises.push(
      supabaseService.from('transactions').insert({
        user_id: 'platform', // Special platform user ID or use a system ID
        related_user_id: userId,
        amount_value: platformXpShare,
        currency_type: 'XP',
        type: 'XP_PURCHASE_PLATFORM_SHARE',
        status: 'completed',
        stripe_id: sessionId,
        metadata: {
          original_amount_cents: amountPaidCents,
          session_id: sessionId,
          fan_id: userId
        }
      })
    );

    await Promise.all(transactionPromises);

    // Record in XP purchase history for backwards compatibility
    const { error: purchaseError } = await supabaseService
      .from("xp_purchases")
      .insert({
        user_id: userId,
        stripe_session_id: sessionId,
        amount_paid_cents: amountPaidCents,
        xp_amount: fanXpShare,
        currency: session.currency || 'usd',
        stripe_price_id: lineItems.data[0]?.price?.id,
        purchase_date: new Date().toISOString()
      });

    if (purchaseError) {
      console.error('Failed to record purchase history:', purchaseError);
      // Continue, as this is for backwards compatibility
    }

    return new Response(JSON.stringify({
      success: true,
      fan_xp_awarded: fanXpShare,
      platform_xp_share: platformXpShare,
      total_xp_purchased: totalXpAmount,
      session_id: sessionId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in enhanced-verify-xp-purchase-v2:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});