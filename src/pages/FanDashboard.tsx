import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Star, Gift, Target, Music, Users, Calendar, TrendingUp, Plus, Award, Medal, Sparkles, Flame, Zap, Heart } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { MobileContainer, MobileHeader, MobileCard } from '@/components/ui/mobile-container';

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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-primary to-secondary bg-clip-border mx-auto"></div>
            <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-primary/20 to-secondary/20"></div>
          </div>
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg font-medium text-gradient-primary"
          >
            Loading your fan universe...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen bg-gradient-to-br from-background via-surface to-background ${isMobile ? 'p-2 pb-20' : 'p-4'}`}
    >
      {/* Hero Section - TikTok Style */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden hero-gradient py-8 text-center mb-6 rounded-3xl"
      >
        <div className="absolute inset-0 bg-grid-subtle opacity-20"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="flex items-center justify-center gap-3"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center"
            >
              <Heart className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-4xl font-black text-gradient-primary">
              Fan Central
            </h1>
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center"
            >
              <Flame className="h-6 w-6 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg font-medium text-muted-foreground"
          >
            Your passion powers the music world 🎵✨
          </motion.p>
        </div>
      </motion.div>

      <MobileContainer>
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}
          >
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
          </motion.div>

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
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'}`}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <MobileCard className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-200/20 hover:border-purple-400/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Total XP</p>
                          <div className="flex items-center gap-2">
                            <motion.p 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1, type: "spring" }}
                              className="text-2xl font-black text-gradient-primary"
                            >
                              {metrics.xpBalance.toLocaleString()}
                            </motion.p>
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
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          <div className="xp-orb"></div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </MobileCard>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <MobileCard className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-200/20 hover:border-yellow-400/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"></div>
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Global Rank</p>
                          <motion.p 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.2, type: "spring" }}
                            className="text-2xl font-black text-gradient-primary"
                          >
                            {metrics.currentRank ? `#${metrics.currentRank}` : '--'}
                          </motion.p>
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Trophy className="h-8 w-8 text-yellow-500" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </MobileCard>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <MobileCard className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-200/20 hover:border-blue-400/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Campaigns</p>
                          <motion.p 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.4, type: "spring" }}
                            className="text-2xl font-black text-gradient-primary"
                          >
                            {metrics.completedCampaigns}
                          </motion.p>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Target className="h-8 w-8 text-blue-500" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </MobileCard>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <MobileCard className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-200/20 hover:border-green-400/40 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Active Quests</p>
                          <motion.p 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.6, type: "spring" }}
                            className="text-2xl font-black text-gradient-primary"
                          >
                            {metrics.activeCampaigns}
                          </motion.p>
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <Star className="h-8 w-8 text-green-500" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </MobileCard>
                </motion.div>
              </motion.div>

              {/* Additional dashboard content would go here... */}
              {metrics.xpBalance === 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  <MobileCard className="bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 border-2 border-dashed border-primary/30">
                    <div className="text-center py-12 space-y-6">
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="xp-orb mb-4 mx-auto opacity-50"></div>
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-black mb-2 text-gradient-primary">Start Your Journey</h3>
                        <p className="text-muted-foreground text-lg mb-6">
                          Earn your first XP by streaming music, joining campaigns, and engaging with creators ⚡
                        </p>
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button onClick={() => navigate('/fan-campaigns')} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg">
                              <Plus className="h-4 w-4 mr-2" />
                              Browse Campaigns
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button onClick={() => navigate('/streamseeker')} variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 rounded-full font-bold text-lg">
                              <Music className="h-4 w-4 mr-2" />
                              Discover Music
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </MobileCard>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="rewards" className="mt-6">
              <FanRewardsTab />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <FanShoutouts />
            </TabsContent>

            <TabsContent value="creator-tools" className="mt-6">
              <CreatorToolsHub userRole="fan" />
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <IntegrationsHub />
            </TabsContent>
          </Tabs>
        </div>
      </MobileContainer>

      {/* XP Animation */}
      <XPRewardAnimation 
        xpAmount={xpAnimationAmount}
        show={showXPAnimation}
        onComplete={() => setShowXPAnimation(false)}
      />
    </motion.div>
  );
};

export default FanDashboard;