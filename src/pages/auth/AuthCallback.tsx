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
          // Handle Spotify connection if provider is Spotify
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

          toast({
            title: "Welcome to Streamcentives!",
            description: "Your account has been created successfully.",
          });
          
          navigate('/universal-profile');
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