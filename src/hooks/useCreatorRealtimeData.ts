import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedRealtime } from './useOptimizedRealtime';

interface CreatorMetrics {
  totalFans: number;
  totalXPDistributed: number;
  activeCampaigns: number;
  totalRevenue: number;
  conversionRate: number;
  newFansThisWeek: number;
  streamsGenerated: number;
  socialShares: number;
}

interface RecentActivity {
  id: string;
  type: 'campaign_join' | 'campaign_complete' | 'xp_earned' | 'share' | 'message';
  description: string;
  timestamp: string;
  user_name?: string;
  amount?: number;
}

interface WeeklyPerformance {
  fanGrowth: number;
  engagement: number;
  xpEfficiency: number;
  revenue: number;
}

export const useCreatorRealtimeData = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CreatorMetrics>({
    totalFans: 0,
    totalXPDistributed: 0,
    activeCampaigns: 0,
    totalRevenue: 0,
    conversionRate: 0,
    newFansThisWeek: 0,
    streamsGenerated: 0,
    socialShares: 0
  });
  
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState<WeeklyPerformance>({
    fanGrowth: 0,
    engagement: 0,
    xpEfficiency: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch all data initially and when user changes
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Set up real-time subscriptions
  useOptimizedRealtime({
    table: 'campaign_participants',
    event: '*',
    onUpdate: () => {
      fetchMetrics();
      fetchRecentActivity();
    },
    enabled: !!user
  });

  useOptimizedRealtime({
    table: 'campaigns', 
    filter: `creator_id=eq.${user?.id}`,
    event: '*',
    onUpdate: () => {
      fetchActiveCampaigns();
      fetchMetrics();
    },
    enabled: !!user
  });

  useOptimizedRealtime({
    table: 'creator_fan_leaderboards',
    filter: `creator_user_id=eq.${user?.id}`,
    event: '*',
    onUpdate: () => {
      fetchMetrics();
      fetchRecentActivity();
    },
    enabled: !!user
  });

  useOptimizedRealtime({
    table: 'post_shares',
    filter: `creator_id=eq.${user?.id}`,
    event: '*',
    onUpdate: () => {
      fetchMetrics();
      fetchRecentActivity();
    },
    enabled: !!user
  });

  const fetchAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchActiveCampaigns(),
        fetchRecentActivity(),
        fetchWeeklyPerformance()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (!user) return;
    
    try {
      const [fansData, campaignsData, xpData, revenueData, sharesData] = await Promise.all([
        // Count unique fans
        supabase.from('creator_fan_leaderboards')
          .select('fan_user_id', { count: 'exact', head: true })
          .eq('creator_user_id', user.id),
        
        // Count active campaigns
        supabase.from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', user.id)
          .eq('status', 'active'),
        
        // Sum XP distributed
        supabase.from('creator_fan_leaderboards')
          .select('total_xp_earned')
          .eq('creator_user_id', user.id),
        
        // Get revenue data from creator's campaigns
        supabase.from('campaigns')
          .select('cash_reward')
          .eq('creator_id', user.id)
          .eq('status', 'completed'),
        
        // Count social shares  
        supabase.from('post_shares')
          .select('xp_earned', { count: 'exact', head: true })
          .eq('creator_id', user.id)
      ]);

      const totalFans = fansData.count || 0;
      const activeCampaignsCount = campaignsData.count || 0;
      
      const totalXPDistributed = xpData.data?.reduce((sum, entry) => 
        sum + (entry.total_xp_earned || 0), 0) || 0;
      
      const totalRevenue = revenueData.data?.reduce((sum, entry) => 
        sum + (entry.cash_reward || 0), 0) || 0;

      const socialShares = sharesData.count || 0;

      // Calculate new fans this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { count: newFansThisWeek } = await supabase
        .from('creator_fan_leaderboards')
        .select('fan_user_id', { count: 'exact', head: true })
        .eq('creator_user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      setMetrics({
        totalFans,
        totalXPDistributed,
        activeCampaigns: activeCampaignsCount,
        totalRevenue,
        conversionRate: totalFans > 0 ? ((activeCampaignsCount / totalFans) * 100) : 0,
        newFansThisWeek: newFansThisWeek || 0,
        streamsGenerated: 0, // TODO: Connect to streaming data when available
        socialShares
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchActiveCampaigns = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_participants (
            id,
            user_id,
            status
          )
        `)
        .eq('creator_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    
    try {
      // Get participant IDs from creator's campaigns first
      const { data: campaignIds } = await supabase
        .from('campaigns')
        .select('id')
        .eq('creator_id', user.id);

      if (!campaignIds || campaignIds.length === 0) {
        setRecentActivity([]);
        return;
      }

      const campaignIdArray = campaignIds.map(c => c.id);

      // Fetch recent campaign joins
      const { data: joins } = await supabase
        .from('campaign_participants')
        .select(`
          id,
          joined_at,
          user_id,
          campaign_id
        `)
        .in('campaign_id', campaignIdArray)
        .order('joined_at', { ascending: false })
        .limit(10);

      // Fetch recent completions
      const { data: completions } = await supabase
        .from('campaign_participants')
        .select(`
          id,
          completion_date,
          xp_earned,
          user_id,
          campaign_id
        `)
        .in('campaign_id', campaignIdArray)
        .eq('status', 'completed')
        .not('completion_date', 'is', null)
        .order('completion_date', { ascending: false })
        .limit(10);

      // Fetch recent shares
      const { data: shares } = await supabase
        .from('post_shares')
        .select(`
          id,
          created_at,
          xp_earned,
          share_type,
          platform,
          fan_id
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get campaign names
      const { data: campaignNames } = await supabase
        .from('campaigns')
        .select('id, title')
        .in('id', campaignIdArray);

      const campaignNameMap = Object.fromEntries(
        (campaignNames || []).map(c => [c.id, c.title])
      );

      // Get user profiles for all activities
      const allUserIds = [
        ...(joins || []).map(j => j.user_id),
        ...(completions || []).map(c => c.user_id),
        ...(shares || []).map(s => s.fan_id)
      ].filter(Boolean);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', allUserIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Combine and format activities
      const activities: RecentActivity[] = [];

      joins?.forEach(join => {
        const profile = profileMap[join.user_id];
        const campaignTitle = campaignNameMap[join.campaign_id] || 'Unknown Campaign';
        activities.push({
          id: `join-${join.id}`,
          type: 'campaign_join',
          description: `${profile?.display_name || profile?.username || 'Fan'} joined "${campaignTitle}" campaign`,
          timestamp: join.joined_at,
          user_name: profile?.display_name || profile?.username
        });
      });

      completions?.forEach(completion => {
        const profile = profileMap[completion.user_id];
        const campaignTitle = campaignNameMap[completion.campaign_id] || 'Unknown Campaign';
        activities.push({
          id: `complete-${completion.id}`,
          type: 'campaign_complete',
          description: `${profile?.display_name || profile?.username || 'Fan'} completed "${campaignTitle}" campaign`,
          timestamp: completion.completion_date,
          user_name: profile?.display_name || profile?.username,
          amount: completion.xp_earned
        });
      });

      shares?.forEach(share => {
        const profile = profileMap[share.fan_id];
        activities.push({
          id: `share-${share.id}`,
          type: 'share',
          description: `${profile?.display_name || profile?.username || 'Fan'} shared your content on ${share.platform || 'social media'}`,
          timestamp: share.created_at,
          user_name: profile?.display_name || profile?.username,
          amount: share.xp_earned
        });
      });

      // Sort by timestamp and take most recent
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 20));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchWeeklyPerformance = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Fan growth this week vs last week
      const [thisWeekFans, lastWeekFans, thisWeekXP, lastWeekXP] = await Promise.all([
        supabase.from('creator_fan_leaderboards')
          .select('fan_user_id', { count: 'exact', head: true })
          .eq('creator_user_id', user.id)
          .gte('created_at', thisWeekStart.toISOString()),
        
        supabase.from('creator_fan_leaderboards')
          .select('fan_user_id', { count: 'exact', head: true })
          .eq('creator_user_id', user.id)
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', thisWeekStart.toISOString()),
        
        supabase.from('campaign_participants')
          .select('xp_earned')
          .gte('joined_at', thisWeekStart.toISOString()),
        
        supabase.from('campaign_participants')
          .select('xp_earned')
          .gte('joined_at', lastWeekStart.toISOString())
          .lt('joined_at', thisWeekStart.toISOString())
      ]);

      const thisWeekFanCount = thisWeekFans.count || 0;
      const lastWeekFanCount = lastWeekFans.count || 0;
      const thisWeekXPCount = thisWeekXP.data?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0;
      const lastWeekXPCount = lastWeekXP.data?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0;

      const fanGrowth = lastWeekFanCount > 0 
        ? ((thisWeekFanCount - lastWeekFanCount) / lastWeekFanCount) * 100 
        : thisWeekFanCount > 0 ? 100 : 0;

      const xpEfficiency = thisWeekXPCount > 0 && thisWeekFanCount > 0
        ? Math.min(100, (thisWeekXPCount / (thisWeekFanCount * 1000)) * 100)
        : 0;

      setWeeklyPerformance({
        fanGrowth: Math.round(fanGrowth * 10) / 10,
        engagement: Math.round((thisWeekFanCount * 2.5) * 10) / 10, // Engagement approximation
        xpEfficiency: Math.round(xpEfficiency * 10) / 10,
        revenue: 0 // TODO: Calculate weekly revenue when available
      });
    } catch (error) {
      console.error('Error fetching weekly performance:', error);
    }
  };

  return {
    metrics,
    activeCampaigns,
    recentActivity,
    weeklyPerformance,
    loading,
    refreshData: fetchAllData
  };
};