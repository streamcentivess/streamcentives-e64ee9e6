import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, MapPin, Globe, Calendar, Star, Trophy, Gift, BarChart3, Users, Music, Settings, UserPlus, UserMinus, MessageCircle, Search, Share2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PostsGrid } from '@/components/PostsGrid';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MessageCreator from '@/components/MessageCreator';
interface Profile {
  id?: string;
  user_id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  spotify_connected?: boolean;
  created_at?: string;
}
const UniversalProfile = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [userRole, setUserRole] = useState<'fan' | 'creator' | null>(null);
  const [followStats, setFollowStats] = useState({
    followers_count: 0,
    following_count: 0
  });
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Profile[]>([]);
  const [listType, setListType] = useState<'followers' | 'following'>('followers');
  const [userFollowStates, setUserFollowStates] = useState<Record<string, boolean>>({});
  const [postCount, setPostCount] = useState(0);
  const [xpBalance, setXpBalance] = useState(0);

  // Check if viewing own profile or another user's profile
  const viewingUserId = searchParams.get('userId');
  const viewingUsername = searchParams.get('username') || searchParams.get('user');
  // If username is provided, assume viewing someone else's profile until resolved
  const isOwnProfile = viewingUsername ? false : !viewingUserId || viewingUserId === user?.id;
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFollowStats();
      // Clear follow states when switching profiles
      setUserFollowStates({});
      // Determine user role from sessionStorage or URL params
      const savedRole = sessionStorage.getItem('selectedRole') as 'fan' | 'creator' | null;
      if (savedRole) {
        setUserRole(savedRole);
      } else {
        // Try to infer role from current path or default to fan
        const currentPath = window.location.pathname;
        if (currentPath.includes('creator')) {
          setUserRole('creator');
        } else if (currentPath.includes('fan')) {
          setUserRole('fan');
        } else {
          setUserRole('fan'); // Default to fan
        }
      }
    }
  }, [user, viewingUserId, viewingUsername]);

  // Set up real-time XP balance updates
  useEffect(() => {
    if (!profile?.user_id) return;
    const channel = supabase.channel('xp-balance-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_xp_balances',
      filter: `user_id=eq.${profile.user_id}`
    }, (payload: any) => {
      console.log('XP balance updated:', payload);
      if (payload.new && typeof payload.new.current_xp === 'number') {
        setXpBalance(payload.new.current_xp);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);
  const fetchProfile = async () => {
    const targetUserId = viewingUsername ? null : viewingUserId || user?.id;
    if (!targetUserId && !viewingUsername) return;
    try {
      let profileRes: any;
      if (viewingUsername) {
        profileRes = await supabase.from('public_profiles' as any).select('*').eq('username', viewingUsername).maybeSingle();
      } else if (isOwnProfile) {
        profileRes = await supabase.from('profiles').select('*').eq('user_id', targetUserId as string).maybeSingle();
      } else {
        profileRes = await supabase.from('public_profiles' as any).select('*').eq('user_id', targetUserId as string).maybeSingle();
      }
      const {
        data,
        error
      } = profileRes;
      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } else {
        setProfile(data);
        // If loaded by username, fetch follow stats now that we have user_id
        if (viewingUsername) {
          fetchFollowStats();
        }
        // Check if current user is following this profile (if not own profile)
        if (!isOwnProfile && user) {
          checkFollowStatus();
        }
        // Fetch post count and XP balance for this profile
        fetchPostCount();
        fetchXpBalance();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchFollowStats = async () => {
    const targetUserId = profile?.user_id || viewingUserId || user?.id;
    if (!targetUserId) return;
    try {
      const {
        data,
        error
      } = await supabase.from('user_follow_stats').select('followers_count, following_count').eq('user_id', targetUserId).maybeSingle();
      if (error) {
        console.error('Error fetching follow stats:', error);
      } else if (data) {
        setFollowStats(data);
      }
    } catch (error) {
      console.error('Error fetching follow stats:', error);
    }
  };
  const fetchPostCount = async () => {
    if (!profile?.user_id) return;
    try {
      const {
        count,
        error
      } = await supabase.from('posts').select('*', {
        count: 'exact',
        head: true
      }).eq('user_id', profile.user_id);
      if (error) {
        console.error('Error fetching post count:', error);
      } else {
        setPostCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching post count:', error);
    }
  };
  const fetchXpBalance = async () => {
    if (!profile?.user_id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('user_xp_balances').select('current_xp').eq('user_id', profile.user_id).maybeSingle();
      if (error) {
        console.error('Error fetching XP balance:', error);
      } else {
        setXpBalance(data?.current_xp || 0);
      }
    } catch (error) {
      console.error('Error fetching XP balance:', error);
    }
  };
  const checkFollowStatus = async () => {
    if (!user || !profile || isOwnProfile) return;
    try {
      const {
        data,
        error
      } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profile.user_id).single();
      setFollowing(!!data);
    } catch (error) {
      // No follow relationship exists
      setFollowing(false);
    }
  };
  const handleFollowToggle = async () => {
    if (!user || !profile || isOwnProfile) return;
    setFollowLoading(true);
    try {
      if (following) {
        // Unfollow
        const {
          error
        } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.user_id);
        if (error) throw error;
        setFollowing(false);
        // Update userFollowStates if this user is in the current list
        setUserFollowStates(prev => ({
          ...prev,
          [profile.user_id]: false
        }));
        // Refresh follow stats from server to get accurate count
        fetchFollowStats();
        toast({
          title: "Success",
          description: "Unfollowed user"
        });
      } else {
        // Follow
        const {
          error
        } = await supabase.from('follows').insert([{
          follower_id: user.id,
          following_id: profile.user_id
        }]);
        if (error) throw error;
        setFollowing(true);
        // Update userFollowStates if this user is in the current list
        setUserFollowStates(prev => ({
          ...prev,
          [profile.user_id]: true
        }));
        // Refresh follow stats from server to get accurate count
        fetchFollowStats();
        toast({
          title: "Success",
          description: "Following user"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const {
        data,
        error
      } = await supabase.from('public_profiles' as any).select('user_id, username, display_name, avatar_url, bio, location, interests, spotify_connected').or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%,interests.ilike.%${query}%,location.ilike.%${query}%`).neq('user_id', user?.id || '').limit(10);
      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search users",
          variant: "destructive"
        });
      } else {
        setSearchResults(data as any || []);
      }
    } catch (error) {
      console.error('Unexpected search error:', error);
    } finally {
      setSearching(false);
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  };
  const viewProfile = (userId: string) => {
    navigate(`/universal-profile?userId=${userId}`);
    setSearchQuery('');
    setSearchResults([]);
  };
  const fetchFollowers = async () => {
    const targetUserId = profile?.user_id || viewingUserId || user?.id;
    if (!targetUserId) return;
    try {
      // First get the follow relationships
      const {
        data: followsData,
        error: followsError
      } = await supabase.from('follows').select('follower_id').eq('following_id', targetUserId);
      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return;
      }
      if (!followsData || followsData.length === 0) {
        setFollowers([]);
        return;
      }

      // Get follower user IDs
      const followerIds = followsData.map(f => f.follower_id);

      // Then get the profiles for those followers
      const {
        data: profilesData,
        error: profilesError
      } = await supabase.from('public_profiles' as any).select('user_id, username, display_name, avatar_url').in('user_id', followerIds);
      if (profilesError) {
        console.error('Error fetching follower profiles:', profilesError);
        return;
      }
      setFollowers(profilesData as any || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };
  const fetchFollowing = async () => {
    const targetUserId = profile?.user_id || viewingUserId || user?.id;
    if (!targetUserId) return;
    try {
      // First get the follow relationships  
      const {
        data: followsData,
        error: followsError
      } = await supabase.from('follows').select('following_id').eq('follower_id', targetUserId);
      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return;
      }
      if (!followsData || followsData.length === 0) {
        setFollowingUsers([]);
        return;
      }

      // Get following user IDs
      const followingIds = followsData.map(f => f.following_id);

      // Then get the profiles for those users
      const {
        data: profilesData,
        error: profilesError
      } = await supabase.from('public_profiles' as any).select('user_id, username, display_name, avatar_url').in('user_id', followingIds);
      if (profilesError) {
        console.error('Error fetching following profiles:', profilesError);
        return;
      }
      const followingData = profilesData as any || [];
      setFollowingUsers(followingData);

      // Check follow states for all users in the list
      if (user && !isOwnProfile) {
        checkMultipleFollowStates(followingData);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };
  const checkMultipleFollowStates = async (users: Profile[]) => {
    if (!user || users.length === 0) return;
    try {
      const userIds = users.map(u => u.user_id);
      const {
        data,
        error
      } = await supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', userIds);
      if (error) {
        console.error('Error checking follow states:', error);
        return;
      }
      const followingIds = new Set(data?.map(f => f.following_id) || []);
      const states: Record<string, boolean> = {};
      users.forEach(u => {
        states[u.user_id] = followingIds.has(u.user_id);
      });
      setUserFollowStates(states);
    } catch (error) {
      console.error('Error checking follow states:', error);
    }
  };
  const openFollowingList = () => {
    setListType('following');
    fetchFollowing();
    setShowFollowersList(true);
    // Clear and refresh follow states for the following list
    setUserFollowStates({});
  };
  const handleUserFollowToggle = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return;
    const isCurrentlyFollowing = userFollowStates[targetUserId];
    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const {
          error
        } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
        if (error) throw error;
        setUserFollowStates(prev => ({
          ...prev,
          [targetUserId]: false
        }));
        // Update main following state if we're currently viewing this user's profile
        if (profile?.user_id === targetUserId) {
          setFollowing(false);
        }
        // Refresh follow stats
        fetchFollowStats();
        toast({
          title: "Success",
          description: "Unfollowed user"
        });
      } else {
        // Follow
        const {
          error
        } = await supabase.from('follows').insert([{
          follower_id: user.id,
          following_id: targetUserId
        }]);
        if (error) throw error;
        setUserFollowStates(prev => ({
          ...prev,
          [targetUserId]: true
        }));
        // Update main following state if we're currently viewing this user's profile
        if (profile?.user_id === targetUserId) {
          setFollowing(true);
        }
        // Refresh follow stats
        fetchFollowStats();
        toast({
          title: "Success",
          description: "Following user"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const openFollowersList = async () => {
    setListType('followers');
    await fetchFollowers();
    setShowFollowersList(true);
    // Clear and refresh follow states for the followers list
    setUserFollowStates({});
  };

  // Check follow states when followers data changes
  useEffect(() => {
    if (!isOwnProfile && user && followers.length > 0 && listType === 'followers') {
      checkMultipleFollowStates(followers);
    }
  }, [followers, isOwnProfile, user, listType]);

  // Check follow states when following data changes  
  useEffect(() => {
    if (!isOwnProfile && user && followingUsers.length > 0 && listType === 'following') {
      checkMultipleFollowStates(followingUsers);
    }
  }, [followingUsers, isOwnProfile, user, listType]);

  // Fetch post count and XP when profile changes
  useEffect(() => {
    if (profile?.user_id) {
      fetchPostCount();
      fetchXpBalance();
    }
  }, [profile?.user_id]);

  // Remove unused handleMessage function - replaced with MessageCreator component

  const handleRoleSelection = (role: 'fan' | 'creator') => {
    setRoleModalOpen(false);
    if (role === 'fan') {
      navigate('/fan-dashboard');
    } else {
      navigate('/creator-dashboard');
    }
  };
  const connectSpotify = async () => {
    const {
      error
    } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-modify-public playlist-modify-private'
      }
    });
    if (error) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file to Supabase Storage
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: urlData
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Update profile with new avatar URL
      const {
        error: updateError
      } = await supabase.from('profiles').update({
        avatar_url: urlData.publicUrl
      }).eq('user_id', user.id);
      if (updateError) throw updateError;

      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        avatar_url: urlData.publicUrl
      } : null);
      toast({
        title: "Success",
        description: "Avatar updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">We couldn't load your profile data.</p>
            <Button onClick={fetchProfile}>Retry</Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <img src="/lovable-uploads/streamcentivesloveable.PNG" alt="Streamcentives Logo" className="w-6 h-6 rounded-full flex-shrink-0" />
            <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Streamcentives
            </h1>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button onClick={() => navigate('/feed')} variant="outline" size="sm" className="flex items-center gap-1 px-2 text-xs">
              <Search className="h-3 w-3" />
              <span className="hidden sm:inline">Explore</span>
            </Button>
            {!isOwnProfile && <Button onClick={() => navigate('/universal-profile')} variant="outline" size="sm" className="flex items-center gap-1 px-2 text-xs">
                <Users className="h-3 w-3" />
                <span className="hidden sm:inline">My Profile</span>
              </Button>}
            <Button onClick={() => navigate('/inbox')} variant="outline" size="sm" className="flex items-center gap-1 px-2 text-xs">
              <Mail className="h-3 w-3" />
              <span className="hidden sm:inline">Inbox</span>
            </Button>
            <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 px-2 text-xs">
                  <span className="hidden sm:inline">Switch Dashboard</span>
                  <span className="sm:hidden">Switch</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Choose Your Dashboard</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <Card className="cursor-pointer hover:border-primary transition-colors group" onClick={() => handleRoleSelection('fan')}>
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30">
                        <Users className="h-12 w-12 mx-auto text-primary mb-2" />
                      </div>
                      <CardTitle>Fan Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Earn XP for streams and engagement</span>
                        </div>
                        <div className="flex items-center gap-3 px-0 mx-0">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Join campaigns and challenges</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm px-0">Redeem exclusive rewards</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Compete on leaderboards</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-primary hover:opacity-90">
                        <Users className="h-4 w-4 mr-2" />
                        Enter Fan Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:border-primary transition-colors group" onClick={() => handleRoleSelection('creator')}>
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 group-hover:from-secondary/30 group-hover:to-accent/30">
                        <Music className="h-12 w-12 mx-auto text-primary mb-2" />
                      </div>
                      <CardTitle>Creator Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full my-0 py-[16px] mx-[77px]"></div>
                          <span className="text-sm">Create AI-powered campaigns</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-sm">Engage and reward fans</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-sm">Access detailed analytics</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-sm">Generate revenue streams</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-accent hover:opacity-90">
                        <Music className="h-4 w-4 mr-2" />
                        Enter Creator Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search for users and creators or brands..." value={searchQuery} onChange={handleSearchChange} className="pl-10" />
              {searching && <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map(result => <div key={result.user_id} onClick={() => viewProfile(result.user_id)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.avatar_url || ''} />
                      <AvatarFallback>
                        {result.display_name?.[0] || result.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {result.display_name || result.username || 'Anonymous User'}
                      </div>
                      {result.username && result.display_name && <div className="text-sm text-muted-foreground">@{result.username}</div>}
                      {result.bio && <div className="text-sm text-muted-foreground truncate">
                          {result.bio}
                        </div>}
                    </div>
                    <div className="flex items-center gap-1">
                      {result.spotify_connected && <Badge variant="outline" className="text-xs">
                          <Music className="h-3 w-3 mr-1" />
                          Creator
                        </Badge>}
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Fan
                      </Badge>
                    </div>
                  </div>)}
              </div>}
            
            {searchQuery && searchResults.length === 0 && !searching && <div className="mt-4 text-center text-muted-foreground py-4">
                No users found matching "{searchQuery}"
              </div>}
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex-shrink-0 text-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 mx-auto">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-2xl">
                      {profile.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
                  <Button size="sm" className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={uploading}>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Bio and Details - Moved under avatar */}
                <div className="space-y-2 text-sm text-muted-foreground text-center mt-4">
                  {profile.bio && <p>{profile.bio}</p>}
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {profile.display_name || 'New User'}
                      </h2>
                      {profile.username && <p className="text-muted-foreground">@{profile.username}</p>}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Bronze Tier
                      </Badge>
                      {profile.spotify_connected && <Badge className="bg-[#1db954] hover:bg-[#1ed760] text-white">
                          <Music className="h-3 w-3 mr-1" />
                          Spotify Connected
                        </Badge>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-4">
                    {isOwnProfile ? <Button onClick={() => navigate('/profile/edit')} className="bg-gradient-primary hover:opacity-90">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button> : <>
                        <Button onClick={handleFollowToggle} disabled={followLoading} variant={following ? "outline" : "default"} className={following ? "" : "bg-gradient-primary hover:opacity-90"}>
                          {following ? <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Unfollow
                            </> : <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </>}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Send Message</DialogTitle>
                            </DialogHeader>
                            <MessageCreator recipientId={profile.user_id} recipientName={profile.display_name || 'User'} />
                          </DialogContent>
                        </Dialog>
                      </>}
                  </div>

                 {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{postCount}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors" onClick={openFollowersList}>
                    <div className="text-2xl font-bold">{followStats.followers_count}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors" onClick={openFollowingList}>
                    <div className="text-2xl font-bold">{followStats.following_count}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{xpBalance}</div>
                    <div className="text-sm text-muted-foreground">XP</div>
                  </div>
                </div>

                {/* Connect Spotify Button */}
                {!profile.spotify_connected && <Button onClick={connectSpotify} className="mt-4 bg-[#1db954] hover:bg-[#1ed760] text-white">
                    <Music className="h-4 w-4 mr-2" />
                    Connect Spotify
                  </Button>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <PostsGrid userId={profile?.user_id || viewingUserId || user?.id || ''} isOwnProfile={isOwnProfile} />
          </TabsContent>
          
          <TabsContent value="campaigns" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
                  {isOwnProfile ?
                // Show different content based on user's role
                userRole === 'creator' ? <div className="space-y-4">
                        <p className="text-muted-foreground">No campaigns created yet. Start building your community with your first campaign!</p>
                        <Button onClick={() => navigate('/campaigns')} className="bg-gradient-primary hover:opacity-90">
                          Create Campaign
                        </Button>
                      </div> : <div className="space-y-4">
                        <p className="text-muted-foreground">No campaigns joined yet. Discover and join campaigns to start earning XP!</p>
                        <Button onClick={() => navigate('/fan-campaigns')} className="bg-gradient-primary hover:opacity-90">
                          Join Campaigns
                        </Button>
                      </div> :
                // Viewing someone else's profile - show generic message
                <p className="text-muted-foreground">No public campaign activity to display.</p>}
                </div>

                {/* Share & Earn Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Share Campaigns & Earn XP</h3>
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">Share on Streamcentives</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Repost campaigns to your feed and earn XP when others engage
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">+10 XP per share</span>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">Share Off-Platform</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Share campaigns on social media to attract new users
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">+20 XP per share</span>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Earn XP once per campaign per day. Only fans can earn XP from sharing creator content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rewards" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No rewards yet. Earn XP to unlock amazing rewards!</p>
                </div>

                {/* Share & Earn Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Share Rewards & Earn XP</h3>
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">Share on Streamcentives</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Show off exclusive rewards and inspire others to engage
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">+5 XP per share</span>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">Share Off-Platform</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Showcase rewards on social media to attract new fans
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">+15 XP per share</span>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Earn XP once per reward per day. Only fans can earn XP from sharing creator content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Statistics will appear here as you engage with the platform.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Followers/Following List Modal */}
        <Dialog open={showFollowersList} onOpenChange={setShowFollowersList}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {listType === 'followers' ? `Followers (${followStats.followers_count})` : `Following (${followStats.following_count})`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(listType === 'followers' ? followers : followingUsers).length > 0 ? (listType === 'followers' ? followers : followingUsers).map(person => <div key={person.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <Avatar className="h-10 w-10 cursor-pointer" onClick={() => {
                viewProfile(person.user_id);
                setShowFollowersList(false);
              }}>
                      <AvatarImage src={person.avatar_url || ''} />
                      <AvatarFallback>
                        {person.display_name?.[0] || person.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 cursor-pointer" onClick={() => {
                viewProfile(person.user_id);
                setShowFollowersList(false);
              }}>
                      <div className="font-medium">
                        {person.display_name || person.username || 'Anonymous User'}
                      </div>
                      {person.username && person.display_name && <div className="text-sm text-muted-foreground">@{person.username}</div>}
                    </div>
                    {/* Follow/Unfollow button - only show if viewing from own profile and not the person's own entry */}
                    {isOwnProfile && person.user_id !== user?.id && <Button size="sm" variant={userFollowStates[person.user_id] ? "outline" : "default"} onClick={() => handleUserFollowToggle(person.user_id)} className={userFollowStates[person.user_id] ? "" : "bg-gradient-primary hover:opacity-90"}>
                        {userFollowStates[person.user_id] ? <>
                            <UserMinus className="h-3 w-3 mr-1" />
                            Unfollow
                          </> : <>
                            <UserPlus className="h-3 w-3 mr-1" />
                            Follow
                          </>}
                      </Button>}
                  </div>) : <div className="text-center text-muted-foreground py-8">
                  {listType === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default UniversalProfile;