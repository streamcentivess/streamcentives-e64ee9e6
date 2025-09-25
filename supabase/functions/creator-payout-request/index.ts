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
    const { amountCents, payoutMethod, payoutDetails } = await req.json();

    if (!amountCents || !payoutMethod || !payoutDetails) {
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

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
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

    // Get creator's available balance
    const { data: earnings, error: earningsError } = await supabaseService
      .from('creator_earnings')
      .select('amount_cents, net_amount_cents')
      .eq('creator_id', user.id)
      .eq('payout_status', 'pending');

    if (earningsError) {
      throw earningsError;
    }

    const availableBalance = earnings.reduce((sum, earning) => 
      sum + (earning.net_amount_cents || earning.amount_cents), 0
    );

    if (availableBalance < amountCents) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient balance", 
          available: availableBalance,
          requested: amountCents
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get cashout fee settings
    const { data: feeSettings } = await supabaseService
      .from('revenue_settings')
      .select('percentage')
      .eq('setting_name', 'creator_cashout_fee')
      .eq('is_active', true)
      .single();

    const feePercent = feeSettings?.percentage || 2.5; // Default 2.5%
    const feeCents = Math.floor(amountCents * (feePercent / 100));
    const netAmountCents = amountCents - feeCents;

    // Create payout request
    const { data: payoutRequest, error: payoutError } = await supabaseService
      .from('creator_payout_requests')
      .insert({
        creator_id: user.id,
        amount_cents: amountCents,
        fee_cents: feeCents,
        net_amount_cents: netAmountCents,
        payout_method: payoutMethod,
        payout_details: payoutDetails,
        status: 'pending'
      })
      .select()
      .single();

    if (payoutError) {
      throw payoutError;
    }

    // If using Stripe, create the payout
    if (payoutMethod === 'stripe' && payoutDetails.stripe_account_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      try {
        const payout = await stripe.payouts.create({
          amount: netAmountCents,
          currency: 'usd',
          description: `Creator payout for ${user.id}`,
          metadata: {
            payout_request_id: payoutRequest.id,
            creator_id: user.id
          }
        }, {
          stripeAccount: payoutDetails.stripe_account_id
        });

        // Update payout request with Stripe payout ID
        await supabaseService
          .from('creator_payout_requests')
          .update({ 
            stripe_payout_id: payout.id,
            status: 'processing',
            processed_at: new Date().toISOString()
          })
          .eq('id', payoutRequest.id);

        // Update creator earnings to mark as paid out
        await supabaseService
          .from('creator_earnings')
          .update({ payout_status: 'processing' })
          .eq('creator_id', user.id)
          .eq('payout_status', 'pending');

      } catch (stripeError) {
        console.error('Stripe payout error:', stripeError);
        // Update payout request status to failed
        await supabaseService
          .from('creator_payout_requests')
          .update({ status: 'failed' })
          .eq('id', payoutRequest.id);

        throw stripeError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        payoutRequest,
        netAmount: netAmountCents,
        fee: feeCents
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in creator-payout-request:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});