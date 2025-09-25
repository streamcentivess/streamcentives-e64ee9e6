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
    const { action, rewardData, rewardId, paymentMethod, userId } = await req.json();
    
    // Get user authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    console.log(`Processing reward action: ${action}`, { rewardId, userId: user.id });

    switch (action) {
      case 'create_reward':
        return await createReward(supabaseClient, user.id, rewardData);
      case 'purchase_reward':
        return await purchaseReward(supabaseClient, stripe, user.id, rewardId, paymentMethod);
      case 'list_marketplace':
        return await listOnMarketplace(supabaseClient, user.id, rewardData);
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error(`Error in reward manager:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createReward(supabaseClient: any, userId: string, rewardData: any) {
  console.log('Creating reward:', rewardData);

  // Validate required fields
  if (!rewardData.title || !rewardData.quantity_available) {
    throw new Error('Title and quantity are required');
  }

  if (!rewardData.xp_cost && !rewardData.cash_price) {
    throw new Error('Either XP cost or cash price is required');
  }

  // Create reward record
  const { data: reward, error } = await supabaseClient
    .from('rewards')
    .insert([{
      ...rewardData,
      creator_id: userId,
      quantity_redeemed: 0,
      is_active: true,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;

  // Notify real-time subscribers
  await supabaseClient
    .from('api_usage_logs')
    .insert([{
      endpoint: 'reward_created',
      method: 'POST',
      user_id: userId,
      status_code: 200,
      ip_address: '127.0.0.1'
    }]);

  return new Response(JSON.stringify({
    success: true,
    reward
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function purchaseReward(supabaseClient: any, stripe: any, userId: string, rewardId: string, paymentMethod: string) {
  console.log('Processing reward purchase:', { rewardId, userId, paymentMethod });

  // Get reward details
  const { data: reward, error: rewardError } = await supabaseClient
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('is_active', true)
    .single();

  if (rewardError || !reward) {
    throw new Error('Reward not found or inactive');
  }

  // Check availability
  if (reward.quantity_redeemed >= reward.quantity_available) {
    throw new Error('Reward is out of stock');
  }

  if (paymentMethod === 'xp') {
    return await processXPPayment(supabaseClient, userId, reward);
  } else if (paymentMethod === 'cash') {
    return await processCashPayment(supabaseClient, stripe, userId, reward);
  } else {
    throw new Error('Invalid payment method');
  }
}

async function processXPPayment(supabaseClient: any, userId: string, reward: any) {
  if (!reward.xp_cost) {
    throw new Error('XP payment not available for this reward');
  }

  // Check user's XP balance
  const { data: xpBalance } = await supabaseClient
    .from('user_xp_balances')
    .select('current_xp')
    .eq('user_id', userId)
    .single();

  if (!xpBalance || xpBalance.current_xp < reward.xp_cost) {
    throw new Error('Insufficient XP balance');
  }

  // Process XP payment using the enhanced redemption function
  const { data: result, error } = await supabaseClient.rpc('enhanced_redeem_reward', {
    reward_id_param: reward.id,
    user_id_param: userId,
    payment_method_param: 'xp',
    xp_spent_param: reward.xp_cost,
    xp_type_param: reward.creator_xp_only ? 'creator_specific' : 'platform'
  });

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    redemption: result,
    message: 'Reward purchased successfully with XP!'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function processCashPayment(supabaseClient: any, stripe: any, userId: string, reward: any) {
  if (!reward.cash_price) {
    throw new Error('Cash payment not available for this reward');
  }

  // Get user profile for Stripe customer
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('user_id', userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId && profile?.email) {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { user_id: userId }
    });
    customerId = customer.id;

    // Update profile with customer ID
    await supabaseClient
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', userId);
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(reward.cash_price * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    metadata: {
      user_id: userId,
      reward_id: reward.id,
      type: 'reward_purchase'
    }
  });

  return new Response(JSON.stringify({
    success: true,
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function listOnMarketplace(supabaseClient: any, userId: string, listingData: any) {
  console.log('Creating marketplace listing:', listingData);

  const { data: listing, error } = await supabaseClient
    .from('marketplace_listings')
    .insert([{
      seller_id: userId,
      redemption_id: listingData.redemptionId,
      asking_price_cents: listingData.askingPriceCents,
      asking_price_xp: listingData.askingPriceXP,
      description: listingData.description,
      condition: 'new',
      is_active: true,
      is_sold: false
    }])
    .select()
    .single();

  if (error) throw error;

  // Update redemption record
  await supabaseClient
    .from('reward_redemptions')
    .update({ 
      is_listed_on_marketplace: true,
      marketplace_listing_id: listing.id 
    })
    .eq('id', listingData.redemptionId);

  return new Response(JSON.stringify({
    success: true,
    listing
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}