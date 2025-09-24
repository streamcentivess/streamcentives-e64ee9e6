import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Star, Gift, Target, Music, Users, Calendar, TrendingUp, Plus, Award, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FanRewardsTab from '@/components/FanRewardsTab';
import { FanShoutouts } from '@/components/FanShoutouts';
import { LeaderboardPosition } from '@/components/LeaderboardPosition';
import { XPRewardAnimation } from '@/components/XPRewardAnimation';
import { EnhancedXPBalance } from '@/components/EnhancedXPBalance';
import { useIsMobile } from '@/hooks/use-mobile';
import { IntegrationsHub } from '@/components/IntegrationsHub';
import { CreatorToolsHub } from '@/components/CreatorToolsHub';

const FanDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Real data state - starts at 0 until engagement
  const [metrics, setMetrics] = useState({
    xpBalance: 0,
    totalXPEarned: 0,
    currentRank: null as number | null,
    completedCampaigns: 0,
    activeCampaigns: 0,
    totalStreams: 0,
    achievements: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [leaderboardPositions, setLeaderboardPositions] = useState<Record<string, any>>({});
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpAnimationAmount, setXpAnimationAmount] = useState(0);

  // Tier system
  const nextTierXP = 2000;
  const currentTier = metrics.xpBalance < 1000 ? 'Bronze' : metrics.xpBalance < 2000 ? 'Silver' : 'Gold';
  const nextTier = metrics.xpBalance < 1000 ? 'Silver' : metrics.xpBalance < 2000 ? 'Gold' : 'Platinum';

  useEffect(() => {
    if (user) {
      fetchFanMetrics();
    }
  }, [user]);

  // Set up real-time XP balance updates and leaderboard changes
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('fan-dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_xp_balances',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        console.log('Fan Dashboard XP balance updated:', payload);
        if (payload.new && typeof payload.new.current_xp === 'number') {
          const oldXP = metrics.xpBalance;
          const newXP = payload.new.current_xp;
          const xpGained = newXP - oldXP;
          
          if (xpGained > 0) {
            setXpAnimationAmount(xpGained);
            setShowXPAnimation(true);
          }
          
          setMetrics(prev => ({
            ...prev,
            xpBalance: newXP,
            totalXPEarned: payload.new.total_earned_xp || prev.totalXPEarned
          }));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creator_fan_leaderboards',
        filter: `fan_user_id=eq.${user.id}`
      }, (payload: any) => {
        console.log('Leaderboard position updated:', payload);
        if (payload.new) {
          setLeaderboardPositions(prev => ({
            ...prev,
            [payload.new.creator_user_id]: {
              position: payload.new.rank_position,
              totalXP: payload.new.total_xp_earned,
              loading: false
            }
          }));
          
          // Add to recent activity
          setRecentActivity(prev => [{
            type: 'leaderboard',
            message: `Moved to position #${payload.new.rank_position} on leaderboard`,
            timestamp: new Date().toISOString(),
            xp: payload.new.total_xp_earned
          }, ...prev.slice(0, 4)]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaign_participants',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        console.log('Campaign participation updated:', payload);
        if (payload.new && payload.new.status === 'completed' && payload.old?.status !== 'completed') {
          // Add campaign completion to recent activity
          setRecentActivity(prev => [{
            type: 'campaign_complete',
            message: `Completed campaign and earned ${payload.new.xp_earned || 0} XP!`,
            timestamp: new Date().toISOString(),
            xp: payload.new.xp_earned || 0
          }, ...prev.slice(0, 4)]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, metrics.xpBalance]);

  const fetchFanMetrics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get XP balance
      const { data: xpData } = await supabase
        .from('user_xp_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get campaign participation
      const { data: campaignData } = await supabase
        .from('campaign_participants')
        .select('*, campaigns(*)')
        .eq('user_id', user.id);

      // Get streaming activity
      const { data: streamData } = await supabase
        .from('spotify_listens')
        .select('*, creator_user_id')
        .eq('fan_user_id', user.id);

      // Calculate metrics
      const xpBalance = xpData?.current_xp || 0;
      const totalXPEarned = xpData?.total_earned_xp || 0;
      const completedCampaigns = campaignData?.filter(c => c.status === 'completed').length || 0;
      const activeCampaigns = campaignData?.filter(c => c.status === 'active').length || 0;
      const totalStreams = streamData?.length || 0;

      // Get rank (simplified - would need more complex query for real ranking)
      let currentRank = null;
      if (totalXPEarned > 0) {
        const { count } = await supabase
          .from('user_xp_balances')
          .select('*', { count: 'exact', head: true })
          .gt('total_earned_xp', totalXPEarned);
        currentRank = (count || 0) + 1;
      }

      setMetrics({
        xpBalance,
        totalXPEarned,
        currentRank,
        completedCampaigns,
        activeCampaigns,
        totalStreams,
        achievements: [] // Will be populated when achievement system is implemented
      });

      // Set active campaigns
      const activeUserCampaigns = campaignData?.filter(c => c.campaigns?.status === 'active') || [];
      setActiveCampaigns(activeUserCampaigns);

      // Set recent activity based on actual data
      const activities = [];
      if (streamData && streamData.length > 0) {
        const recentStream = streamData[streamData.length - 1];
        activities.push({
          type: 'stream',
          message: `Streamed ${recentStream.track_name || 'a track'}`,
          xp: 10,
          timestamp: recentStream.listened_at
        });
      }
      
      const recentCampaign = campaignData?.find(c => c.status === 'active');
      if (recentCampaign) {
        activities.push({
          type: 'campaign',
          message: `Joined "${recentCampaign.campaigns?.title}" campaign`,
          timestamp: recentCampaign.joined_at
        });
      }

      setRecentActivity(activities);

      // Get top artists from streaming data
      if (streamData && streamData.length > 0) {
        const artistGroups = streamData.reduce((acc, stream) => {
          const artistId = stream.creator_user_id;
          if (!acc[artistId]) {
            acc[artistId] = { artistId, streams: 0, xp: 0 };
          }
          acc[artistId].streams++;
          acc[artistId].xp += 10; // Assume 10 XP per stream
          return acc;
        }, {} as Record<string, any>);

        const topArtistIds = Object.values(artistGroups)
          .sort((a: any, b: any) => b.xp - a.xp)
          .slice(0, 3)
          .map((a: any) => a.artistId);

        if (topArtistIds.length > 0) {
          // Get profiles using the safe function
          const profilePromises = topArtistIds.map(id => 
            supabase.rpc('get_public_profile_safe', { target_user_id: id })
          );
          const profileResults = await Promise.all(profilePromises);
          const artistProfiles = profileResults
            .map(result => result.data?.[0])
            .filter(Boolean);

          const artistProfilesSafe = (artistProfiles as any[]) || [];
          const artistsWithData = topArtistIds.map(artistId => {
            const profile = artistProfilesSafe.find((p: any) => p.user_id === artistId) || {};
            const stats = artistGroups[artistId];
            return {
              ...(profile as any),
              xp: stats.xp,
              streams: stats.streams
            };
          });
          
          setTopArtists(artistsWithData);
          
          // Get leaderboard positions for top artists
          const { data: leaderboardData } = await supabase
            .from('creator_fan_leaderboards')
            .select('creator_user_id, rank_position, total_xp_earned')
            .eq('fan_user_id', user.id)
            .in('creator_user_id', topArtistIds);
            
          const positions: Record<string, any> = {};
          (leaderboardData || []).forEach(lb => {
            positions[lb.creator_user_id] = {
              position: lb.rank_position,
              totalXP: lb.total_xp_earned,
              loading: false
            };
          });
          setLeaderboardPositions(positions);
        }
      }

    } catch (error) {
      console.error('Error fetching fan metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'p-2 pb-20' : 'p-4'}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-primary bg-clip-text text-transparent`}>
              Fan Dashboard
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          {!isMobile && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/universal-profile')}>
                Profile
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-5 h-12' : 'grid-cols-5'}`}>
            <TabsTrigger value="overview" className={isMobile ? 'text-xs' : ''}>Overview</TabsTrigger>
            <TabsTrigger value="rewards" className={isMobile ? 'text-xs' : ''}>Rewards</TabsTrigger>
            <TabsTrigger value="activity" className={isMobile ? 'text-xs' : ''}>Activity</TabsTrigger>
            <TabsTrigger value="creator-tools" className={isMobile ? 'text-xs' : ''}>Creator Tools</TabsTrigger>
            <TabsTrigger value="integrations" className={isMobile ? 'text-xs' : ''}>Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Overview */}
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
              <Card className="card-modern">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total XP</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-primary">{metrics.xpBalance.toLocaleString()}</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                          onClick={async () => {
                            if (!user) return;
                            const { data } = await supabase
                              .from('user_xp_balances')
                              .select('current_xp, total_earned_xp')
                              .eq('user_id', user.id)
                              .maybeSingle();
                            
                            if (data) {
                              setMetrics(prev => ({
                                ...prev,
                                xpBalance: data.current_xp || 0,
                                totalXPEarned: data.total_earned_xp || 0
                              }));
                              toast({
                                title: "Refreshed",
                                description: "XP balance updated",
                              });
                            }
                          }}
                        >
                          <TrendingUp className="h-3 w-3 text-primary" />
                        </Button>
                      </div>
                    </div>
                    <div className="xp-orb"></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Global Rank</p>
                      <p className="text-2xl font-bold">
                        {metrics.currentRank ? `#${metrics.currentRank}` : '--'}
                      </p>
                    </div>
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Campaigns</p>
                      <p className="text-2xl font-bold">{metrics.completedCampaigns}</p>
                    </div>
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Quests</p>
                      <p className="text-2xl font-bold">{metrics.activeCampaigns}</p>
                    </div>
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-3 gap-6'}`}>
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress to Next Tier */}
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Progress to {nextTier} Tier
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.xpBalance === 0 ? (
                      <div className="text-center py-8">
                        <div className="xp-orb mb-4 mx-auto opacity-50"></div>
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">Start Your Journey</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Earn your first XP by streaming music, joining campaigns, and engaging with creators
                        </p>
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <Button onClick={() => navigate('/fan-campaigns')} className="bg-sky-400 hover:bg-sky-500 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Browse Campaigns
                          </Button>
                          <Button onClick={() => navigate('/streamseeker')} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                            <Music className="h-4 w-4 mr-2" />
                            Discover Creators
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{metrics.xpBalance} XP</span>
                          <span>{nextTierXP} XP</span>
                        </div>
                        <Progress value={(metrics.xpBalance / nextTierXP) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          {nextTierXP - metrics.xpBalance} XP until {nextTier} Tier
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Campaigns */}
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Active Campaigns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeCampaigns.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Active Campaigns</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Join campaigns to earn XP, unlock rewards, and support your favorite creators
                        </p>
                        <Button onClick={() => navigate('/fan-campaigns')} className="bg-sky-400 hover:bg-sky-500 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Browse Available Campaigns
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeCampaigns.map((campaign, index) => (
                          <div key={campaign.id || index} className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {campaign.campaigns?.title?.slice(0, 2).toUpperCase() || 'CA'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{campaign.campaigns?.title || 'Campaign'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {campaign.progress || 0}% complete
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-primary/20 text-primary">
                                +{campaign.campaigns?.xp_reward || 0} XP
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-1">
                                {campaign.status}
                              </p>
                            </div>
                          </div>
                        ))}
                        <Button 
                          className="w-full bg-sky-400 hover:bg-sky-500 text-white"
                          onClick={() => navigate('/fan-campaigns')}
                        >
                          View All Campaigns
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          Your activity will appear here as you engage with campaigns and streams
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-surface border">
                            <div className="flex-shrink-0 mt-1">
                              {activity.type === 'stream' ? (
                                <Music className="h-4 w-4 text-primary" />
                              ) : activity.type === 'leaderboard' ? (
                                <Trophy className="h-4 w-4 text-yellow-500" />
                              ) : activity.type === 'campaign_complete' ? (
                                <Award className="h-4 w-4 text-green-500" />
                              ) : (
                                <Target className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{activity.message}</p>
                              {activity.xp && (
                                <Badge className="bg-primary/20 text-primary mt-1">
                                  +{activity.xp} XP
                                </Badge>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recently'}
                              </p>
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
                {/* Quick Actions */}
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" onClick={() => navigate('/fan-campaigns')}>
                      <Target className="h-4 w-4 mr-2" />
                      Browse Campaigns
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => navigate('/marketplace')}>
                      <Gift className="h-4 w-4 mr-2" />
                      Redeem Rewards
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => navigate('/leaderboards')}>
                      <Trophy className="h-4 w-4 mr-2" />
                      View Leaderboards
                    </Button>
                  </CardContent>
                </Card>

                  {/* Top Supported Artists with Leaderboard Positions */}
                  <Card className="card-modern">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Top Supported Artists
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topArtists.length === 0 ? (
                        <div className="text-center py-8">
                          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Artists Yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Start streaming to discover and support artists
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {topArtists.map((artist, index) => (
                            <div key={artist.user_id || index} className="space-y-3 p-3 rounded-lg bg-surface/50 border">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={artist.avatar_url} />
                                    <AvatarFallback>
                                      {(artist.display_name || artist.username || 'A').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {artist.display_name || artist.username || 'Unknown Artist'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {artist.streams} streams • {artist.xp} XP earned
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Trophy className="h-3 w-3" />
                                  #{index + 1}
                                </Badge>
                              </div>
                              
                              {/* Leaderboard Position */}
                              {artist.user_id && (
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  <span className="text-xs text-muted-foreground">Your leaderboard position:</span>
                                  <LeaderboardPosition 
                                    creatorId={artist.user_id} 
                                    className="text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                {/* Achievements */}
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.achievements.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          Complete activities to unlock achievements!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {metrics.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-success/20 text-success">
                              <Star className="h-3 w-3 mr-1" />
                              {achievement.name}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <FanRewardsTab />
              </div>
              <div>
                <EnhancedXPBalance />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="creator-tools" className="space-y-6 mt-6">
            <CreatorToolsHub userRole="fan" profile={profile} />
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <IntegrationsHub userRole="fan" />
          </TabsContent>
        </Tabs>
        
        {/* XP Reward Animation */}
        <XPRewardAnimation
          xpAmount={xpAnimationAmount}
          show={showXPAnimation}
          onComplete={() => setShowXPAnimation(false)}
        />
      </div>
    </div>
  );
};

export default FanDashboard;
