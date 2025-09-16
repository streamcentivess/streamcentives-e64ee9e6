import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRealtimeXP = () => {
  const { user } = useAuth();
  const [xpBalance, setXpBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch initial XP balance
    const fetchXPBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('user_xp_balances')
          .select('current_xp')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error is okay
          console.error('Error fetching XP balance:', error);
        } else {
          setXpBalance(data?.current_xp || 0);
        }
      } catch (error) {
        console.error('Error in fetchXPBalance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchXPBalance();

    // Set up real-time subscription for XP updates
    const channel = supabase
      .channel('xp-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_xp_balances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('XP Balance updated:', payload);
          if (payload.new && typeof payload.new.current_xp === 'number') {
            setXpBalance(payload.new.current_xp);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_xp_balances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('XP Balance created:', payload);
          if (payload.new && typeof payload.new.current_xp === 'number') {
            setXpBalance(payload.new.current_xp);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { xpBalance, loading };
};