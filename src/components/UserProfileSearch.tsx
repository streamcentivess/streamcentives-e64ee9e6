import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Music, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PublicProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  country_name?: string;
  spotify_connected?: boolean;
  merch_store_connected?: boolean;
  created_at: string;
  // Removed sensitive fields: location, interests, age, merch_store_url
}

interface UserProfileSearchProps {
  onProfileSelect?: (profile: PublicProfile) => void;
  className?: string;
}

export const UserProfileSearch: React.FC<UserProfileSearchProps> = ({ 
  onProfileSelect,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Initial load of profiles
  useEffect(() => {
    loadProfiles();
  }, []);

  // Real-time subscription for profile updates
  useEffect(() => {
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          // Refresh profiles when any profile changes
          loadProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Search profiles when search term changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProfiles(searchTerm);
      } else {
        loadProfiles();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      // Use the secure RPC function to get public profiles
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_query: '',  // Empty query returns all profiles
        limit_count: 24,
        offset_count: 0
      });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async (term: string) => {
    setLoading(true);
    try {
      // Use the secure RPC function to search public profiles
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_query: term,
        limit_count: 24,
        offset_count: 0
      });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error searching profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile: PublicProfile) => {
    if (onProfileSelect) {
      onProfileSelect(profile);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users by name, username, bio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Profile Results */}
      <div className="space-y-3">
        {profiles.map((profile) => (
          <Card 
            key={profile.user_id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleProfileClick(profile)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                  <AvatarFallback>
                    {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-sm">{profile.display_name}</h3>
                    <span className="text-muted-foreground text-xs">@{profile.username}</span>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.country_name && (
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.country_name}
                      </Badge>
                    )}
                    {profile.spotify_connected && (
                      <Badge variant="secondary" className="text-xs">
                        <Music className="h-3 w-3 mr-1" />
                        Spotify
                      </Badge>
                    )}
                    {profile.merch_store_connected && (
                      <Badge variant="secondary" className="text-xs">
                        <Store className="h-3 w-3 mr-1" />
                        Store
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {!loading && profiles.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found matching "{searchTerm}"</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && profiles.length === 0 && !searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No user profiles available yet</p>
        </div>
      )}
    </div>
  );
};

export default UserProfileSearch;