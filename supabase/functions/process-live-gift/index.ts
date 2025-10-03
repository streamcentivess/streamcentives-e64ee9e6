import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { streamId, creatorId, giftType, giftValue, message } = await req.json();

    if (!streamId || !creatorId || !giftType || !giftValue) {
      throw new Error('Missing required fields');
    }

    // Verify stream is live
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('status')
      .eq('id', streamId)
      .single();

    if (streamError || stream.status !== 'live') {
      throw new Error('Stream is not live');
    }

    // Check user XP balance
    const { data: balance, error: balanceError } = await supabase
      .from('user_xp_balances')
      .select('current_xp')
      .eq('user_id', user.id)
      .single();

    if (balanceError || !balance || balance.current_xp < giftValue) {
      throw new Error('Insufficient XP balance');
    }

    // Deduct XP from sender
    const { error: deductError } = await supabase
      .from('user_xp_balances')
      .update({
        current_xp: balance.current_xp - giftValue,
        total_spent_xp: supabase.rpc('increment', { row_id: user.id, increment_by: giftValue })
      })
      .eq('user_id', user.id);

    if (deductError) throw deductError;

    // Calculate platform fee (2%) and creator share (98%)
    const platformFee = Math.floor(giftValue * 0.02);
    const creatorShare = giftValue - platformFee;

    // Add XP to creator
    const { error: addError } = await supabase
      .from('user_xp_balances')
      .upsert({
        user_id: creatorId,
        current_xp: supabase.raw(`current_xp + ${creatorShare}`),
        total_earned_xp: supabase.raw(`total_earned_xp + ${creatorShare}`)
      }, {
        onConflict: 'user_id'
      });

    if (addError) throw addError;

    // Record gift
    const { data: gift, error: giftError } = await supabase
      .from('live_stream_gifts')
      .insert({
        stream_id: streamId,
        sender_id: user.id,
        gift_type: giftType,
        gift_value_xp: giftValue,
        message: message || null
      })
      .select()
      .single();

    if (giftError) throw giftError;

    // Update stream stats
    await supabase
      .from('live_streams')
      .update({
        total_gifts_received: supabase.raw('total_gifts_received + 1'),
        total_xp_earned: supabase.raw(`total_xp_earned + ${giftValue}`)
      })
      .eq('id', streamId);

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      related_user_id: creatorId,
      amount_value: giftValue,
      currency_type: 'XP',
      type: 'LIVE_GIFT',
      status: 'completed',
      metadata: {
        stream_id: streamId,
        gift_type: giftType,
        gift_id: gift.id,
        platform_fee: platformFee,
        creator_share: creatorShare
      }
    });

    // Create notification for creator
    await supabase.from('notifications').insert({
      user_id: creatorId,
      type: 'live_gift',
      title: '🎁 New Gift!',
      message: `Someone sent you ${giftType} (${giftValue} XP)`,
      data: {
        gift_type: giftType,
        gift_value: giftValue,
        stream_id: streamId,
        sender_id: user.id
      },
      priority: 'high'
    });

    return new Response(
      JSON.stringify({ success: true, gift }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing gift:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
