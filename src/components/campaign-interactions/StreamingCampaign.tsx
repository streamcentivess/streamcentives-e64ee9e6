import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Music, ExternalLink, Check, Headphones, Play, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { XPRewardAnimation } from '@/components/XPRewardAnimation';

interface StreamingCampaignProps {
  campaign: any;
  onComplete: () => void;
}

export const StreamingCampaign = ({ campaign, onComplete }: StreamingCampaignProps) => {
  const [completed, setCompleted] = useState(false);
  const [spotifyAccount, setSpotifyAccount] = useState<any>(null);
  const [streamed, setStreamed] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [trackUrl, setTrackUrl] = useState<string>('');

  useEffect(() => {
    // Check if user has Spotify connected and get specific track URL
    const checkSpotifyConnection = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: spotify } = await supabase
        .from('spotify_accounts')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      setSpotifyAccount(spotify);
      
      // Set specific track URL if available
      if (campaign.spotify_artist_url) {
        setTrackUrl(campaign.spotify_artist_url);
      } else if (campaign.spotify_artist_id) {
        setTrackUrl(`https://open.spotify.com/track/${campaign.spotify_artist_id}`);
      } else {
        // Use search URL as fallback
        setTrackUrl(`https://open.spotify.com/search/${encodeURIComponent(campaign.title)}`);
      }
    };

    checkSpotifyConnection();
  }, [campaign]);

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
        setXpAwarded(result.xp_awarded);
        setShowXPAnimation(true);
        
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
    // Use the specific track URL
    const spotifyUrl = trackUrl;
    
    // Open Spotify in new tab
    window.open(spotifyUrl, '_blank');
    
    // Show feedback and start tracking
    toast({
      title: "Opened Spotify",
      description: "Play the track and return here to complete the campaign!"
    });
    
    // Start tracking when user opens Spotify
    setIsTracking(true);
    startListenTracking();
  };

  const startListenTracking = () => {
    // Real-time listening progress tracking
    const duration = (campaign.required_listen_duration_seconds || 30) * 1000;
    const interval = 250; // Update every 250ms for smoother progress
    
    let elapsed = 0;
    const tracker = setInterval(() => {
      elapsed += interval;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setListenProgress(progress);
      
      if (progress >= 100) {
        clearInterval(tracker);
        setStreamed(true);
        setIsTracking(false);
        
        toast({
          title: "Listen Complete!",
          description: "You can now complete the campaign to earn XP"
        });
        
        // Record the listen
        recordListen();
      }
    }, interval);
    
    // Auto-stop tracking after 2x duration as safety measure
    setTimeout(() => {
      clearInterval(tracker);
      if (listenProgress < 100) {
        setIsTracking(false);
        toast({
          title: "Tracking Stopped",
          description: "Please try again to complete the listening requirement",
          variant: "destructive"
        });
      }
    }, duration * 2);
  };

  const recordListen = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      // Call the record-listen function
      const { error } = await supabase.functions.invoke('record-listen', {
        body: {
          creator_user_id: campaign.creator_id,
          track_id: campaign.spotify_artist_id || 'unknown',
          track_name: campaign.title,
          artist_name: 'Creator',
          duration_ms: (campaign.required_listen_duration_seconds || 30) * 1000,
          progress_ms: (campaign.required_listen_duration_seconds || 30) * 1000,
        }
      });

      if (error) {
        console.error('Error recording listen:', error);
      }
    } catch (error) {
      console.error('Error in recordListen:', error);
    }
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

          {isTracking && (
            <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-600" />
                  Listening Progress
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Star className="h-3 w-3 text-yellow-500" />
                  +{campaign.xp_reward} XP
                </span>
              </div>
              <Progress value={listenProgress} className="h-3" />
              <div className="flex justify-between text-xs text-green-700">
                <span>{Math.round(listenProgress)}% complete</span>
                <span>{Math.max(0, campaign.required_listen_duration_seconds - Math.round(listenProgress * campaign.required_listen_duration_seconds / 100))}s remaining</span>
              </div>
              <p className="text-xs text-green-600 text-center">
                Keep the music playing to complete the campaign
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={openSpotify}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isTracking}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {trackUrl.includes('/track/') ? "Play Track on Spotify" : 
               trackUrl.includes('/artist/') ? "Visit Artist on Spotify" : 
               "Search on Spotify"}
            </Button>

            {streamed && !isTracking && (
              <Button 
                onClick={handleStreamComplete}
                className="w-full"
                variant="outline"
              >
                <Headphones className="h-4 w-4 mr-2" />
                Complete Campaign - Earn {campaign.xp_reward} XP
              </Button>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Play the creator's music for at least {campaign.required_listen_duration_seconds || 30} seconds to qualify
          </div>
          
          {campaign.spotify_artist_url && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Creator's Spotify:</p>
              <a 
                href={campaign.spotify_artist_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Music className="h-3 w-3" />
                Visit Official Artist Page
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
      
      <XPRewardAnimation 
        xpAmount={xpAwarded}
        show={showXPAnimation}
        onComplete={() => setShowXPAnimation(false)}
      />
    </div>
  );
};