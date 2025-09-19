import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-08-27.basil',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { payment_intent_id } = await req.json();
    
    // Get user authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    console.log('Completing reward purchase:', payment_intent_id);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    const rewardId = paymentIntent.metadata.reward_id;
    const userId = paymentIntent.metadata.user_id;

    if (userId !== user.id) {
      throw new Error('Payment user mismatch');
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabaseClient
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (rewardError || !reward) {
      throw new Error('Reward not found');
    }

    // Process cash payment using the enhanced redemption function
    const { data: result, error } = await supabaseClient.rpc('enhanced_redeem_reward', {
      reward_id_param: rewardId,
      user_id_param: userId,
      payment_method_param: 'cash',
      amount_paid_param: paymentIntent.amount / 100 // Convert from cents
    });

    if (error) throw error;

    // Log the transaction
    await supabaseClient
      .from('transactions')
      .insert([{
        user_id: userId,
        related_user_id: reward.creator_id,
        amount_value: paymentIntent.amount,
        currency_type: 'FIAT',
        type: 'REWARD_PURCHASE_FIAT',
        status: 'completed',
        stripe_id: payment_intent_id,
        metadata: {
          reward_id: rewardId,
          reward_title: reward.title,
          redemption_id: result.redemption_id
        }
      }]);

    // Send real-time notification to creator
    await supabaseClient
      .from('notifications')
      .insert([{
        user_id: reward.creator_id,
        type: 'reward_purchased',
        title: 'Reward Purchased!',
        message: `Someone purchased your "${reward.title}" for $${(paymentIntent.amount / 100).toFixed(2)}`,
        data: {
          reward_id: rewardId,
          buyer_id: userId,
          amount: paymentIntent.amount / 100,
          redemption_id: result.redemption_id
        },
        priority: 'high'
      }]);

    return new Response(JSON.stringify({
      success: true,
      redemption: result,
      message: 'Reward purchased successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error completing reward purchase:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});