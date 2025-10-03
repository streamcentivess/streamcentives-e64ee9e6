import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LiveStream {
  id: string;
  creator_id: string;
  stream_title: string;
  stream_description?: string | null;
  thumbnail_url?: string | null;
  stream_url?: string | null;
  platform: string;
  status: string | null;
  scheduled_start_time?: string | null;
  actual_start_time?: string | null;
  end_time?: string | null;
  viewer_count: number | null;
  peak_viewers: number | null;
  max_guests: number | null;
  is_multi_guest: boolean | null;
  guest_ids?: any;
  category?: string | null;
  privacy_level?: string | null;
  created_at: string | null;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const useLiveStreams = (status?: string) => {
  const { user } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
    const channel = setupRealtimeSubscription();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  const fetchStreams = async () => {
    try {
      let query = supabase
        .from('live_streams')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: streamsData, error: streamsError } = await query;

      if (streamsError) throw streamsError;

      if (!streamsData) {
        setStreams([]);
        return;
      }

      // Fetch profiles for all creators
      const creatorIds = [...new Set(streamsData.map(s => s.creator_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', creatorIds);

      // Combine streams with profile data
      const streamsWithProfiles = streamsData.map(stream => ({
        ...stream,
        profile: profilesData?.find(p => p.user_id === stream.creator_id)
      })) as LiveStream[];

      setStreams(streamsWithProfiles);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('live-streams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams'
        },
        () => {
          fetchStreams();
        }
      )
      .subscribe();

    return channel;
  };

  const startStream = async (streamId: string) => {
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          status: 'live',
          actual_start_time: new Date().toISOString()
        })
        .eq('id', streamId)
        .eq('creator_id', user?.id);

      if (error) throw error;
      await fetchStreams();
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  const endStream = async (streamId: string) => {
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          status: 'ended',
          end_time: new Date().toISOString()
        })
        .eq('id', streamId)
        .eq('creator_id', user?.id);

      if (error) throw error;
      await fetchStreams();
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  return { streams, loading, startStream, endStream, refetch: fetchStreams };
};
