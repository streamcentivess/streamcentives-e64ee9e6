import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlgorithmicPopup, type PopupSuggestion } from './AlgorithmicPopup';
import { useAlgorithmicSuggestions } from '@/hooks/useAlgorithmicSuggestions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeedPopupSystemProps {
  onScroll?: (scrollPosition: number) => void;
}

export const FeedPopupSystem = ({ onScroll }: FeedPopupSystemProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentSuggestion, setCurrentSuggestion] = useState<PopupSuggestion | null>(null);
  const [suggestionQueue, setSuggestionQueue] = useState<PopupSuggestion[]>([]);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  
  const {
    generateSuggestions,
    shouldShowSuggestion,
    markSuggestionAsShown,
    resetSession,
    analyzeUserActivity
  } = useAlgorithmicSuggestions();

  useEffect(() => {
    if (user) {
      resetSession();
      analyzeUserActivity();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const newDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      
      // Only trigger on downward scrolling
      if (newDirection === 'down' && scrollDirection.current !== 'down') {
        scrollDirection.current = 'down';
        
        if (shouldShowSuggestion(currentScrollY) && !currentSuggestion) {
          showNextSuggestion();
        }
      }
      
      scrollDirection.current = newDirection;
      lastScrollY.current = currentScrollY;
      onScroll?.(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSuggestion, onScroll]);

  const showNextSuggestion = async () => {
    if (currentSuggestion) return;

    try {
      let nextSuggestion = suggestionQueue[0];
      
      if (!nextSuggestion) {
        // Generate new suggestions
        const newSuggestions = await generateSuggestions();
        setSuggestionQueue(newSuggestions);
        nextSuggestion = newSuggestions[0];
      }

      if (nextSuggestion) {
        setCurrentSuggestion(nextSuggestion);
        markSuggestionAsShown(nextSuggestion.id);
        
        // Remove from queue
        setSuggestionQueue(prev => prev.slice(1));
      }
    } catch (error) {
      console.error('Error showing suggestion:', error);
    }
  };

  const handleSuggestionAction = async (suggestion: PopupSuggestion) => {
    if (!user) return;

    try {
      // Track the interaction
      await supabase
        .from('social_interactions')
        .insert({
          user_id: user.id,
          interaction_type: 'suggestion_click',
          content_type: suggestion.type,
          target_content_id: suggestion.data?.id || null,
          metadata: {
            suggestion_id: suggestion.id,
            xp_reward: suggestion.xpReward
          }
        });

      // Award XP for taking action
      const { error: xpError } = await supabase
        .from('user_xp_balances')
        .upsert({
          user_id: user.id,
          current_xp: suggestion.xpReward,
          total_earned_xp: suggestion.xpReward
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (xpError) throw xpError;

      toast({
        title: "Action Completed!",
        description: `You earned ${suggestion.xpReward} XP for engaging with the suggestion!`
      });

      // Handle specific actions
      switch (suggestion.type) {
        case 'campaign':
          // Try to auto-join the campaign
          if (suggestion.data?.id) {
            const { error: joinError } = await supabase
              .from('campaign_participants')
              .insert({
                campaign_id: suggestion.data.id,
                user_id: user.id
              });
            
            if (joinError && joinError.code !== '23505') {
              console.error('Error joining campaign:', joinError);
            }
          }
          break;

        case 'engagement_boost':
          // Start an engagement tracking session
          localStorage.setItem('engagement_boost_active', 'true');
          localStorage.setItem('engagement_boost_target', '5');
          localStorage.setItem('engagement_boost_current', '0');
          break;

        case 'creator_follow':
          // Auto-follow the creator
          if (suggestion.data?.user_id) {
            const { error: followError } = await supabase
              .from('follows')
              .insert({
                follower_id: user.id,
                following_id: suggestion.data.user_id
              });
            
            if (followError && followError.code !== '23505') {
              console.error('Error following creator:', followError);
            }
          }
          break;
      }

      // Navigate to the action URL
      if (suggestion.actionUrl && suggestion.actionUrl !== '/feed') {
        navigate(suggestion.actionUrl);
      }

    } catch (error) {
      console.error('Error handling suggestion action:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }

    setCurrentSuggestion(null);
  };

  const handleSuggestionClose = () => {
    setCurrentSuggestion(null);
  };

  if (!user || !currentSuggestion) {
    return null;
  }

  return (
    <AlgorithmicPopup
      suggestion={currentSuggestion}
      onClose={handleSuggestionClose}
      onAction={handleSuggestionAction}
    />
  );
};