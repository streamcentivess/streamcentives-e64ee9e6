import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Get reward details
    const { data: reward, error: rewardError } = await supabaseService
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
      // Enhanced XP payment with proper type checking
      let xpToSpend = reward.xp_cost;
      let xpType = 'platform';

      // Check if reward requires creator-specific XP
      if (reward.creator_xp_only) {
        xpType = 'creator_specific';
        
        // Check user's creator-specific XP balance
        const { data: creatorXP } = await supabaseService
          .from('user_xp_detailed_balances')
          .select('current_xp')
          .eq('user_id', user.id)
          .eq('xp_type', 'creator_specific')
          .eq('creator_id', reward.creator_id)
          .single();

        if (!creatorXP || creatorXP.current_xp < xpToSpend) {
          return new Response(
            JSON.stringify({ 
              error: "Insufficient creator-specific XP", 
              required: xpToSpend,
              available: creatorXP?.current_xp || 0,
              creatorId: reward.creator_id
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
      } else {
        // Check platform XP balance
        const { data: platformXP } = await supabaseService
          .from('user_xp_balances')
          .select('current_xp')
          .eq('user_id', user.id)
          .single();

        if (!platformXP || platformXP.current_xp < xpToSpend) {
          return new Response(
            JSON.stringify({ 
              error: "Insufficient XP", 
              required: xpToSpend,
              available: platformXP?.current_xp || 0
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
      }

      // Process enhanced reward redemption
      const { data: redemptionResult, error: redemptionError } = await supabaseService.rpc('enhanced_redeem_reward', {
        reward_id_param: rewardId,
        user_id_param: user.id,
        payment_method_param: 'xp',
        xp_spent_param: xpToSpend,
        xp_type_param: xpType
      });

      if (redemptionError) {
        console.error('Redemption error:', redemptionError);
        throw redemptionError;
      }

      // Handle instant delivery based on delivery type
      if (redemptionResult.instant_delivery) {
        const deliveryData = JSON.parse(redemptionResult.delivery_data || '{}');
        
        // Handle different delivery types
        if (reward.delivery_type === 'digital_asset') {
          // Digital assets are handled via the secure URL generation function
          // No additional processing needed here
        } else if (reward.delivery_type === 'experience') {
          // Create experience record with verification code
          const { data: experienceData, error: expError } = await supabaseService
            .from('experiences')
            .insert({
              reward_redemption_id: redemptionResult.redemption_id,
              creator_id: reward.creator_id,
              fan_id: user.id,
              experience_type: reward.experience_type || 'meet_greet',
              verification_code: deliveryData.verification_code,
              status: 'scheduled',
              instructions: reward.instructions || 'Present this ticket to the creator for verification.'
            })
            .select()
            .single();

          if (expError) {
            console.error('Experience creation error:', expError);
          }

          // Generate QR code for the experience
          if (experienceData) {
            await supabaseService.functions.invoke('manage-experiences', {
              body: {
                action: 'generate-qr',
                experienceId: experienceData.id
              }
            });
          }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          redemption: redemptionResult,
          instantDelivery: reward.instant_delivery,
          deliveryType: reward.delivery_type
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (paymentMethod === 'cash') {
      // Enhanced cash payment with revenue sharing will be handled by Stripe webhooks
      return new Response(
        JSON.stringify({ error: "Cash payments handled via separate Stripe flow" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 501 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid payment method" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("Error in enhanced-reward-purchase:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});