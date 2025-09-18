import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'get_auth_url') {
      // Generate Google OAuth URL
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const redirectUri = `https://www.streamcentives.io/api/auth/google/callback`;
      const state = crypto.randomUUID();
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);

      return new Response(JSON.stringify({ 
        auth_url: authUrl.toString(),
        state 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'handle_callback') {
      const { code, state } = await req.json();
      
      if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code not provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const redirectUri = `https://www.streamcentives.io/api/auth/google/callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenData);
        return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        console.error('Failed to get user info:', userData);
        return new Response(JSON.stringify({ error: 'Failed to get user info' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create or sign in user with Supabase
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: tokenData.id_token,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update user profile if needed
      if (authData.user) {
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            email: userData.email,
            display_name: userData.name,
            avatar_url: userData.picture,
            username: userData.email?.split('@')[0]?.toLowerCase() || `user_${authData.user.id.substring(0, 8)}`,
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        session: authData.session,
        user: authData.user,
        redirect_url: '/universal-profile'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Google OAuth Handler Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});