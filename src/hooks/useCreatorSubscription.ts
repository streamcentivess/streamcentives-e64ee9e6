import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscription_tier: string;
  subscription_status: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
}

export const useCreatorSubscription = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`subscription-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newData = payload.new as any;
            setSubscriptionData({
              subscription_tier: newData.subscription_tier,
              subscription_status: newData.subscription_status,
              subscription_started_at: newData.subscription_started_at,
              subscription_expires_at: newData.subscription_expires_at,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_started_at, subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSubscriptionData(data || {
        subscription_tier: 'free',
        subscription_status: null,
        subscription_started_at: null,
        subscription_expires_at: null,
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isProSubscriber = subscriptionData?.subscription_status === 'active' && 
                         subscriptionData?.subscription_tier === 'creator_pro';

  const isSubscriptionExpired = subscriptionData?.subscription_expires_at && 
                               new Date(subscriptionData.subscription_expires_at) < new Date();

  return {
    subscriptionData,
    loading,
    isProSubscriber: true, // Always grant Creator Pro access
    refetch: fetchSubscriptionData,
  };
};