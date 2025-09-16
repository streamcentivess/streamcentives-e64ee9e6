import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  session_id?: string;
}

export const useAnalyticsTracking = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!user) return;
    
    try {
      // Generate session ID if not provided
      const sessionId = event.session_id || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Get user agent and IP (IP will be handled server-side)
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_type: event.event_type,
          event_data: event.event_data || {},
          session_id: sessionId,
          user_agent: userAgent
        });
      
      if (error) {
        console.error('Error tracking event:', error);
      }
    } catch (error) {
      console.error('Error in trackEvent:', error);
    }
  }, [user]);

  // Track page views
  const trackPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    trackEvent({
      event_type: 'page_view',
      event_data: {
        page,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track user interactions
  const trackInteraction = useCallback((
    interaction_type: string, 
    target: string, 
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'user_interaction',
      event_data: {
        interaction_type,
        target,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track campaign interactions
  const trackCampaignInteraction = useCallback((
    campaign_id: string,
    interaction_type: 'view' | 'join' | 'complete' | 'share',
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'campaign_interaction',
      event_data: {
        campaign_id,
        interaction_type,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track XP activities
  const trackXPActivity = useCallback((
    activity_type: 'earned' | 'spent' | 'purchased',
    amount: number,
    source: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'xp_activity',
      event_data: {
        activity_type,
        amount,
        source,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track message activities
  const trackMessageActivity = useCallback((
    activity_type: 'sent' | 'received' | 'approved' | 'denied',
    message_id?: string,
    xp_cost?: number,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'message_activity',
      event_data: {
        activity_type,
        message_id,
        xp_cost,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track reward activities
  const trackRewardActivity = useCallback((
    activity_type: 'view' | 'redeem' | 'create',
    reward_id: string,
    payment_method?: 'xp' | 'cash',
    amount?: number,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'reward_activity',
      event_data: {
        activity_type,
        reward_id,
        payment_method,
        amount,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track social interactions
  const trackSocialInteraction = useCallback((
    interaction_type: 'like' | 'comment' | 'share' | 'follow',
    target_type: 'post' | 'user' | 'campaign',
    target_id: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'social_interaction',
      event_data: {
        interaction_type,
        target_type,
        target_id,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track errors and performance
  const trackError = useCallback((
    error_type: string,
    error_message: string,
    stack_trace?: string,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'error',
      event_data: {
        error_type,
        error_message,
        stack_trace,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Track performance metrics
  const trackPerformance = useCallback((
    metric_type: string,
    value: number,
    metadata?: Record<string, any>
  ) => {
    trackEvent({
      event_type: 'performance',
      event_data: {
        metric_type,
        value,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [trackEvent]);

  // Auto-track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      trackEvent({
        event_type: 'page_visibility',
        event_data: {
          visible: !document.hidden,
          timestamp: new Date().toISOString()
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackEvent]);

  // Auto-track user session start
  useEffect(() => {
    if (user) {
      trackEvent({
        event_type: 'session_start',
        event_data: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`
        }
      });
    }
  }, [user, trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackInteraction,
    trackCampaignInteraction,
    trackXPActivity,
    trackMessageActivity,
    trackRewardActivity,
    trackSocialInteraction,
    trackError,
    trackPerformance
  };
};

// Hook for updating user engagement metrics
export const useEngagementTracking = () => {
  const { user } = useAuth();

  const updateEngagementMetrics = useCallback(async (
    metrics: Partial<{
      sessions_count: number;
      total_session_duration_minutes: number;
      campaigns_participated: number;
      messages_sent: number;
      posts_liked: number;
      posts_shared: number;
      xp_earned: number;
    }>
  ) => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('user_engagement_metrics')
        .upsert({
          user_id: user.id,
          date: today,
          last_active_at: new Date().toISOString(),
          ...metrics
        }, {
          onConflict: 'user_id,date'
        });
      
      if (error) {
        console.error('Error updating engagement metrics:', error);
      }
    } catch (error) {
      console.error('Error in updateEngagementMetrics:', error);
    }
  }, [user]);

  const incrementEngagementMetric = useCallback(async (
    metric: string,
    increment: number = 1
  ) => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current value
      const { data: current } = await supabase
        .from('user_engagement_metrics')
        .select(metric)
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      
      const currentValue = current?.[metric] || 0;
      
      const updateObject: any = {};
      updateObject[metric] = currentValue + increment;
      
      await updateEngagementMetrics(updateObject);
      
    } catch (error) {
      console.error('Error incrementing engagement metric:', error);
    }
  }, [user, updateEngagementMetrics]);

  return {
    updateEngagementMetrics,
    incrementEngagementMetric
  };
};