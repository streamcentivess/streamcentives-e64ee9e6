import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-SUBSCRIPTION-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabaseClient);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription, supabaseClient);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseClient);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabaseClient);
        break;

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, supabase: any) {
  logStep("Processing subscription update", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    logStep("User not found for customer", { customerId });
    return;
  }

  // Determine subscription tier based on price ID
  let tier = 'free';
  if (subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    if (priceId === 'price_creator_pro') {
      tier = 'creator_pro';
    }
  }

  // Update subscription status
  const { data: result, error } = await supabase.rpc(
    'update_creator_subscription_status',
    {
      user_id_param: profile.user_id,
      status_param: subscription.status,
      tier_param: tier,
      stripe_subscription_id_param: subscription.id
    }
  );

  if (error) {
    logStep("Failed to update subscription status", { error: error.message });
    throw error;
  }

  logStep("Subscription status updated", result);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription, supabase: any) {
  logStep("Processing subscription cancellation", { subscriptionId: subscription.id });

  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    logStep("User not found for customer", { customerId });
    return;
  }

  // Update to canceled status
  const { data: result, error } = await supabase.rpc(
    'update_creator_subscription_status',
    {
      user_id_param: profile.user_id,
      status_param: 'canceled',
      tier_param: 'free'
    }
  );

  if (error) {
    logStep("Failed to cancel subscription", { error: error.message });
    throw error;
  }

  logStep("Subscription canceled", result);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return;

  logStep("Processing successful payment", { 
    invoiceId: invoice.id, 
    subscriptionId: invoice.subscription 
  });

  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    logStep("User not found for customer", { customerId });
    return;
  }

  // Update subscription to active and extend expiry
  const nextBillingDate = new Date((invoice.lines.data[0]?.period?.end || 0) * 1000);
  
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_expires_at: nextBillingDate.toISOString(),
    })
    .eq('user_id', profile.user_id);

  if (error) {
    logStep("Failed to update payment success", { error: error.message });
    throw error;
  }

  logStep("Payment processed successfully");
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.subscription) return;

  logStep("Processing failed payment", { 
    invoiceId: invoice.id, 
    subscriptionId: invoice.subscription 
  });

  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    logStep("User not found for customer", { customerId });
    return;
  }

  // Update subscription to past_due
  const { error } = await supabase.rpc(
    'update_creator_subscription_status',
    {
      user_id_param: profile.user_id,
      status_param: 'past_due'
    }
  );

  if (error) {
    logStep("Failed to update payment failure", { error: error.message });
    throw error;
  }

  logStep("Payment failure processed");
}