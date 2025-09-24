import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StreamseekerArtist {
  artist_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  discovery_pool: string;
  content_count: number;
  follower_count: number;
}

export interface DailyQuest {
  discoveries_completed: number;
  total_xp_earned: number;
  quest_completed: boolean;
}

export interface ArtistStats {
  eligibility_status: string;
  discovery_pool: string;
  profile_completion_score: number;
  total_discoveries: number;
  total_follows_from_discovery: number;
}

export const useStreamseeker = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestion = async (contentType: string = 'music'): Promise<StreamseekerArtist | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_streamseeker_suggestions', {
        fan_user_id: user.id,
        content_type_param: contentType,
        exclude_discovered: true
      });

      if (error) throw error;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestion');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeDiscovery = async (
    artistId: string,
    contentType: string,
    engagementCompleted: boolean,
    followed: boolean,
    engagementDuration: number = 0
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('complete_streamseeker_discovery', {
        fan_user_id: user.id,
        artist_user_id: artistId,
        content_type_param: contentType,
        engagement_completed_param: engagementCompleted,
        followed_param: followed,
        engagement_duration_param: engagementDuration
      });

      if (error) throw error;
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete discovery');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDailyQuest = async (): Promise<DailyQuest | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('streamseeker_daily_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('quest_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || { discoveries_completed: 0, total_xp_earned: 0, quest_completed: false };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get daily quest');
      return null;
    }
  };

  const getArtistStats = async (): Promise<ArtistStats | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('streamseeker_artists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get artist stats');
      return null;
    }
  };

  const updateArtistEligibility = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('update_artist_eligibility', {
        artist_user_id: user.id
      });

      if (error) throw error;
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update eligibility');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getSuggestion,
    completeDiscovery,
    getDailyQuest,
    getArtistStats,
    updateArtistEligibility
  };
};