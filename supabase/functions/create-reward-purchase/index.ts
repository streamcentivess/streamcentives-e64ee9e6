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
    const { rewardId, paymentMethod } = await req.json();

    if (!rewardId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Missing rewardId or paymentMethod" }),
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

    if (!user?.email) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabaseClient
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (rewardError || !reward) {
      return new Response(
        JSON.stringify({ error: "Reward not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (paymentMethod === 'xp') {
      // Handle XP payment directly
      const { data, error } = await supabaseClient.rpc('redeem_reward', {
        reward_id_param: rewardId,
        payment_method_param: 'xp',
        xp_spent_param: reward.xp_cost,
        amount_paid_param: null,
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, redemption: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (paymentMethod === 'cash' && reward.cash_price) {
      // Create Stripe checkout session for cash payment
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: reward.currency.toLowerCase(),
              product_data: { 
                name: reward.title,
                description: reward.description || undefined,
                images: reward.image_url ? [reward.image_url] : undefined,
              },
              unit_amount: Math.round(reward.cash_price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/fan-dashboard?tab=rewards&success=true`,
        cancel_url: `${req.headers.get("origin")}/fan-dashboard?tab=rewards`,
        metadata: {
          reward_id: rewardId,
          user_id: user.id,
          payment_method: 'cash'
        }
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid payment method" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("Error in create-reward-purchase:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});