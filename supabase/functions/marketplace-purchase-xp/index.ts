import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getErrorMessage } from '../_shared/error-utils.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId, buyerNote } = await req.json();
    
    if (!listingId) {
      throw new Error("Missing required parameter: listingId");
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

    // Initialize service role client for transactions
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get listing details
    const { data: listing, error: listingError } = await supabaseService
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('is_active', true)
      .eq('is_sold', false)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found or unavailable");
    }

    if (listing.seller_id === user.id) {
      throw new Error("Cannot purchase your own listing");
    }

    // Get buyer's XP balance
    const { data: buyerBalance, error: balanceError } = await supabaseService
      .from('user_xp_balances')
      .select('current_xp')
      .eq('user_id', user.id)
      .single();

    if (balanceError || !buyerBalance) {
      throw new Error("Unable to verify XP balance");
    }

    const totalPrice = listing.asking_price_xp;
    const platformFee = Math.floor(totalPrice * 0.02); // 2% platform fee
    const sellerAmount = totalPrice - platformFee;

    if (buyerBalance.current_xp < totalPrice) {
      throw new Error(`Insufficient XP balance. Required: ${totalPrice}, Available: ${buyerBalance.current_xp}`);
    }

    // Execute the marketplace purchase transaction
    const { data: transactionResult, error: transactionError } = await supabaseService
      .rpc('execute_marketplace_purchase_xp', {
        listing_id_param: listingId,
        buyer_id_param: user.id,
        total_xp_amount_param: totalPrice,
        platform_fee_xp_param: platformFee,
        seller_net_xp_param: sellerAmount
      });

    if (transactionError) {
      console.error('Marketplace transaction failed:', transactionError);
      throw new Error('Transaction failed: ' + transactionError.message);
    }

    // Log detailed transactions
    const transactionPromises = [];

    // Buyer payment transaction
    transactionPromises.push(
      supabaseService.from('transactions').insert({
        user_id: user.id,
        related_user_id: listing.seller_id,
        amount_value: totalPrice,
        currency_type: 'XP',
        type: 'MARKETPLACE_SALE_XP',
        status: 'completed',
        metadata: {
          listing_id: listingId,
          platform_fee: platformFee,
          seller_net: sellerAmount,
          buyer_note: buyerNote || null
        }
      })
    );

    // Platform fee transaction
    transactionPromises.push(
      supabaseService.from('transactions').insert({
        user_id: 'platform',
        related_user_id: user.id,
        amount_value: platformFee,
        currency_type: 'XP',
        type: 'MARKETPLACE_FEE_XP',
        status: 'completed',
        metadata: {
          listing_id: listingId,
          original_price: totalPrice,
          buyer_id: user.id,
          seller_id: listing.seller_id
        }
      })
    );

    await Promise.all(transactionPromises);

    // Create fulfillment record if it's a physical reward
    if (listing.reward_type === 'physical') {
      const { error: fulfillmentError } = await supabaseService
        .from('fulfillments')
        .insert({
          reward_redemption_id: listing.reward_redemption_id,
          creator_id: listing.seller_id,
          fan_id: user.id,
          shipping_address: {}, // Will be updated when buyer provides shipping info
          status: 'pending'
        });

      if (fulfillmentError) {
        console.error('Failed to create fulfillment record:', fulfillmentError);
      }
    }

    // Create experience record if it's an experiential reward
    if (listing.reward_type === 'experiential') {
      const verificationCode = await supabaseService.rpc('generate_verification_code');
      
      const { error: experienceError } = await supabaseService
        .from('experiences')
        .insert({
          reward_redemption_id: listing.reward_redemption_id,
          creator_id: listing.seller_id,
          fan_id: user.id,
          experience_type: listing.description || 'marketplace_purchase',
          verification_code: verificationCode,
          status: 'booked'
        });

      if (experienceError) {
        console.error('Failed to create experience record:', experienceError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      transaction_id: transactionResult?.transaction_id,
      total_paid_xp: totalPrice,
      platform_fee_xp: platformFee,
      seller_received_xp: sellerAmount,
      listing_id: listingId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in marketplace-purchase-xp:', error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});