import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Users, DollarSign, TrendingUp, Plus, BarChart3, Settings, Target, Gift, Store, Link, CheckCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const CreatorDashboard = () => {
  const { user, signOut, signInWithSpotify } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for merch store
  const [profile, setProfile] = useState<any>(null);
  const [showMerchDialog, setShowMerchDialog] = useState(false);
  const [merchStoreData, setMerchStoreData] = useState({
    url: '',
    platform: 'shopify'
  });
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Mock data - replace with real data from your API
  const totalFans = 2847;
  const totalXPDistributed = 45650;
  const activeCampaigns = 8;
  const totalRevenue = 1234.56;
  const conversionRate = 12.5;

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
            .from('profiles')
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

  const handleDisconnectSpotify = async () => {
    try {
      await supabase.from('spotify_accounts').delete().eq('user_id', user?.id);
      await supabase.from('profiles').update({ spotify_connected: false } as any).eq('user_id', user?.id);
      toast({ title: 'Disconnected', description: 'Spotify has been disconnected.' });
      fetchProfile();
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
      toast({ title: 'Error', description: 'Failed to disconnect Spotify', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your campaigns and engage with fans</p>
          </div>
          <div className="flex gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fans</p>
                  <p className="text-2xl font-bold">{totalFans.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{totalXPDistributed.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{activeCampaigns}</p>
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
                  <p className="text-2xl font-bold">${totalRevenue}</p>
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
                  <p className="text-2xl font-bold">{conversionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
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
                <div className="space-y-4">
                  {/* Sample Campaign */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Music className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Stream "New Album" Campaign</p>
                        <p className="text-sm text-muted-foreground">647 participants • 4 days left</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-success/20 text-success">Active</Badge>
                      <p className="text-sm text-muted-foreground mt-1">12.4k XP distributed</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Social Media Share Challenge</p>
                        <p className="text-sm text-muted-foreground">234 participants • 7 days left</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-success/20 text-success">Active</Badge>
                      <p className="text-sm text-muted-foreground mt-1">5.8k XP distributed</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Merchandise Promotion</p>
                        <p className="text-sm text-muted-foreground">0 participants • Draft</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Draft</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Not started</p>
                    </div>
                  </div>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">847</div>
                    <p className="text-sm text-muted-foreground">New Fans This Week</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">23.4k</div>
                    <p className="text-sm text-muted-foreground">Streams Generated</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">156</div>
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

            {/* Top Contributors */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Contributors This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['SuperFan23', 'MusicLover99', 'StreamKing', 'FanGirl47', 'MelodyMaster'].map((fan, index) => (
                    <div 
                      key={fan} 
                      className="leaderboard-item cursor-pointer hover:bg-surface/50 transition-colors"
                      onClick={() => navigate('/universal-profile')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{fan.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{fan}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{(2500 - index * 300)} XP</p>
                        <p className="text-xs text-muted-foreground">{15 - index * 2} campaigns</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                    <Button className="w-full bg-gradient-primary hover:opacity-90" onClick={signInWithSpotify}>
                      Connect Spotify
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate('/manage-rewards')}>
                  <Gift className="h-4 w-4 mr-2" />
                  Manage Rewards
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate('/campaigns')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View All Campaigns
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
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
                <Button className="w-full" variant="outline">
                  🤖 AI Campaign Builder
                </Button>
                <Button className="w-full" variant="outline">
                  ✨ Content Assistant
                </Button>
                <Button className="w-full" variant="outline">
                  🎤 Shoutout Generator
                </Button>
                <Button className="w-full" variant="outline">
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>New fan joined campaign</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>1,250 XP distributed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-brand-accent rounded-full"></div>
                    <span>Campaign milestone reached</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span>Reward inventory low</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fan Growth</span>
                    <span className="text-sm font-medium text-success">+12.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Engagement</span>
                    <span className="text-sm font-medium text-success">+8.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">XP Efficiency</span>
                    <span className="text-sm font-medium text-primary">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium text-success">+15.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;