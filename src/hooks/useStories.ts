import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Story {
  id: string;
  creator_id: string;
  media_url: string;
  media_type: string;
  caption?: string | null;
  duration_seconds: number;
  view_count: number | null;
  is_active: boolean | null;
  created_at: string | null;
  expires_at: string | null;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const useStories = (userId?: string) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
    const channel = setupRealtimeSubscription();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchStories = async () => {
    try {
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!storiesData) {
        setStories([]);
        return;
      }

      // Filter by userId if provided
      const filteredStories = userId
        ? storiesData.filter(story => story.creator_id === userId)
        : storiesData;

      // Fetch profiles for all creators
      const creatorIds = [...new Set(filteredStories.map(s => s.creator_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', creatorIds);

      // Combine stories with profile data
      const storiesWithProfiles = filteredStories.map(story => ({
        ...story,
        profile: profilesData?.find(p => p.user_id === story.creator_id)
      })) as Story[];

      setStories(storiesWithProfiles);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return channel;
  };

  const trackView = async (storyId: string) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('track-story-view', {
        body: { storyId }
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  return { stories, loading, trackView, refetch: fetchStories };
};
