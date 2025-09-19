import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BRAND-DEAL-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { action, deal_id, offer_id } = await req.json();
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    if (action === 'create_deal') {
      // Create brand deal from accepted offer
      const { data: offer } = await supabaseClient
        .from('sponsor_offers')
        .select('*')
        .eq('id', offer_id)
        .eq('sponsor_id', user.id)
        .eq('status', 'accepted')
        .single();

      if (!offer) {
        throw new Error('Offer not found or not accepted');
      }

      // Calculate fees (2% platform fee)
      const platformFeeCents = Math.floor(offer.offer_amount_cents * 0.02);
      const creatorNetCents = offer.offer_amount_cents - platformFeeCents;

      // Create brand deal record
      const { data: deal, error: dealError } = await supabaseClient
        .from('brand_deals')
        .insert({
          creator_id: offer.creator_id,
          sponsor_id: offer.sponsor_id,
          offer_id: offer_id,
          deal_name: offer.offer_title,
          offer_details: offer.offer_description,
          amount_cents: offer.offer_amount_cents,
          streamcentives_fee_cents: platformFeeCents,
          creator_net_cents: creatorNetCents,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (dealError) throw new Error(`Failed to create deal: ${dealError.message}`);

      logStep("Created brand deal", { dealId: deal.id, amount: offer.offer_amount_cents });

      return new Response(JSON.stringify({
        success: true,
        deal_id: deal.id,
        amount_cents: offer.offer_amount_cents,
        platform_fee_cents: platformFeeCents,
        creator_net_cents: creatorNetCents,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'create_payment_intent') {
      // Get deal details
      const { data: deal } = await supabaseClient
        .from('brand_deals')
        .select('*, profiles!brand_deals_creator_id_fkey(stripe_account_id)')
        .eq('id', deal_id)
        .eq('sponsor_id', user.id)
        .single();

      if (!deal) {
        throw new Error('Deal not found or not authorized');
      }

      // Get creator's Stripe account ID
      const creatorStripeAccountId = (deal as any).profiles?.stripe_account_id;
      if (!creatorStripeAccountId) {
        throw new Error('Creator has not connected their Stripe account');
      }

      // Create payment intent with application fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: deal.amount_cents,
        currency: 'usd',
        application_fee_amount: deal.streamcentives_fee_cents,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
        metadata: {
          deal_id: deal.id,
          creator_id: deal.creator_id,
          sponsor_id: deal.sponsor_id,
        },
      });

      logStep("Created payment intent", { 
        paymentIntentId: paymentIntent.id, 
        amount: deal.amount_cents,
        applicationFee: deal.streamcentives_fee_cents 
      });

      return new Response(JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'confirm_payment') {
      const { payment_intent_id } = await req.json();
      
      // Process the payment through database function
      const { data: result, error } = await supabaseClient.rpc(
        'process_brand_deal_payment',
        {
          deal_id_param: deal_id,
          payment_intent_id_param: payment_intent_id,
          amount_paid_cents_param: await getPaymentIntentAmount(stripe, payment_intent_id)
        }
      );

      if (error) throw new Error(`Payment processing failed: ${error.message}`);

      logStep("Payment processed", result);

      return new Response(JSON.stringify({
        success: true,
        ...result,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getPaymentIntentAmount(stripe: Stripe, paymentIntentId: string): Promise<number> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent.amount;
}