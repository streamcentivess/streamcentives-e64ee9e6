import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SuggestionData {
  id: string;
  type: 'campaign' | 'music' | 'rewards' | 'merchandise' | 'voting';
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  avatarUrl?: string;
  creatorName?: string;
  xpReward?: number;
  urgency?: string;
  actionUrl: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
  creatorId?: string;
}

interface UserEngagement {
  totalXP: number;
  campaignsCompleted: number;
  streamsCount: number;
  lastActiveDate: string | null;
  isNewUser: boolean;
  favoriteCreators: string[];
  preferredCategories: string[];
}

export const useAlgorithmicSuggestions = () => {
  const { user } = useAuth();
  const [currentSuggestion, setCurrentSuggestion] = useState<SuggestionData | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);

  // Fetch user engagement data
  const fetchUserEngagement = async () => {
    if (!user) return null;

    try {
      // Get XP data
      const { data: xpData } = await supabase
        .from('user_xp_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get campaign participation
      const { data: campaignData } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('user_id', user.id);

      // Get streaming data
      const { data: streamData } = await supabase
        .from('spotify_listens')
        .select('*')
        .eq('fan_user_id', user.id);

      // Get profile creation date
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single();

      const totalXP = xpData?.total_earned_xp || 0;
      const campaignsCompleted = campaignData?.filter(c => c.status === 'completed').length || 0;
      const streamsCount = streamData?.length || 0;
      const profileCreatedAt = profileData?.created_at;
      
      // Check if user is new (created within last 7 days)
      const isNewUser = profileCreatedAt ? 
        (new Date().getTime() - new Date(profileCreatedAt).getTime()) / (1000 * 60 * 60 * 24) < 7 : 
        true;

      // Get favorite creators from streaming data
      const creatorCounts = streamData?.reduce((acc: Record<string, number>, stream: any) => {
        const creatorId = stream.creator_user_id;
        acc[creatorId] = (acc[creatorId] || 0) + 1;
        return acc;
      }, {}) || {};

      const favoriteCreators = Object.entries(creatorCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([creatorId]) => creatorId);

      const engagement: UserEngagement = {
        totalXP,
        campaignsCompleted,
        streamsCount,
        lastActiveDate: streamData?.[streamData.length - 1]?.listened_at || null,
        isNewUser,
        favoriteCreators,
        preferredCategories: [] // Can be expanded based on campaign types
      };

      setUserEngagement(engagement);
      return engagement;
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      return null;
    }
  };

  // Generate personalized suggestion
  const generateSuggestion = async (engagement: UserEngagement): Promise<SuggestionData | null> => {
    try {
      // For new or inactive users, show random suggestions
      if (engagement.isNewUser || engagement.totalXP < 100) {
        return await generateRandomSuggestion();
      }

      // For engaged users, show personalized suggestions
      return await generatePersonalizedSuggestion(engagement);
    } catch (error) {
      console.error('Error generating suggestion:', error);
      return await generateRandomSuggestion();
    }
  };

  const generateRandomSuggestion = async (): Promise<SuggestionData | null> => {
    // Get random active campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select(`
        *,
        profiles:creator_id (display_name, avatar_url)
      `)
      .eq('status', 'active')
      .limit(5);

    if (campaigns && campaigns.length > 0) {
      const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
      const creator = campaign.profiles as any;
      
      return {
        id: campaign.id,
        type: 'campaign',
        title: 'New Campaign Available!',
        subtitle: campaign.title,
        description: `Join ${creator?.display_name || 'this creator'}'s campaign and earn XP! ${campaign.description?.substring(0, 100)}...`,
        avatarUrl: creator?.avatar_url,
        creatorName: creator?.display_name,
        xpReward: campaign.xp_reward,
        actionUrl: `/fan-campaigns`,
        actionText: 'Join Campaign',
        priority: 'medium'
      };
    }

    return null;
  };

  const generatePersonalizedSuggestion = async (engagement: UserEngagement): Promise<SuggestionData | null> => {
    const suggestions: (() => Promise<SuggestionData | null>)[] = [];

    // Add campaign suggestions for favorite creators
    if (engagement.favoriteCreators.length > 0) {
      suggestions.push(async () => {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select(`
            *,
            profiles:creator_id (display_name, avatar_url)
          `)
          .eq('status', 'active')
          .in('creator_id', engagement.favoriteCreators)
          .limit(3);

        if (campaigns && campaigns.length > 0) {
          const campaign = campaigns[0];
          const creator = campaign.profiles as any;
          
          return {
            id: campaign.id,
            type: 'campaign',
            title: 'Your Favorite Creator Posted!',
            subtitle: campaign.title,
            description: `${creator?.display_name || 'Your favorite creator'} just launched a new campaign. Be the first to join!`,
            avatarUrl: creator?.avatar_url,
            creatorName: creator?.display_name,
            xpReward: campaign.xp_reward + 50, // Bonus XP for favorite creators
            urgency: 'Just posted',
            actionUrl: `/fan-campaigns`,
            actionText: 'Join Now',
            priority: 'high'
          };
        }
        return null;
      });
    }

    // Add reward suggestions
    suggestions.push(async () => {
      const { data: rewards } = await supabase
        .from('rewards')
        .select(`
          *,
          profiles:creator_id (display_name, avatar_url)
        `)
        .eq('is_active', true)
        .gt('quantity_available', 'quantity_redeemed')
        .limit(3);

      if (rewards && rewards.length > 0) {
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        const creator = reward.profiles as any;
        
        return {
          id: reward.id,
          type: 'rewards',
          title: 'Limited Reward Available!',
          subtitle: reward.title,
          description: `Exclusive ${reward.title} from ${creator?.display_name || 'creator'}. Limited quantity remaining!`,
          imageUrl: reward.image_url,
          avatarUrl: creator?.avatar_url,
          creatorName: creator?.display_name,
          xpReward: 25, // Bonus XP for checking rewards
          urgency: `Only ${reward.quantity_available - reward.quantity_redeemed} left`,
          actionUrl: `/marketplace`,
          actionText: 'View Reward',
          priority: 'high'
        };
      }
      return null;
    });

    // Add voting campaign suggestions
    suggestions.push(async () => {
      const { data: votingCampaigns } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles:creator_id (display_name, avatar_url)
        `)
        .eq('status', 'active')
        .eq('type', 'vote')
        .gte('end_date', new Date().toISOString())
        .limit(3);

      if (votingCampaigns && votingCampaigns.length > 0) {
        const campaign = votingCampaigns[0];
        const creator = campaign.profiles as any;
        const hoursLeft = Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60));
        
        return {
          id: campaign.id,
          type: 'voting',
          title: 'Vote Now!',
          subtitle: campaign.title,
          description: `Help ${creator?.display_name || 'this creator'} make an important decision. Your vote matters!`,
          avatarUrl: creator?.avatar_url,
          creatorName: creator?.display_name,
          xpReward: campaign.xp_reward,
          urgency: `${hoursLeft}h left`,
          actionUrl: `/fan-campaigns`,
          actionText: 'Cast Vote',
          priority: 'high'
        };
      }
      return null;
    });

    // Randomly select and execute one suggestion
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    return await randomSuggestion();
  };

  // Show suggestion with timing logic
  const showAlgorithmicSuggestion = async () => {
    if (!user) return;

    const engagement = await fetchUserEngagement();
    if (!engagement) return;

    const suggestion = await generateSuggestion(engagement);
    if (suggestion) {
      setCurrentSuggestion(suggestion);
      setShowSuggestion(true);
    }
  };

  // Auto-trigger suggestions based on user behavior
  useEffect(() => {
    if (!user) return;

    const checkForSuggestions = async () => {
      // Check if we should show a suggestion
      const lastSuggestionTime = localStorage.getItem(`lastSuggestion_${user.id}`);
      const now = new Date().getTime();
      const minInterval = 30 * 60 * 1000; // 30 minutes

      if (!lastSuggestionTime || (now - parseInt(lastSuggestionTime)) > minInterval) {
        // Random chance to show suggestion (30% chance)
        if (Math.random() < 0.3) {
          setTimeout(() => {
            showAlgorithmicSuggestion();
            localStorage.setItem(`lastSuggestion_${user.id}`, now.toString());
          }, 5000); // Show after 5 seconds on page load
        }
      }
    };

    checkForSuggestions();
  }, [user]);

  const dismissSuggestion = () => {
    setShowSuggestion(false);
    setCurrentSuggestion(null);
  };

  const handleSuggestionAction = async (suggestion: SuggestionData) => {
    // Track suggestion interaction
    if (user) {
      try {
        await supabase
          .from('analytics_events')
          .insert({
            user_id: user.id,
            event_type: 'suggestion_clicked',
            event_data: {
              suggestion_id: suggestion.id,
              suggestion_type: suggestion.type,
              timestamp: new Date().toISOString()
            }
          });
        console.log('Suggestion interaction tracked');
      } catch (error) {
        console.error('Error tracking suggestion:', error);
      }
    }
  };

  return {
    currentSuggestion,
    showSuggestion,
    userEngagement,
    dismissSuggestion,
    handleSuggestionAction,
    showAlgorithmicSuggestion
  };
};