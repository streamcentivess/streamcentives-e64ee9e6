import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, contentId, contentIds, userId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user has active Creator Pro subscription
    const { data: subscription, error: subError } = await supabase
      .from('ai_tool_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('tool_name', 'creator_pro')
      .eq('status', 'active')
      .maybeSingle();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ 
          error: 'Creator Pro subscription required for content boost',
          success: false 
        }),
        { 
          status: 403, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const boostMultiplier = 2.5; // Pro boost multiplier
    const boostDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const boostExpiresAt = new Date(Date.now() + boostDuration);

    // Handle different content types
    if (contentType === 'post' || contentType === 'carousel_post') {
      const idsToBoost = contentIds || [contentId];
      
      for (const id of idsToBoost) {
        // Update post with boost metadata
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            boost_multiplier: boostMultiplier,
            boost_expires_at: boostExpiresAt.toISOString(),
            is_boosted: true,
            boost_type: 'creator_pro',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId);

        if (updateError) {
          console.error(`Error boosting post ${id}:`, updateError);
          continue;
        }

        // Log boost activity
        await supabase
          .from('content_boosts')
          .insert({
            content_id: id,
            content_type: contentType,
            user_id: userId,
            boost_type: 'creator_pro',
            boost_multiplier: boostMultiplier,
            expires_at: boostExpiresAt.toISOString(),
            metadata: {
              auto_applied: true,
              subscription_id: subscription.id,
              applied_at: new Date().toISOString()
            }
          });
      }

      // Update user's boost stats
      await supabase
        .from('profiles')
        .update({
          total_boosts_received: supabase.rpc('increment', { x: idsToBoost.length }),
          last_boost_at: new Date().toISOString(),
          profile_boost_score: supabase.rpc('increment', { x: idsToBoost.length * 25 })
        })
        .eq('user_id', userId);

      return new Response(
        JSON.stringify({
          success: true,
          boosted_content_count: idsToBoost.length,
          boost_multiplier: boostMultiplier,
          expires_at: boostExpiresAt.toISOString(),
          message: `Content boosted successfully! ${idsToBoost.length} items will receive enhanced visibility for 7 days.`
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Handle campaign boosts
    if (contentType === 'campaign') {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', contentId)
        .eq('creator_id', userId)
        .maybeSingle();

      if (campaignError || !campaignData) {
        throw new Error('Campaign not found or access denied');
      }

      // Apply boost using the existing function
      const { data: boostResult, error: boostError } = await supabase
        .rpc('apply_creator_pro_boost', {
          campaign_id_param: contentId,
          creator_id_param: userId
        });

      if (boostError) {
        throw new Error(`Failed to apply campaign boost: ${boostError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          ...boostResult,
          message: 'Campaign boost applied successfully!'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Handle general content boost (for AI-generated content)
    if (contentType === 'ai_content') {
      // Update AI generated content with boost metadata
      const { error: updateError } = await supabase
        .from('ai_generated_content')
        .update({
          boost_applied: true,
          boost_multiplier: boostMultiplier,
          boost_expires_at: boostExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to boost AI content: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          boost_multiplier: boostMultiplier,
          expires_at: boostExpiresAt.toISOString(),
          message: 'AI content boost applied successfully!'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    throw new Error('Invalid content type for boost');

  } catch (error) {
    console.error('Error in boost-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});