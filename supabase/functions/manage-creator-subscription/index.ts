import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATOR-SUBSCRIPTION] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { action, tier = 'creator_pro' } = await req.json();
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (action === 'create_subscription') {
      // Create or retrieve Stripe customer
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id }
        });
        customerId = customer.id;
        logStep("Created Stripe customer", { customerId });

        // Update profile with customer ID
        await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: 'price_creator_pro' }], // This should be configured in Stripe
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      logStep("Created subscription", { subscriptionId: subscription.id });

      return new Response(JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        client_secret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'cancel_subscription') {
      if (!profile?.subscription_status || profile.subscription_status !== 'active') {
        throw new Error('No active subscription found');
      }

      // Get subscription ID from database
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (!profileData?.stripe_subscription_id) {
        throw new Error('Subscription ID not found');
      }

      // Cancel subscription at period end
      await stripe.subscriptions.update(profileData.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      logStep("Scheduled subscription cancellation", { subscriptionId: profileData.stripe_subscription_id });

      return new Response(JSON.stringify({
        success: true,
        message: 'Subscription will cancel at the end of billing period',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'get_status') {
      return new Response(JSON.stringify({
        success: true,
        subscription_status: profile?.subscription_status || 'free',
        tier: tier,
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