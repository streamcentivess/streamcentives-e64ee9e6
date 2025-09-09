import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PublicProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  interests?: string;
  age?: string;
  country_name?: string;
  spotify_connected?: boolean;
  merch_store_connected?: boolean;
  merch_store_url?: string;
  created_at: string;
}

export const useRealTimeProfiles = () => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load initial profiles
  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('public_profiles')
        .select('*')
        .neq('user_id', user?.id || '')
        .order('created_at', { ascending: false }) as any;

      if (fetchError) throw fetchError;
      setProfiles((data || []) as PublicProfile[]);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  // Search profiles
  const searchProfiles = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!searchTerm.trim()) {
        await loadProfiles();
        return;
      }

      const { data, error: searchError } = await supabase
        .from('public_profiles')
        .select('*')
        .neq('user_id', user?.id || '')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,interests.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false }) as any;

      if (searchError) throw searchError;
      setProfiles((data || []) as PublicProfile[]);
    } catch (err) {
      console.error('Error searching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to search profiles');
    } finally {
      setLoading(false);
    }
  };

  // Get profile by user ID
  const getProfile = async (userId: string): Promise<PublicProfile | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('user_id', userId)
        .single() as any;

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw fetchError;
      }

      return data as PublicProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // Load initial data
    loadProfiles();

    // Set up real-time subscription
    const channel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        async (payload) => {
          console.log('Profile change detected:', payload);
          
          // Handle different events
          if (payload.eventType === 'INSERT') {
            // New profile created
            const newProfile = await getProfile(payload.new.user_id);
            if (newProfile && newProfile.user_id !== user.id) {
              setProfiles(prev => [newProfile, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Profile updated
            const updatedProfile = await getProfile(payload.new.user_id);
            if (updatedProfile && updatedProfile.user_id !== user.id) {
              setProfiles(prev => 
                prev.map(profile => 
                  profile.user_id === updatedProfile.user_id ? updatedProfile : profile
                )
              );
            } else if (payload.new.user_id !== user.id) {
              // Profile might have been made private or incomplete
              setProfiles(prev => 
                prev.filter(profile => profile.user_id !== payload.new.user_id)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            // Profile deleted
            setProfiles(prev => 
              prev.filter(profile => profile.user_id !== payload.old.user_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    profiles,
    loading,
    error,
    searchProfiles,
    getProfile,
    refreshProfiles: loadProfiles
  };
};