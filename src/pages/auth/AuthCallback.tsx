import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const provider = params.get('provider');
        const code = params.get('code');
        const state = params.get('state');

        // Handle custom Google OAuth flow
        if (provider === 'google_custom' && code) {
          const storedState = sessionStorage.getItem('google_oauth_state');
          if (storedState && state && storedState !== state) {
            toast({
              title: 'Authentication Error',
              description: 'State mismatch. Please try signing in again.',
              variant: 'destructive',
            });
            navigate('/auth/signin');
            return;
          }

          // Exchange code for Google tokens via Edge Function
          const { data: exchangeData, error: exchangeError } = await supabase.functions.invoke('google-oauth-handler', {
            body: { action: 'exchange_code', code, origin: window.location.origin }
          });

          if (exchangeError || !exchangeData?.id_token) {
            console.error('Google code exchange failed:', exchangeError || exchangeData);
            toast({
              title: 'Authentication Error',
              description: 'Google sign-in failed. Please try again.',
              variant: 'destructive',
            });
            navigate('/auth/signin');
            return;
          }

          // Complete sign-in with Supabase using Google ID token
          const { data: idpData, error: idpError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: exchangeData.id_token,
          });

          if (idpError) {
            console.error('Supabase sign-in with ID token failed:', idpError);
            toast({
              title: 'Authentication Error',
              description: idpError.message,
              variant: 'destructive',
            });
            navigate('/auth/signin');
            return;
          }
        }

        // Proceed with standard session handling
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
          navigate('/auth/signin');
          return;
        }

        if (data.session?.user) {
          // Handle provider-specific OAuth connections
          if (data.session.user.app_metadata?.provider === 'spotify') {
            const spotifyTokens = data.session.provider_token ? {
              access_token: data.session.provider_token,
              refresh_token: data.session.provider_refresh_token,
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
            } : null;

            if (spotifyTokens) {
              // Store Spotify tokens in database
              const { error: spotifyError } = await supabase
                .from('spotify_accounts')
                .upsert({
                  user_id: data.session.user.id,
                  spotify_user_id: data.session.user.user_metadata?.provider_id || data.session.user.id,
                  access_token: spotifyTokens.access_token,
                  refresh_token: spotifyTokens.refresh_token || '',
                  token_expires_at: spotifyTokens.expires_at,
                  scope: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
                });

              if (spotifyError) {
                console.error('Error storing Spotify tokens:', spotifyError);
              } else {
                // Update profile to show Spotify is connected
                await supabase
                  .from('profiles')
                  .update({ spotify_connected: true })
                  .eq('user_id', data.session.user.id);
              }
            }
          }

          // Handle YouTube via dedicated flow (no-op here)

          // Check onboarding status
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed, user_id')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }

          if (profile && profile.onboarding_completed) {
            toast({ title: 'Welcome back!', description: 'You have been signed in successfully.' });
            window.history.replaceState(null, '', '/universal-profile');
            navigate('/universal-profile', { replace: true });
          } else {
            toast({ title: 'Welcome to Streamcentives!', description: "Let's set up your profile." });
            window.history.replaceState(null, '', '/role-selection');
            navigate('/role-selection', { replace: true });
          }
        } else {
          navigate('/auth/signin');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        toast({
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication.',
          variant: 'destructive',
        });
        navigate('/auth/signin');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-xl font-semibold">Completing your authentication...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
};

export default AuthCallback;