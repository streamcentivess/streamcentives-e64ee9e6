import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
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

          // Handle YouTube OAuth connection via Google provider with YouTube scopes
          if (data.session.user.app_metadata?.provider === 'google' && data.session.provider_token) {
            // This is handled by dedicated YouTube OAuth flow now
            // YouTube connections go through /youtube/callback instead
          }

          // Check if user already has a complete profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, display_name, user_id')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          // If there's an error fetching profile or no profile exists, treat as new user
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }

          // Check if profile exists and has username (complete profile)
          if (profile && (profile.username || profile.display_name)) {
            // Existing user with profile, redirect to universal profile
            toast({
              title: "Welcome back!",
              description: "You have been signed in successfully.",
            });
            
            window.history.replaceState(null, '', '/universal-profile');
            navigate('/universal-profile', { replace: true });
          } else {
            // New user or incomplete profile, redirect to onboarding
            toast({
              title: "Welcome to Streamcentives!",
              description: "Let's set up your profile.",
            });
            
            window.history.replaceState(null, '', '/role-selection');
            navigate('/role-selection', { replace: true });
          }
        } else {
          navigate('/auth/signin');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication.",
          variant: "destructive"
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