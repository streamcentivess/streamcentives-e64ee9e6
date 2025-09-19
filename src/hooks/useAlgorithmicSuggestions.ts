import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PopupSuggestion } from '@/components/AlgorithmicPopup';

interface UserActivity {
  lastCampaignJoin: string | null;
  lastRewardRedeem: string | null;
  totalXpEarned: number;
  favoriteContentTypes: string[];
  engagementLevel: 'low' | 'medium' | 'high';
  scrollBehavior: {
    averageTimeOnFeed: number;
    postsViewedPerSession: number;
  };
}

export const useAlgorithmicSuggestions = () => {
  const { user } = useAuth();
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [suggestions, setSuggestions] = useState<PopupSuggestion[]>([]);
  const [shownSuggestions, setShownSuggestions] = useState<Set<string>>(new Set());
  const scrollCountRef = useRef(0);
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    if (user) {
      analyzeUserActivity();
    }
  }, [user]);

  const analyzeUserActivity = async () => {
    if (!user) return;

    try {
      // Fetch user's recent activity
      const [campaignData, rewardData, xpData, socialData] = await Promise.all([
        supabase
          .from('campaign_participants')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
        
        supabase
          .from('reward_redemptions')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
        
        supabase
          .from('user_xp_balances')
          .select('total_earned_xp, current_xp')
          .eq('user_id', user.id)
          .single(),
        
        supabase
          .from('social_interactions')
          .select('interaction_type, content_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      // Analyze engagement level
      const recentInteractions = socialData.data?.length || 0;
      const daysSinceLastCampaign = campaignData.data?.[0] 
        ? Math.floor((Date.now() - new Date(campaignData.data[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      let engagementLevel: 'low' | 'medium' | 'high' = 'low';
      if (recentInteractions > 20 && daysSinceLastCampaign < 3) {
        engagementLevel = 'high';
      } else if (recentInteractions > 5 && daysSinceLastCampaign < 7) {
        engagementLevel = 'medium';
      }

      // Analyze favorite content types
      const contentTypeCounts: Record<string, number> = {};
      socialData.data?.forEach(interaction => {
        if (interaction.content_type) {
          contentTypeCounts[interaction.content_type] = (contentTypeCounts[interaction.content_type] || 0) + 1;
        }
      });

      const favoriteContentTypes = Object.entries(contentTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      setUserActivity({
        lastCampaignJoin: campaignData.data?.[0]?.created_at || null,
        lastRewardRedeem: rewardData.data?.[0]?.created_at || null,
        totalXpEarned: xpData.data?.total_earned_xp || 0,
        favoriteContentTypes,
        engagementLevel,
        scrollBehavior: {
          averageTimeOnFeed: 0, // Will be calculated based on session
          postsViewedPerSession: 0
        }
      });

    } catch (error) {
      console.error('Error analyzing user activity:', error);
    }
  };

  const generateSuggestions = async (): Promise<PopupSuggestion[]> => {
    if (!user || !userActivity) return [];

    const suggestions: PopupSuggestion[] = [];

    try {
      // Campaign suggestions based on engagement
      if (userActivity.engagementLevel === 'high' || Math.random() > 0.7) {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('*')
          .eq('status', 'active')
          .not('creator_id', 'eq', user.id)
          .limit(3);

        campaigns?.forEach(campaign => {
          if (!shownSuggestions.has(`campaign-${campaign.id}`)) {
            suggestions.push({
              id: `campaign-${campaign.id}`,
              type: 'campaign',
              title: `Join "${campaign.title}"`,
              description: `Earn ${campaign.xp_reward} XP by participating in this trending campaign!`,
              xpReward: campaign.xp_reward,
              actionUrl: `/fan-campaigns?highlight=${campaign.id}`,
              buttonText: 'Join Now',
              icon: '🎯',
              urgency: campaign.end_date && new Date(campaign.end_date).getTime() - Date.now() < 24 * 60 * 60 * 1000 ? 'high' : 'medium',
              timeLimit: campaign.end_date ? `Ends ${new Date(campaign.end_date).toLocaleDateString()}` : undefined,
              data: campaign
            });
          }
        });
      }

      // Reward suggestions for users with XP
      if (userActivity.totalXpEarned > 100 && Math.random() > 0.6) {
        const { data: rewards } = await supabase
          .from('rewards')
          .select('*')
          .eq('is_active', true)
          .not('creator_id', 'eq', user.id)
          .lte('xp_cost', userActivity.totalXpEarned)
          .limit(2);

        rewards?.forEach(reward => {
          if (!shownSuggestions.has(`reward-${reward.id}`)) {
            suggestions.push({
              id: `reward-${reward.id}`,
              type: 'reward',
              title: `Redeem "${reward.title}"`,
              description: `Use your XP to get this exclusive reward from a creator you follow!`,
              xpReward: Math.floor(reward.xp_cost * 0.1), // Bonus XP for redeeming
              actionUrl: `/marketplace?highlight=${reward.id}`,
              buttonText: 'Redeem Now',
              icon: '🎁',
              urgency: reward.quantity_available - reward.quantity_redeemed < 5 ? 'high' : 'low',
              data: reward
            });
          }
        });
      }

      // Engagement boost suggestions
      if (userActivity.engagementLevel === 'low' && Math.random() > 0.5) {
        suggestions.push({
          id: 'engagement-boost',
          type: 'engagement_boost',
          title: 'Boost Your Activity!',
          description: 'Like 5 posts in a row and earn bonus XP. Let\'s get you more engaged!',
          xpReward: 25,
          actionUrl: '/feed',
          buttonText: 'Start Liking',
          icon: '❤️',
          urgency: 'medium'
        });
      }

      // Creator follow suggestions
      if (Math.random() > 0.8) {
        const { data: creators } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .neq('user_id', user.id)
          .limit(3);

        const creator = creators?.[Math.floor(Math.random() * creators.length)];
        if (creator && !shownSuggestions.has(`follow-${creator.user_id}`)) {
          suggestions.push({
            id: `follow-${creator.user_id}`,
            type: 'creator_follow',
            title: `Discover ${creator.display_name || creator.username}`,
            description: 'This creator has exciting campaigns and rewards waiting for you!',
            xpReward: 15,
            actionUrl: `/universal-profile?user=${creator.user_id}`,
            buttonText: 'View Profile',
            icon: '👤',
            urgency: 'low',
            data: creator
          });
        }
      }

      // Voting/Poll suggestions
      if (Math.random() > 0.7) {
        suggestions.push({
          id: 'voting-suggestion',
          type: 'voting',
          title: 'Your Opinion Matters!',
          description: 'Participate in community polls and help shape content direction.',
          xpReward: 20,
          actionUrl: '/community-hub',
          buttonText: 'Vote Now',
          icon: '🗳️',
          urgency: 'medium'
        });
      }

    } catch (error) {
      console.error('Error generating suggestions:', error);
    }

    // Shuffle and return top 2 suggestions
    return suggestions.sort(() => Math.random() - 0.5).slice(0, 2);
  };

  const shouldShowSuggestion = (scrollPosition: number): boolean => {
    scrollCountRef.current += 1;
    
    // Show suggestions based on scroll behavior
    const scrollThresholds = [3, 8, 15, 25]; // Show at these scroll counts
    return scrollThresholds.includes(scrollCountRef.current);
  };

  const markSuggestionAsShown = (suggestionId: string) => {
    setShownSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const resetSession = () => {
    scrollCountRef.current = 0;
    sessionStartRef.current = Date.now();
    setShownSuggestions(new Set());
  };

  return {
    userActivity,
    generateSuggestions,
    shouldShowSuggestion,
    markSuggestionAsShown,
    resetSession,
    analyzeUserActivity
  };
};