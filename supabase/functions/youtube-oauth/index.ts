import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID');
    const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET');
    
    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
      console.error('Missing YouTube OAuth credentials:', { 
        hasClientId: !!YOUTUBE_CLIENT_ID, 
        hasClientSecret: !!YOUTUBE_CLIENT_SECRET 
      });
      throw new Error('YouTube OAuth credentials not configured in Supabase secrets');
    }

    // Handle GET request (OAuth callback from YouTube)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (error) {
        // Redirect back to app with error
        const referer = req.headers.get('referer') || 'https://bea56f2e-8da2-46b7-b30b-ab01f7704e03.lovableproject.com';
        const appOrigin = new URL(referer).origin;
        const redirectUrl = `${appOrigin}/youtube/callback?error=${encodeURIComponent(error)}`;
        return Response.redirect(redirectUrl, 302);
      }
      
      if (code) {
        // Redirect back to app with code for processing
        const state = url.searchParams.get('state') || '';
        // Get the origin from the request headers to ensure proper redirect
        const referer = req.headers.get('referer') || 'https://bea56f2e-8da2-46b7-b30b-ab01f7704e03.lovableproject.com';
        const appOrigin = new URL(referer).origin;
        const redirectUrl = `${appOrigin}/youtube/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        return Response.redirect(redirectUrl, 302);
      }
      
      return new Response('Invalid callback', { status: 400 });
    }

    // Handle POST requests (API calls from frontend)
    const { action, code, state } = await req.json();

    if (action === 'get_auth_url') {
      // Generate YouTube OAuth URL
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/youtube-oauth`;
      const scope = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl';
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', YOUTUBE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state || '');

      return new Response(
        JSON.stringify({ auth_url: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange_code') {
      // Exchange authorization code for tokens
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/youtube-oauth`;
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID,
          client_secret: YOUTUBE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
      }

      // Get YouTube channel information
      const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const channelData = await channelResponse.json();
      
      if (!channelResponse.ok) {
        throw new Error('Failed to get YouTube channel info');
      }

      const channel = channelData.items?.[0];
      if (!channel) {
        throw new Error('No YouTube channel found for this account');
      }

      return new Response(
        JSON.stringify({
          success: true,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          channel_id: channel.id,
          channel_name: channel.snippet.title,
          channel_thumbnail: channel.snippet.thumbnails?.default?.url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('YouTube OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});