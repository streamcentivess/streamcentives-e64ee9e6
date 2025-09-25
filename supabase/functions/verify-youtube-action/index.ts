import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  actionId: string;
  actionType: string;
  actionUrl: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { actionId, actionType, actionUrl, userId }: VerificationRequest = await req.json();

    let verified = false;
    let verificationData: any = {};

    switch (actionType) {
      case 'youtube_subscribe':
        verified = await verifyYouTubeSubscription(actionUrl, userId);
        break;
      case 'youtube_watch':
        verified = await verifyYouTubeWatch(actionUrl, userId);
        break;
      case 'youtube_like':
        verified = await verifyYouTubeLike(actionUrl, userId);
        break;
      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }

    if (verified) {
      // Award XP and record the action completion
      const { data: action } = await supabaseClient
        .from('smart_link_actions')
        .select('xp_reward')
        .eq('id', actionId)
        .single();

      if (action) {
        // Update user XP
        await supabaseClient.rpc('handle_xp_purchase', {
          user_id_param: userId,
          xp_amount_param: action.xp_reward
        });

        // Record action completion
        await supabaseClient
          .from('smart_link_action_completions')
          .insert([{
            action_id: actionId,
            user_id: userId,
            verification_data: verificationData,
            completed_at: new Date().toISOString()
          }]);
      }
    }

    return new Response(
      JSON.stringify({ 
        verified, 
        message: verified ? 'Action verified successfully!' : 'Action could not be verified',
        verificationData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('YouTube verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function verifyYouTubeSubscription(channelUrl: string, userId: string): Promise<boolean> {
  try {
    // Extract channel ID from URL
    const channelId = extractYouTubeChannelId(channelUrl);
    if (!channelId) return false;

    // Use YouTube Data API to check subscription
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      console.error('YouTube API key not configured');
      return false;
    }

    // Get user's YouTube account info (would need OAuth integration)
    // This is a simplified check - in production, you'd need proper OAuth flow
    
    // For now, return true as a placeholder
    // In production, implement proper YouTube Data API v3 subscription check:
    // GET https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&forChannelId={channelId}&mine=true
    
    console.log(`Verifying YouTube subscription for channel: ${channelId}, user: ${userId}`);
    return true; // Placeholder - implement actual verification
    
  } catch (error) {
    console.error('YouTube subscription verification error:', error);
    return false;
  }
}

async function verifyYouTubeWatch(videoUrl: string, userId: string): Promise<boolean> {
  try {
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) return false;

    // In production, you would:
    // 1. Check YouTube Analytics API for watch time
    // 2. Use YouTube Data API to verify video engagement
    // 3. Cross-reference with user's YouTube account
    
    console.log(`Verifying YouTube watch for video: ${videoId}, user: ${userId}`);
    return true; // Placeholder
    
  } catch (error) {
    console.error('YouTube watch verification error:', error);
    return false;
  }
}

async function verifyYouTubeLike(videoUrl: string, userId: string): Promise<boolean> {
  try {
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) return false;

    // Use YouTube Data API to check if user liked the video:
    // GET https://www.googleapis.com/youtube/v3/videos/getRating?id={videoId}
    
    console.log(`Verifying YouTube like for video: ${videoId}, user: ${userId}`);
    return true; // Placeholder
    
  } catch (error) {
    console.error('YouTube like verification error:', error);
    return false;
  }
}

function extractYouTubeChannelId(url: string): string | null {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}