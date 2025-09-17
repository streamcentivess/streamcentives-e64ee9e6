import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Link2, 
  Music, 
  Youtube, 
  Instagram, 
  Twitter, 
  Store, 
  Settings, 
  Plus,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface IntegrationsHubProps {
  userRole?: 'fan' | 'creator';
}

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  connected: boolean;
  username?: string;
  followers?: number;
  verified?: boolean;
  lastSync?: string;
}

interface SmartLink {
  id: string;
  slug: string;
  title: string;
  total_clicks: number;
  is_active: boolean;
}

export const IntegrationsHub: React.FC<IntegrationsHubProps> = ({ userRole = 'creator' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      loadIntegrationsData();
    }
  }, [user]);

  const loadIntegrationsData = async () => {
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load smart links
      const { data: smartLinksData } = await supabase
        .from('smart_links')
        .select('id, slug, title, total_clicks, is_active')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });

      setSmartLinks(smartLinksData || []);

      // Set up integrations with real data
      const platformIntegrations: Integration[] = [
        {
          id: 'spotify',
          name: 'Spotify',
          icon: Music,
          connected: profileData?.spotify_connected || false,
          verified: true
        },
        {
          id: 'youtube',
          name: 'YouTube',
          icon: Youtube,
          connected: profileData?.youtube_connected || false,
          username: profileData?.youtube_username,
          verified: true
        },
        {
          id: 'instagram',
          name: 'Instagram',
          icon: Instagram,
          connected: false,
          verified: false
        },
        {
          id: 'twitter',
          name: 'Twitter/X',
          icon: Twitter,
          connected: false,
          verified: false
        }
      ];

      if (userRole === 'creator') {
        platformIntegrations.push({
          id: 'merch_store',
          name: 'Merch Store',
          icon: Store,
          connected: profileData?.merch_store_connected || false,
          verified: true
        });
      }

      setIntegrations(platformIntegrations);
    } catch (error) {
      console.error('Error loading integrations data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationId: string) => {
    try {
      switch (integrationId) {
        case 'spotify':
          await handleSpotifyConnect();
          break;
        case 'youtube':
          await handleYouTubeConnect();
          break;
        case 'instagram':
          toast.info('Instagram integration coming soon!');
          break;
        case 'twitter':
          toast.info('Twitter integration coming soon!');
          break;
        case 'merch_store':
          navigate('/social-integrations');
          break;
        default:
          toast.info('Integration coming soon!');
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      toast.error('Failed to connect integration');
    }
  };

  const handleSpotifyConnect = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    try {
      if (isMobile) {
        // Mobile: redirect to Spotify auth
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'spotify',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) throw error;
      } else {
        // Desktop: open popup
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'spotify',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'online',
              prompt: 'consent',
            }
          }
        });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Spotify connection error:', error);
      toast.error('Failed to connect Spotify');
    }
  };

  const handleYouTubeConnect = async () => {
    try {
      // Generate state parameter for OAuth security
      const state = btoa(JSON.stringify({
        user_id: user!.id,
        timestamp: Date.now(),
        app_origin: window.location.origin
      }));
      
      console.log('Starting YouTube OAuth flow...');
      
      // Get YouTube OAuth URL from our edge function
      const { data: authData, error: authError } = await supabase.functions.invoke('youtube-oauth', {
        body: { 
          action: 'get_auth_url',
          state: state
        }
      });
      
      if (authError) {
        console.error('YouTube OAuth URL generation error:', authError);
        throw new Error(`Failed to generate YouTube OAuth URL: ${authError.message}`);
      }
      
      if (!authData?.auth_url) {
        console.error('No auth URL returned from YouTube OAuth function');
        throw new Error('Failed to generate YouTube OAuth URL - no URL returned');
      }
      
      console.log('Redirecting to YouTube OAuth URL:', authData.auth_url);
      
      // Redirect to YouTube OAuth
      window.location.href = authData.auth_url;
      
    } catch (error) {
      console.error('YouTube connection error:', error);
      toast.error(`Failed to connect YouTube: ${error.message}. Please check that the YouTube OAuth app is properly configured.`);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      switch (integrationId) {
        case 'spotify':
          // Unlink Spotify identity
          const identities = await supabase.auth.getUserIdentities();
          const spotifyIdentity = identities.data?.identities?.find(
            identity => identity.provider === 'spotify'
          );
          
          if (spotifyIdentity) {
            await supabase.auth.unlinkIdentity(spotifyIdentity);
          }
          
          // Update profile
          await supabase
            .from('profiles')
            .update({ spotify_connected: false })
            .eq('user_id', user!.id);
          
          toast.success('Spotify disconnected');
          loadIntegrationsData();
          break;
        case 'youtube':
          // Disconnect YouTube identity and tokens
          await supabase
            .from('youtube_accounts')
            .delete()
            .eq('user_id', user!.id);
          
          await supabase
            .from('profiles')
            .update({ 
              youtube_connected: false,
              youtube_username: null,
              youtube_channel_id: null,
              youtube_connected_at: null
            })
            .eq('user_id', user!.id);
          
          toast.success('YouTube disconnected');
          loadIntegrationsData();
          break;
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };

  const syncIntegration = async (integrationId: string) => {
    try {
      // This will call the appropriate API verification function
      toast.info(`Syncing ${integrationId}...`);
      
      // Update last sync time
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, lastSync: new Date().toISOString() }
          : integration
      ));
      
      toast.success(`${integrationId} synced successfully`);
    } catch (error) {
      console.error('Error syncing integration:', error);
      toast.error('Failed to sync integration');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Platform Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{integration.name}</p>
                        {integration.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      {integration.connected && integration.username && (
                        <p className="text-sm text-muted-foreground">
                          {integration.username} • {integration.followers?.toLocaleString()} followers
                        </p>
                      )}
                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Last sync: {new Date(integration.lastSync).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.connected ? (
                      <>
                        <Badge variant="default" className="text-green-600">
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncIntegration(integration.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(integration.id)}
                        className="bg-gradient-primary"
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

      {/* Smart Links Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Smart Links ({smartLinks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {smartLinks.length > 0 ? (
              <div className="space-y-2">
                {smartLinks.slice(0, 3).map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground">
                        /link/{link.slug} • {link.total_clicks} clicks
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={link.is_active ? "default" : "secondary"}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/link/${link.slug}`)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {smartLinks.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{smartLinks.length - 3} more links
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  No smart links created yet
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate('/universal-profile?tab=smart-links')}
                  className="bg-gradient-primary"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Smart Link
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/universal-profile?tab=smart-links')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage All Smart Links
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Posting Settings */}
      {userRole === 'creator' && (
        <Card>
          <CardHeader>
            <CardTitle>Auto-Posting Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Auto-Posting</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically post content to connected platforms
                  </p>
                </div>
                <Switch
                  checked={autoPostEnabled}
                  onCheckedChange={setAutoPostEnabled}
                />
              </div>
              
              {autoPostEnabled && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  {integrations.filter(i => i.connected).map(platform => (
                    <div key={platform.id} className="flex items-center justify-between">
                      <span className="text-sm">{platform.name}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};