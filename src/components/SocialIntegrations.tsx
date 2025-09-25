import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Instagram, Music, Twitter, Youtube, Link2, Plus, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ElementType;
  connected: boolean;
  username?: string;
  followers?: number;
  url?: string;
  artistProfile?: boolean;
}

const SocialIntegrations = () => {
  const { user } = useAuth();
  const { hapticImpact } = useMobileCapabilities();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // Load user profile and social connections
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // Initialize platforms with real data
        const platformsData: SocialPlatform[] = [
          {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            connected: false, // TODO: Add instagram connection logic
            username: undefined,
            followers: undefined,
            url: undefined
          },
          {
            id: 'tiktok',
            name: 'TikTok',
            icon: Music,
            connected: false, // TODO: Add tiktok connection logic
            username: undefined,
            followers: undefined,
            url: undefined
          },
          {
            id: 'twitter',
            name: 'Twitter/X',
            icon: Twitter,
            connected: false, // TODO: Add twitter connection logic
            username: undefined,
            followers: undefined,
            url: undefined
          },
          {
            id: 'youtube',
            name: 'YouTube',
            icon: Youtube,
            connected: profileData.youtube_connected,
            username: profileData.youtube_username,
            followers: undefined, // TODO: Get from YouTube API
            url: profileData.youtube_username ? `https://youtube.com/@${profileData.youtube_username}` : undefined
          },
          {
            id: 'spotify',
            name: 'Spotify',
            icon: Music,
            connected: profileData.spotify_connected,
            username: undefined,
            followers: undefined,
            url: undefined,
            artistProfile: true
          }
        ];

        // Load Spotify data if connected
        if (profileData.spotify_connected) {
          loadSpotifyData(platformsData);
        } else {
          setPlatforms(platformsData);
        }
      }
    };

    loadProfile();

    // Set up real-time subscription for profile updates
    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setProfile(payload.new);
          // Reload platforms data when profile changes
          loadProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadSpotifyData = async (platformsData: SocialPlatform[]) => {
    try {
      // Check if user has Spotify account connected
      const { data: spotifyAccount } = await supabase
        .from('spotify_accounts')
        .select('spotify_user_id')
        .eq('user_id', user?.id)
        .single();

      if (spotifyAccount) {
        // TODO: Call Spotify API to get artist profile data
        // For now, show connection with placeholder data
        const updatedPlatforms = platformsData.map(p => 
          p.id === 'spotify' 
            ? { 
                ...p, 
                username: spotifyAccount.spotify_user_id,
                followers: 0, // TODO: Get from Spotify for Artists API
                url: `https://open.spotify.com/artist/${spotifyAccount.spotify_user_id}`
              }
            : p
        );
        setPlatforms(updatedPlatforms);
      } else {
        setPlatforms(platformsData);
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error);
      setPlatforms(platformsData);
    }
  };

  const handleConnect = async (platformId: string) => {
    await hapticImpact();
    
    try {
      switch (platformId) {
        case 'spotify':
          // Redirect to Spotify OAuth
          const spotifyAuthUrl = `https://accounts.spotify.com/authorize?` +
            `client_id=${encodeURIComponent('your_spotify_client_id')}&` +
            `response_type=code&` +
            `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/spotify-callback')}&` +
            `scope=${encodeURIComponent('user-read-email user-read-private')}`;
          window.location.href = spotifyAuthUrl;
          break;
        
        case 'youtube':
          // Call YouTube OAuth function
          const { data, error } = await supabase.functions.invoke('youtube-oauth', {
            body: { action: 'authorize' }
          });
          if (data?.auth_url) {
            window.location.href = data.auth_url;
          } else {
            toast.error('Failed to initialize YouTube connection');
          }
          break;
        
        case 'instagram':
        case 'tiktok':
        case 'twitter':
          toast.info(`${platforms.find(p => p.id === platformId)?.name} integration coming soon!`);
          break;
        
        default:
          toast.error('Platform not supported');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect platform');
    }
  };

  const handleDisconnect = async (platformId: string) => {
    await hapticImpact();
    
    try {
      switch (platformId) {
        case 'spotify':
          // Remove Spotify account
          await supabase
            .from('spotify_accounts')
            .delete()
            .eq('user_id', user?.id);
          
          // Update profile
          await supabase
            .from('profiles')
            .update({ spotify_connected: false })
            .eq('user_id', user?.id);
          break;
        
        case 'youtube':
          // Update profile
          await supabase
            .from('profiles')
            .update({ 
              youtube_connected: false,
              youtube_username: null,
              youtube_channel_id: null
            })
            .eq('user_id', user?.id);
          break;
        
        default:
          break;
      }
      
      toast.success(`Disconnected from ${platforms.find(p => p.id === platformId)?.name}`);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect platform');
    }
  };

  const handleWebhookSave = async () => {
    await hapticImpact();
    toast.success('Webhook URL saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Social Media Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{platform.name}</p>
                       {platform.connected && (
                         <div className="text-sm text-muted-foreground">
                           {platform.username && (
                             <p>{platform.username}</p>
                           )}
                           {platform.followers !== undefined && (
                             <p>{platform.followers.toLocaleString()} fans</p>
                           )}
                           {platform.artistProfile && platform.id === 'spotify' && (
                             <p className="text-green-600">Spotify for Artists</p>
                           )}
                           {platform.url && (
                             <a 
                               href={platform.url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-primary hover:underline text-xs"
                             >
                               View Profile →
                             </a>
                           )}
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {platform.connected ? (
                      <>
                        <Badge variant="secondary" className="text-green-600">
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(platform.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        className="bg-gradient-primary text-white"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Posting Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Posting Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-post">Enable Auto-Posting</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically post content to connected platforms
                </p>
              </div>
              <Switch
                id="auto-post"
                checked={autoPostEnabled}
                onCheckedChange={setAutoPostEnabled}
              />
            </div>
            
            {autoPostEnabled && (
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {platforms.filter(p => p.connected).map(platform => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Switch id={`auto-${platform.id}`} defaultChecked />
                      <Label htmlFor={`auto-${platform.id}`}>{platform.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Webhook Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Get notified when fans interact with your campaigns
              </p>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  placeholder="https://your-webhook-url.com/notify"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <Button onClick={handleWebhookSave} variant="outline">
                  Save
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Available Events:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Campaign participation</li>
                <li>• New messages received</li>
                <li>• XP rewards earned</li>
                <li>• Marketplace purchases</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialIntegrations;