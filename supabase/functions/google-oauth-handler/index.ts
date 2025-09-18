import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();

    // Try to read JSON body if present
    let body: any = {};
    if (method !== 'GET') {
      try { body = await req.json(); } catch { body = {}; }
    }

    const action = body.action || url.searchParams.get('action');

    if (action === 'get_auth_url') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      if (!clientId) {
        return new Response(JSON.stringify({ error: 'Missing GOOGLE_CLIENT_ID' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const origin = body.origin || url.searchParams.get('origin') || 'https://www.streamcentives.io';
      const redirectUri = `${origin}/auth/callback?provider=google_custom`;
      const state = crypto.randomUUID();

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('state', state);

      return new Response(JSON.stringify({ auth_url: authUrl.toString(), state, redirect_uri: redirectUri }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'exchange_code' || action === 'handle_callback') {
      const code = body.code || url.searchParams.get('code');
      if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code not provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: 'Google OAuth secrets not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const origin = body.origin || url.searchParams.get('origin') || 'https://www.streamcentives.io';
      const redirectUri = `${origin}/auth/callback?provider=google_custom`;

      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error('Google token exchange failed', tokenData);
        return new Response(JSON.stringify({ error: 'Token exchange failed', details: tokenData }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Return tokens needed by the client to finish sign-in with Supabase
      return new Response(JSON.stringify({
        success: true,
        id_token: tokenData.id_token,
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('google-oauth-handler error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
