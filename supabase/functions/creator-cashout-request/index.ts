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
    const { xpAmount, bankAccountDetails } = await req.json();
    
    if (!xpAmount || xpAmount <= 0) {
      throw new Error("Invalid XP amount");
    }

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

    // Get current XP conversion rate
    const { data: conversionRate, error: rateError } = await supabaseService
      .from('xp_conversion_rates')
      .select('xp_per_dollar_cents')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (rateError || !conversionRate) {
      throw new Error("Unable to get current conversion rate");
    }

    // Calculate fiat equivalent (XP amount / XP per dollar * 100 for cents)
    const fiatAmountCents = Math.floor((xpAmount / conversionRate.xp_per_dollar_cents) * 100);
    const feeAmountCents = Math.floor(fiatAmountCents * 0.02); // 2% fee
    const netAmountCents = fiatAmountCents - feeAmountCents;

    // Minimum payout validation ($5.00 minimum)
    if (netAmountCents < 500) {
      throw new Error("Minimum payout is $5.00 USD");
    }

    // Check user's XP balance
    const { data: userBalance, error: balanceError } = await supabaseService
      .from('user_xp_balances')
      .select('current_xp')
      .eq('user_id', user.id)
      .single();

    if (balanceError || !userBalance) {
      throw new Error("Unable to verify XP balance");
    }

    if (userBalance.current_xp < xpAmount) {
      throw new Error(`Insufficient XP balance. Required: ${xpAmount}, Available: ${userBalance.current_xp}`);
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create payout request record
    const { data: payoutRequest, error: payoutError } = await supabaseService
      .from('creator_payouts')
      .insert({
        creator_id: user.id,
        xp_amount: xpAmount,
        fiat_amount_cents: fiatAmountCents,
        fee_amount_cents: feeAmountCents,
        net_amount_cents: netAmountCents,
        conversion_rate: conversionRate.xp_per_dollar_cents,
        status: 'pending',
        metadata: {
          bank_account_details: bankAccountDetails || {},
          conversion_rate_id: conversionRate.id
        }
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Failed to create payout request:', payoutError);
      throw new Error('Failed to create payout request');
    }

    // Deduct XP from user's balance immediately
    const { error: deductError } = await supabaseService
      .from('user_xp_balances')
      .update({
        current_xp: userBalance.current_xp - xpAmount,
        total_spent_xp: (userBalance.total_spent_xp || 0) + xpAmount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('Failed to deduct XP:', deductError);
      throw new Error('Failed to process XP deduction');
    }

    // Log transactions
    const transactionPromises = [];

    // Cash out request transaction (XP)
    transactionPromises.push(
      supabaseService.from('transactions').insert({
        user_id: user.id,
        amount_value: xpAmount,
        currency_type: 'XP',
        type: 'CREATOR_CASH_OUT_REQUEST',
        status: 'completed',
        metadata: {
          payout_request_id: payoutRequest.id,
          fiat_amount_cents: fiatAmountCents,
          fee_amount_cents: feeAmountCents,
          net_amount_cents: netAmountCents
        }
      })
    );

    await Promise.all(transactionPromises);

    // Note: Actual Stripe payout will be processed separately by admin or automated system
    // This allows for review and fraud prevention

    return new Response(JSON.stringify({
      success: true,
      payout_request_id: payoutRequest.id,
      xp_amount: xpAmount,
      fiat_amount_cents: fiatAmountCents,
      fee_amount_cents: feeAmountCents,
      net_amount_cents: netAmountCents,
      conversion_rate: conversionRate.xp_per_dollar_cents,
      status: 'pending',
      message: 'Payout request submitted successfully. Processing may take 1-3 business days.'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in creator-cashout-request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});