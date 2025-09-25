import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const YouTubeCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState('Processing YouTube connection...');

  useEffect(() => {
    const handleYouTubeCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`YouTube OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from YouTube');
        }

        if (!user) {
          throw new Error('User not authenticated');
        }

        setStatus('Exchanging authorization code...');

        // Exchange the authorization code for tokens
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('youtube-oauth', {
          body: { 
            action: 'exchange_code',
            code: code,
            state: state
          }
        });

        if (tokenError || !tokenData?.success) {
          throw new Error(tokenData?.error || 'Failed to exchange YouTube authorization code');
        }

        setStatus('Storing YouTube account information...');

        // Store YouTube tokens in database
        const { error: accountError } = await supabase
          .from('youtube_accounts')
          .upsert({
            user_id: user.id,
            youtube_channel_id: tokenData.channel_id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || '',
            token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
            scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
          });

        if (accountError) {
          console.error('Error storing YouTube tokens:', accountError);
          throw new Error('Failed to store YouTube account information');
        }

        // Update profile to show YouTube is connected
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            youtube_connected: true,
            youtube_username: tokenData.channel_name,
            youtube_channel_id: tokenData.channel_id,
            youtube_connected_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        toast({
          title: "YouTube Connected!",
          description: `Successfully connected your YouTube channel: ${tokenData.channel_name}`,
        });

        navigate('/social-integrations', { replace: true });

      } catch (error) {
        console.error('YouTube callback error:', error);
        toast({
          title: "YouTube Connection Failed",
          description: error.message || "Failed to connect YouTube account",
          variant: "destructive"
        });
        navigate('/social-integrations', { replace: true });
      }
    };

    handleYouTubeCallback();
  }, [searchParams, navigate, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-xl font-semibold">{status}</h2>
        <p className="text-muted-foreground">Please wait while we connect your YouTube account.</p>
      </div>
    </div>
  );
};

export default YouTubeCallback;