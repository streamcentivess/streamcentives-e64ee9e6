import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  creator_user_id: string;
  fan_user_id: string;
  total_xp_earned: number;
  rank_position: number;
  last_activity_at: string;
}

export const useLeaderboardPosition = (creatorId?: string) => {
  const { user } = useAuth();
  const [position, setPosition] = useState<number | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !creatorId) {
      setLoading(false);
      return;
    }

    const fetchPosition = async () => {
      try {
        // Get user's position on this creator's leaderboard
        const { data, error } = await supabase
          .from('creator_fan_leaderboards')
          .select('rank_position, total_xp_earned')
          .eq('creator_user_id', creatorId)
          .eq('fan_user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching leaderboard position:', error);
        } else if (data) {
          setPosition(data.rank_position);
          setTotalXP(data.total_xp_earned);
        }
      } catch (error) {
        console.error('Error in fetchPosition:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosition();

    // Set up real-time subscription for leaderboard updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creator_fan_leaderboards',
          filter: `creator_user_id=eq.${creatorId}`
        },
        (payload) => {
          console.log('Leaderboard updated:', payload);
          if (payload.new && payload.new.fan_user_id === user.id) {
            setPosition(payload.new.rank_position);
            setTotalXP(payload.new.total_xp_earned);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creator_fan_leaderboards',
          filter: `creator_user_id=eq.${creatorId}`
        },
        (payload) => {
          console.log('New leaderboard entry:', payload);
          if (payload.new && payload.new.fan_user_id === user.id) {
            setPosition(payload.new.rank_position);
            setTotalXP(payload.new.total_xp_earned);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, creatorId]);

  return { position, totalXP, loading };
};