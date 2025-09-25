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
      case 'spotify_follow':
        verified = await verifySpotifyFollow(actionUrl, userId);
        break;
      case 'spotify_save':
        verified = await verifySpotifySave(actionUrl, userId);
        break;
      case 'spotify_play':
        verified = await verifySpotifyPlay(actionUrl, userId);
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
    console.error('Spotify verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function verifySpotifyFollow(artistUrl: string, userId: string): Promise<boolean> {
  try {
    // Extract artist ID from URL
    const artistId = extractSpotifyArtistId(artistUrl);
    if (!artistId) return false;

    // Get user's Spotify access token from their profile/auth
    const accessToken = await getUserSpotifyToken(userId);
    if (!accessToken) {
      console.error('User does not have Spotify connected');
      return false;
    }

    // Check if user follows the artist using Spotify Web API
    const response = await fetch(
      `https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Spotify API error:', response.status, await response.text());
      return false;
    }

    const [isFollowing] = await response.json();
    return isFollowing;

  } catch (error) {
    console.error('Spotify follow verification error:', error);
    return false;
  }
}

async function verifySpotifySave(trackUrl: string, userId: string): Promise<boolean> {
  try {
    const trackId = extractSpotifyTrackId(trackUrl);
    if (!trackId) return false;

    const accessToken = await getUserSpotifyToken(userId);
    if (!accessToken) return false;

    // Check if user has saved the track
    const response = await fetch(
      `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) return false;

    const [isSaved] = await response.json();
    return isSaved;

  } catch (error) {
    console.error('Spotify save verification error:', error);
    return false;
  }
}

async function verifySpotifyPlay(trackUrl: string, userId: string): Promise<boolean> {
  try {
    const trackId = extractSpotifyTrackId(trackUrl);
    if (!trackId) return false;

    // For play verification, we would need to:
    // 1. Check recent listening history
    // 2. Use our existing spotify_listens table
    // 3. Cross-reference with user's recent activity
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user has recent listen activity for this track
    const { data: recentListens } = await supabaseClient
      .from('spotify_listens')
      .select('*')
      .eq('fan_user_id', userId)
      .eq('track_id', trackId)
      .gte('listened_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(1);

    return !!(recentListens && recentListens.length > 0);

  } catch (error) {
    console.error('Spotify play verification error:', error);
    return false;
  }
}

async function getUserSpotifyToken(userId: string): Promise<string | null> {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's Spotify identity and access token
    const { data: identity } = await supabaseClient.auth.getUserIdentities();
    
    // This is a simplified approach - in production, you'd need to:
    // 1. Store and refresh Spotify tokens properly
    // 2. Handle token expiration
    // 3. Use proper OAuth flow
    
    // For now, return null to indicate we need proper Spotify OAuth integration
    return null;
    
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return null;
  }
}

function extractSpotifyArtistId(url: string): string | null {
  const match = url.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}