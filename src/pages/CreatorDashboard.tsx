import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCreatorRealtimeData } from '@/hooks/useCreatorRealtimeData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Users, DollarSign, TrendingUp, Plus, BarChart3, Settings, Target, Gift, Store, Link, CheckCircle, Trophy, Mail, FileText, Palette, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AICampaignBuilder } from '@/components/AICampaignBuilder';
import { ContentAssistant } from '@/components/ContentAssistant';
import { CreatorEarningsDashboard } from '@/components/CreatorEarningsDashboard';
import CreatorAnalyticsDashboard from '@/components/CreatorAnalyticsDashboard';
import CreatorEarningsTracker from '@/components/CreatorEarningsTracker';

const CreatorDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State for merch store
  const [profile, setProfile] = useState<any>(null);
  const [showMerchDialog, setShowMerchDialog] = useState(false);
  const [showAICampaignBuilder, setShowAICampaignBuilder] = useState(false);
  const [showContentAssistant, setShowContentAssistant] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showEarningsTracker, setShowEarningsTracker] = useState(false);
  const [merchStoreData, setMerchStoreData] = useState({
    url: '',
    platform: 'shopify'
  });
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Real-time data hook
  const { 
    metrics, 
    activeCampaigns: realActiveCampaigns, 
    recentActivity, 
    weeklyPerformance, 
    loading: realtimeLoading 
  } = useCreatorRealtimeData();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const fetchLeaderboard = async () => {
      try {
        setLoadingLeaderboard(true);
        const { data, error } = await supabase
          .from('creator_fan_leaderboards')
          .select('fan_user_id,total_listens,total_xp_earned,rank_position')
          .eq('creator_user_id', user.id)
          .order('total_xp_earned', { ascending: false })
          .limit(10);
        if (error) throw error;
        const fanIds = (data || []).map((d: any) => d.fan_user_id);
        let profilesMap: Record<string, any> = {};
        if (fanIds.length) {
          const { data: profiles } = await supabase
            .from('public_profiles' as any)
            .select('user_id, display_name, username, avatar_url')
            .in('user_id', fanIds);
          profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
        }
        setLeaderboard((data || []).map((d: any) => ({
          ...d,
          profile: profilesMap[d.fan_user_id] || null,
        })));
      } catch (e) {
        console.error('Error fetching leaderboard', e);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();

    const channel = supabase
      .channel(`creator-leaderboard-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creator_fan_leaderboards' }, (payload) => {
        const newRow: any = (payload as any).new || {};
        if (newRow?.creator_user_id === user.id) {
          fetchLeaderboard();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };


  const handleConnectMerchStore = async () => {
    try {
      const updateData = {
        merch_store_url: merchStoreData.url,
        merch_store_platform: merchStoreData.platform,
        merch_store_connected: true,
        merch_store_connected_at: new Date().toISOString()
      };

      if (profile) {
        const { error } = await supabase
          .from('profiles')
          .update(updateData as any)
          .eq('user_id', user?.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{
            user_id: user?.id,
            ...updateData
          } as any]);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Merch store connected successfully",
      });

      setShowMerchDialog(false);
      fetchProfile();
    } catch (error) {
      console.error('Error connecting merch store:', error);
      toast({
        title: "Error",
        description: "Failed to connect merch store",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectMerchStore = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          merch_store_connected: false,
          merch_store_url: null,
          merch_store_platform: null,
        } as any)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Merch store disconnected",
      });

      fetchProfile();
    } catch (error) {
      console.error('Error disconnecting merch store:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect merch store",
        variant: "destructive",
      });
    }
  };

  // Handle Spotify connection for existing users
  const handleConnectSpotify = async () => {
    try {
      // Detect if user is on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Use linkIdentity to connect Spotify to existing account
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/creator-dashboard`,
          scopes: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
          skipBrowserRedirect: isMobile ? false : true,
        },
      });

      if (error) {
        toast({
          title: 'Connection Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Only handle popup flow for desktop
      if (!isMobile) {
        const url = data?.url;
        if (url) {
          // Open OAuth flow in a popup window
          const popup = window.open(
            url,
            'spotify-connect',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );
          
          if (!popup) {
            toast({
              title: 'Popup Blocked',
              description: 'Please allow popups for Spotify connection to work.',
              variant: 'destructive',
            });
          } else {
            // Listen for popup close to refresh data
            const checkClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkClosed);
                // Refresh profile data after connection
                window.location.reload();
              }
            }, 1000);
          }
        } else {
          toast({
            title: 'Connection Error',
            description: 'Could not start Spotify connection flow.',
            variant: 'destructive',
          });
        }
      }
      // For mobile, the browser will handle the redirect automatically
    } catch (error) {
      console.error('Spotify connection error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect with Spotify',
        variant: 'destructive',
      });
    }
  };

  // Handle Spotify disconnection
  const handleDisconnectSpotify = async () => {
    try {
      // Get current user identities
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find Spotify identity
      const spotifyIdentity = user.identities?.find(identity => identity.provider === 'spotify');
      if (!spotifyIdentity) {
        toast({
          title: 'No Spotify Connection',
          description: 'No Spotify account found to disconnect.',
          variant: 'destructive',
        });
        return;
      }

      // Unlink the Spotify identity
      const { error } = await supabase.auth.unlinkIdentity(spotifyIdentity);
      if (error) {
        toast({
          title: 'Disconnection Error', 
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Update profile to reflect disconnection
      await supabase
        .from('profiles')
        .update({ spotify_connected: false })
        .eq('user_id', user.id);

      toast({
        title: 'Spotify Disconnected',
        description: 'Your Spotify account has been disconnected.',
      });

      // Refresh the profile data
      fetchProfile();
    } catch (error) {
      console.error('Spotify disconnect error:', error);
      toast({
        title: 'Disconnection Error',
        description: 'Failed to disconnect Spotify',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-primary bg-clip-text text-transparent`}>
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage your campaigns and engage with fans</p>
          </div>
          <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
            <Button onClick={() => navigate('/advanced-analytics')} variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics Hub
            </Button>
            <Button onClick={() => setShowEarningsTracker(true)} variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Earnings
            </Button>
            <Button onClick={() => navigate('/monetization-tools')} variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Monetization
            </Button>
            <Button onClick={() => navigate('/communication-hub')} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Communications
            </Button>
            <Button onClick={() => navigate('/campaigns')} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
            <Button variant="outline" onClick={() => navigate('/universal-profile')}>
              Profile
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fans</p>
                  <p className="text-2xl font-bold">{metrics.totalFans.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">XP Distributed</p>
                  <p className="text-2xl font-bold">{metrics.totalXPDistributed.toLocaleString()}</p>
                </div>
                <div className="xp-orb"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold">{metrics.activeCampaigns}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Creator Earnings Dashboard */}
            <CreatorEarningsDashboard />
            
            {/* Active Campaigns */}
            <Card className="card-modern">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Active Campaigns
                  </CardTitle>
                  <Button size="sm" onClick={() => navigate('/campaigns')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {realtimeLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading campaigns...</p>
                  </div>
                ) : realActiveCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No Active Campaigns</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first campaign to start engaging with fans and earning revenue
                    </p>
                   <Button onClick={() => navigate('/campaigns')} className="bg-sky-400 hover:bg-sky-500 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {realActiveCampaigns.map((campaign) => {
                      const participantCount = campaign.campaign_participants?.length || 0;
                      const daysLeft = campaign.end_date 
                        ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                        : null;
                      
                      return (
                        <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg bg-surface border hover:bg-surface/80 transition-colors cursor-pointer" onClick={() => navigate(`/campaigns`)}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                              <Music className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{campaign.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {participantCount} participants
                                {daysLeft !== null && ` • ${daysLeft} days left`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-success/20 text-success">Active</Badge>
                            <p className="text-sm text-muted-foreground mt-1">{campaign.current_progress || 0} progress</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Overview */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">{metrics.newFansThisWeek}</div>
                    <p className="text-sm text-muted-foreground">New Fans This Week</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">{metrics.streamsGenerated.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Streams Generated</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">{metrics.socialShares}</div>
                    <p className="text-sm text-muted-foreground">Social Shares</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Real-time Leaderboard */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Creator Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLeaderboard ? (
                  <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
                ) : leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet. As fans listen, they’ll appear here.</p>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={entry.fan_user_id} 
                        className="leaderboard-item cursor-pointer hover:bg-surface/50 transition-colors"
                        onClick={() => navigate(`/universal-profile?userId=${entry.fan_user_id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white font-bold text-sm">
                            {entry.rank_position ?? index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.profile?.avatar_url || undefined} alt={`${entry.profile?.display_name || entry.profile?.username || 'Fan'} avatar`} />
                            <AvatarFallback>{(entry.profile?.display_name || entry.profile?.username || 'FN').slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{entry.profile?.display_name || entry.profile?.username || entry.fan_user_id.slice(0,8)}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{entry.total_xp_earned} XP</p>
                          <p className="text-xs text-muted-foreground">{entry.total_listens} listens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Contributors - Now using real leaderboard data */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Contributors This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLeaderboard ? (
                  <p className="text-sm text-muted-foreground">Loading contributors...</p>
                ) : leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contributors yet. As fans engage with your campaigns, they'll appear here.</p>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div 
                        key={entry.fan_user_id} 
                        className="leaderboard-item cursor-pointer hover:bg-surface/50 transition-colors"
                        onClick={() => navigate(`/universal-profile?userId=${entry.fan_user_id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white font-bold text-sm">
                            {entry.rank_position ?? index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.profile?.avatar_url || undefined} alt={`${entry.profile?.display_name || entry.profile?.username || 'Fan'} avatar`} />
                            <AvatarFallback>{(entry.profile?.display_name || entry.profile?.username || 'FN').slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{entry.profile?.display_name || entry.profile?.username || entry.fan_user_id.slice(0,8)}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{entry.total_xp_earned} XP</p>
                          <p className="text-xs text-muted-foreground">{entry.total_listens} listens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Merch Store Integration */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Merch Store
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile?.merch_store_connected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-success">Connected</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {profile.merch_store_platform} Store
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(profile.merch_store_url, '_blank')}
                      className="w-full"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      View Store
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDisconnectMerchStore}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect your merch store to create merchandise campaigns
                    </p>
                    <Dialog open={showMerchDialog} onOpenChange={setShowMerchDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-primary hover:opacity-90">
                          <Store className="h-4 w-4 mr-2" />
                          Connect Store
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Connect Merch Store</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="platform">Platform</Label>
                            <Select 
                              value={merchStoreData.platform} 
                              onValueChange={(value) => setMerchStoreData(prev => ({ ...prev, platform: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="shopify">Shopify</SelectItem>
                                <SelectItem value="woocommerce">WooCommerce</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="url">Store URL</Label>
                            <Input
                              id="url"
                              value={merchStoreData.url}
                              onChange={(e) => setMerchStoreData(prev => ({ ...prev, url: e.target.value }))}
                              placeholder="https://your-store.com"
                            />
                          </div>
                          <Button onClick={handleConnectMerchStore} className="w-full">
                            Connect Store
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spotify Integration */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Spotify for Artists
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile?.spotify_connected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-success">Connected</p>
                        <p className="text-xs text-muted-foreground">Listening events will update your leaderboard in real time</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate('/leaderboards')}>
                        <Trophy className="h-4 w-4 mr-2" />
                        View Leaderboard
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDisconnectSpotify} className="text-destructive hover:text-destructive">
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Connect to enable real-time stream tracking and fan leaderboards.</p>
                    <Button className="w-full bg-gradient-primary hover:opacity-90" onClick={handleConnectSpotify}>
                      Connect Spotify
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowAICampaignBuilder(true)} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Target className="h-4 w-4 mr-2" />
                  AI Campaign Builder
                </Button>
                <Button 
                  onClick={() => setShowContentAssistant(true)} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Content Assistant
                </Button>
                <Button 
                  onClick={() => navigate('/content-creator-studio')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Content Studio
                </Button>
                <Button 
                  onClick={() => navigate('/social-integrations')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Social Integrations
                </Button>
                <Button 
                  onClick={() => navigate('/manage-rewards')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Manage Rewards
                </Button>
              </CardContent>
            </Card>

            {/* AI Tools */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-primary"></div>
                  AI Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-primary text-white hover:shadow-glow transition-all" 
                  onClick={() => setShowAICampaignBuilder(true)}
                >
                  🤖 AI Campaign Builder
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowContentAssistant(true)}
                >
                  ✨ Content Assistant
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/shoutout-generator')}
                >
                  🎤 Shoutout Generator
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/sentiment-analysis')}
                >
                  📊 Sentiment Analysis
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {realtimeLoading ? (
                  <p className="text-sm text-muted-foreground">Loading activity...</p>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No recent activity yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Activity will appear here as fans engage with your campaigns</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 8).map((activity) => {
                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'campaign_join': return 'bg-success';
                          case 'campaign_complete': return 'bg-primary';
                          case 'share': return 'bg-brand-accent';
                          case 'xp_earned': return 'bg-warning';
                          default: return 'bg-muted-foreground';
                        }
                      };

                      return (
                        <div key={activity.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`}></div>
                          <span className="flex-1">{activity.description}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>This Week</CardTitle>
              </CardHeader>
              <CardContent>
                {realtimeLoading ? (
                  <p className="text-sm text-muted-foreground">Loading performance data...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fan Growth</span>
                      <span className={`text-sm font-medium ${weeklyPerformance.fanGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {weeklyPerformance.fanGrowth >= 0 ? '+' : ''}{weeklyPerformance.fanGrowth}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Engagement</span>
                      <span className={`text-sm font-medium ${weeklyPerformance.engagement >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {weeklyPerformance.engagement >= 0 ? '+' : ''}{weeklyPerformance.engagement}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">XP Efficiency</span>
                      <span className="text-sm font-medium text-primary">{weeklyPerformance.xpEfficiency}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className={`text-sm font-medium ${weeklyPerformance.revenue >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {weeklyPerformance.revenue >= 0 ? '+' : ''}${Math.abs(weeklyPerformance.revenue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <AICampaignBuilder
        isOpen={showAICampaignBuilder} 
        onClose={() => setShowAICampaignBuilder(false)} 
      />
      
      {/* Content Assistant Modal */}
      {showContentAssistant && (
        <ContentAssistant 
          profile={profile}
          onClose={() => setShowContentAssistant(false)} 
        />
      )}
    </div>
  );
};

export default CreatorDashboard;