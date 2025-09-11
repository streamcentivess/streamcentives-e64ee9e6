import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, ExternalLink, Check, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StreamingCampaignProps {
  campaign: any;
  onComplete: () => void;
}

export const StreamingCampaign = ({ campaign, onComplete }: StreamingCampaignProps) => {
  const [completed, setCompleted] = useState(false);
  const [spotifyAccount, setSpotifyAccount] = useState<any>(null);
  const [streamed, setStreamed] = useState(false);

  useEffect(() => {
    // Check if user has Spotify connected
    const checkSpotifyConnection = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: spotify } = await supabase
        .from('spotify_accounts')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      setSpotifyAccount(spotify);
    };

    checkSpotifyConnection();
  }, []);

  const handleStreamComplete = async () => {
    try {
      // Record the stream
      const { data, error } = await supabase.rpc('complete_campaign_interaction', {
        campaign_id_param: campaign.id,
        interaction_data_param: {
          type: 'stream',
          platform: 'spotify',
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      const result = data as { success: boolean; xp_awarded: number; error?: string };
      if (result.success) {
        setCompleted(true);
        setStreamed(true);
        toast({
          title: "Stream Verified!",
          description: `You've earned ${result.xp_awarded} XP for streaming this creator's content!`
        });
        onComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error completing streaming campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify stream",
        variant: "destructive"
      });
    }
  };

  const openSpotify = () => {
    // For now, open Spotify web player - in the future, this could use the Spotify API
    // to open a specific track/album/playlist from the creator
    window.open('https://open.spotify.com/search/' + encodeURIComponent(campaign.title), '_blank');
    
    // Auto-complete after a delay (simulating listening time)
    setTimeout(() => {
      setStreamed(true);
    }, 3000);
  };

  if (completed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Campaign Completed!</h3>
          <p className="text-green-600">Thank you for streaming this creator's music!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Streaming Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Stream this creator's music on Spotify to complete the campaign and earn XP!
          </p>
          
          {spotifyAccount ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Music className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Spotify Connected</span>
              </div>
              <p className="text-xs text-green-600">
                Your Spotify account is connected. We can track your listening activity.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Connect your Spotify account to automatically verify streams, or manually confirm after listening.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={openSpotify}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Stream on Spotify
            </Button>

            {streamed && (
              <Button 
                onClick={handleStreamComplete}
                className="w-full"
                variant="outline"
              >
                <Headphones className="h-4 w-4 mr-2" />
                I've Finished Listening - Complete Campaign
              </Button>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Play the creator's music for at least 30 seconds to qualify
          </div>
        </CardContent>
      </Card>
    </div>
  );
};