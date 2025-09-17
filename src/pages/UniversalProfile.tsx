import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, MapPin, Globe, Calendar, Star, Trophy, Gift, BarChart3, Users, Music, Settings, UserPlus, UserMinus, UserX, MessageCircle, Search, Share2, Mail, Heart, DollarSign, Link2 } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import { PostsGrid } from '@/components/PostsGrid';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MessageCreator from '@/components/MessageCreator';
import { UniversalShareButton } from '@/components/UniversalShareButton';
import { UserCampaignDisplay } from '@/components/UserCampaignDisplay';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { HeartAnimation } from '@/components/ui/heart-animation';
import { ContextMenuGesture } from '@/components/ui/context-menu-gesture';
import { useIsMobile } from '@/hooks/use-mobile';
import { SmartLinkManager } from '@/components/SmartLinkManager';
import { SmartLinkButton } from '@/components/SmartLinkButton';
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
  const isMobile = useIsMobile();
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
  const [supporters, setSupporters] = useState<Profile[]>([]);
  const [supporterStates, setSupporterStates] = useState<Record<string, boolean>>({});
  const [confirmAddSupporter, setConfirmAddSupporter] = useState<{
    show: boolean;
    profile: Profile | null;
  }>({ show: false, profile: null });
  const [haters, setHaters] = useState<Profile[]>([]);
  const [haterStates, setHaterStates] = useState<Record<string, boolean>>({});
  const [confirmAddHater, setConfirmAddHater] = useState<{
    show: boolean;
    profile: Profile | null;
  }>({ show: false, profile: null });
  const [joinedCampaigns, setJoinedCampaigns] = useState<any[]>([]);
  const unreadCount = useUnreadMessages();

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  // Gesture states
  const [showHeartAnimation, setShowHeartAnimation] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    userId: string | null;
  }>({ isVisible: false, position: { x: 0, y: 0 }, userId: null });
  const [pinchScale, setPinchScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  // Haptic feedback
  const { triggerHaptic } = useHapticFeedback();

  // Check if viewing own profile or another user's profile
  const viewingUserId = searchParams.get('userId') || searchParams.get('user');
  const viewingUsername = searchParams.get('username');
  // If we have a user parameter, check if it's a UUID (user ID) or username
  const userParam = searchParams.get('user');
  const isUUID = userParam && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userParam);
  const finalUserId = isUUID ? userParam : viewingUserId;
  const finalUsername = !isUUID && userParam ? userParam : viewingUsername;
  const isOwnProfile = !finalUserId && !finalUsername || finalUserId === user?.id;
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFollowStats();
      // Force refresh XP balance if on own profile
      if (isOwnProfile) {
        setTimeout(() => fetchXpBalance(), 1000);
      }
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
  }, [user, finalUserId, finalUsername]);

  // Fetch campaigns after profile is loaded to ensure we have the correct user ID
  useEffect(() => {
    const targetUserId = profile?.user_id || finalUserId || user?.id;
    if (targetUserId) {
      fetchJoinedCampaigns();
    }
  }, [profile?.user_id, finalUserId, user?.id]);

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

  // Set up real-time campaign participation updates
  useEffect(() => {
    const targetUserId = profile?.user_id || finalUserId || user?.id;
    if (!targetUserId) return;
    
    const channel = supabase.channel(`campaign-participation-${targetUserId}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'campaign_participants',
      filter: `user_id=eq.${targetUserId}`
    }, (payload: any) => {
      console.log('Campaign participation updated:', payload);
      // Immediately refresh joined campaigns when user joins/leaves campaigns
      setTimeout(() => fetchJoinedCampaigns(), 100);
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, finalUserId, user?.id]);

  const fetchProfile = async () => {
    const targetUserId = finalUsername ? null : finalUserId || user?.id;
    if (!targetUserId && !finalUsername) return;
    try {
      let profileRes: any;
      if (finalUsername) {
        profileRes = await supabase.from('profiles').select('*').eq('username', finalUsername).maybeSingle();
      } else {
        profileRes = await supabase.from('profiles').select('*').eq('user_id', targetUserId as string).maybeSingle();
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
        if (finalUsername) {
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
        console.log('Fetched XP balance:', data?.current_xp);
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

  // Fetch supporters for current profile
  const fetchSupporters = async () => {
    const targetUserId = profile?.user_id || viewingUserId || user?.id;
    if (!targetUserId) return;
    
    try {
      // First get supporter IDs
      const { data: supporterIds, error: supporterError } = await supabase
        .from('user_supporters')
        .select('supporter_id')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (supporterError) {
        console.error('Error fetching supporter IDs:', supporterError);
        return;
      }

      if (!supporterIds || supporterIds.length === 0) {
        setSupporters([]);
        return;
      }

      // Then get profile data for those supporters
      const ids = supporterIds.map(item => item.supporter_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio, location, interests')
        .in('user_id', ids);

      if (profileError) {
        console.error('Error fetching supporter profiles:', profileError);
        return;
      }

      setSupporters(profiles || []);
    } catch (error) {
      console.error('Error fetching supporters:', error);
    }
  };

  // Fetch haters for current profile
  const fetchHaters = async () => {
    const targetUserId = profile?.user_id || viewingUserId || user?.id;
    if (!targetUserId) return;
    
    try {
      // First get hater IDs
      const { data: haterIds, error: haterError } = await supabase
        .from('user_haters' as any)
        .select('hater_id')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (haterError) {
        console.error('Error fetching hater IDs:', haterError);
        return;
      }

      if (!haterIds || haterIds.length === 0) {
        setHaters([]);
        return;
      }

      // Then get profile data for those haters
      const ids = haterIds.map((item: any) => item.hater_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio, location, interests')
        .in('user_id', ids);

      if (profileError) {
        console.error('Error fetching hater profiles:', profileError);
        return;
      }

      setHaters(profiles || []);
    } catch (error) {
      console.error('Error fetching haters:', error);
    }
  };

  // Fetch joined campaigns for current profile
  const fetchJoinedCampaigns = async () => {
    const targetUserId = profile?.user_id || viewingUserId || user?.id;
    if (!targetUserId) return;

    try {
      const { data: campaignParticipants, error } = await supabase
        .from('campaign_participants')
        .select(`
          campaign_id,
          status,
          progress,
          joined_at,
          campaigns (
            id,
            title,
            description,
            type,
            xp_reward,
            cash_reward,
            end_date,
            image_url,
            creator_id
          )
        `)
        .eq('user_id', targetUserId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching joined campaigns:', error);
        return;
      }

      setJoinedCampaigns(campaignParticipants || []);
    } catch (error) {
      console.error('Error fetching joined campaigns:', error);
    }
  };

  // Check supporter states for search results
  const checkSupporterStates = async (profiles: Profile[]) => {
    if (!user || !isOwnProfile) return;
    
    try {
      const userIds = profiles.map(p => p.user_id);
      const { data, error } = await supabase
        .from('user_supporters')
        .select('supporter_id')
        .eq('user_id', user.id)
        .in('supporter_id', userIds);

      if (error) {
        console.error('Error checking supporter states:', error);
        return;
      }

      const supporterIds = new Set(data?.map(item => item.supporter_id) || []);
      const states: Record<string, boolean> = {};
      profiles.forEach(profile => {
        states[profile.user_id] = supporterIds.has(profile.user_id);
      });
      setSupporterStates(states);
    } catch (error) {
      console.error('Error checking supporter states:', error);
    }
  };

  // Check if users are mutually following each other
  const checkMutualFollow = async (userId1: string, userId2: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .or(`and(follower_id.eq.${userId1},following_id.eq.${userId2}),and(follower_id.eq.${userId2},following_id.eq.${userId1})`);

      if (error) {
        console.error('Error checking mutual follow:', error);
        return false;
      }

      // Check if both follow relationships exist
      const user1FollowsUser2 = data?.some(row => row.follower_id === userId1 && row.following_id === userId2);
      const user2FollowsUser1 = data?.some(row => row.follower_id === userId2 && row.following_id === userId1);
      
      return user1FollowsUser2 && user2FollowsUser1;
    } catch (error) {
      console.error('Error checking mutual follow:', error);
      return false;
    }
  };

  // Check if user is a creator with 5k+ followers
  const isCreatorWith5kFollowers = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_follow_stats')
        .select('followers_count')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking follower count:', error);
        return false;
      }

      return (data?.followers_count || 0) >= 5000;
    } catch (error) {
      console.error('Error checking follower count:', error);
      return false;
    }
  };

  // Handle adding a hater 
  const handleAddHater = async (profile: Profile) => {
    if (!user) return;

    try {
      setConfirmAddHater({ show: true, profile });
    } catch (error) {
      console.error('Error in handleAddHater:', error);
      toast({
        title: "Error",
        description: "Failed to add hater. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Confirm adding hater
  const confirmAddHaterAction = async () => {
    if (!user || !confirmAddHater.profile) return;

    try {
      const { error } = await supabase
        .from('user_haters' as any)
        .insert([{
          user_id: user.id,
          hater_id: confirmAddHater.profile.user_id
        }]);

      if (error) {
        console.error('Error adding hater:', error);
        toast({
          title: "Error",
          description: "Failed to add hater. They might already be in your haters list.",
          variant: "destructive"
        });
        return;
      }

      // Update hater states
      setHaterStates(prev => ({
        ...prev,
        [confirmAddHater.profile!.user_id]: true
      }));

      // Refresh haters list
      fetchHaters();

      toast({
        title: "Hater Added",
        description: `${confirmAddHater.profile.display_name || confirmAddHater.profile.username} has been added to your haters list.`,
      });

      setConfirmAddHater({ show: false, profile: null });
    } catch (error) {
      console.error('Error adding hater:', error);
      toast({
        title: "Error",
        description: "Failed to add hater. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Remove hater (placeholder until types update)
  const removeHaterAction = async (haterId: string) => {
    // TODO: Implement after database types are regenerated
    toast({
      title: "Feature Coming Soon", 
      description: "Haters functionality will be available after database setup completes.",
      variant: "default"
    });
  };

  // Handle adding a supporter with restrictions
  const handleAddSupporter = async (profile: Profile) => {
    if (!user) return;

    try {
      // Check if user is a creator with 5k+ followers
      const isCreator5k = await isCreatorWith5kFollowers(user.id);
      
      if (!isCreator5k) {
        // Check if users mutually follow each other
        const areMutualFollows = await checkMutualFollow(user.id, profile.user_id);
        
        if (!areMutualFollows) {
          toast({
            title: "Cannot Add Supporter",
            description: "You can only add people you mutually follow as supporters. Creators with 5k+ followers can add anyone.",
            variant: "destructive"
          });
          return;
        }
      }

      setConfirmAddSupporter({ show: true, profile });
    } catch (error) {
      console.error('Error in handleAddSupporter:', error);
      toast({
        title: "Error",
        description: "Failed to check eligibility. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Confirm adding supporter
  const confirmAddSupporterAction = async () => {
    const { profile } = confirmAddSupporter;
    if (!profile || !user) return;

    try {
      const { error } = await supabase
        .from('user_supporters')
        .insert([{
          user_id: user.id,
          supporter_id: profile.user_id
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Added",
            description: "This person is already in your supporters list",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        // Update local state
        setSupporters(prev => [profile, ...prev]);
        setSupporterStates(prev => ({
          ...prev,
          [profile.user_id]: true
        }));
        
        toast({
          title: "Success",
          description: `${profile.display_name || profile.username} added to your supporters!`
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setConfirmAddSupporter({ show: false, profile: null });
    }
  };

  // Gesture handlers
  const toggleFollowUser = async (userId: string, shouldFollow: boolean) => {
    if (!user || userId === user.id) return;
    
    try {
      if (!shouldFollow) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        if (error) throw error;
        
        setUserFollowStates(prev => ({ ...prev, [userId]: false }));
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert([{
            follower_id: user.id,
            following_id: userId
          }]);
        if (error) throw error;
        
        setUserFollowStates(prev => ({ ...prev, [userId]: true }));
      }
      
      // Update main profile following state if it's the same user
      if (profile?.user_id === userId) {
        setFollowing(shouldFollow);
        fetchFollowStats();
      }
      
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
      });
    }
  };

  const handleDoubleTapFollow = async (userId: string) => {
    if (userId === user?.id) return; // Can't follow yourself
    
    triggerHaptic('success');
    setShowHeartAnimation(prev => ({ ...prev, [userId]: true }));
    
    // Toggle follow state
    const isCurrentlyFollowing = userFollowStates[userId];
    await toggleFollowUser(userId, !isCurrentlyFollowing);
    
    toast({
      title: isCurrentlyFollowing ? "Unfollowed" : "Followed!",
      description: isCurrentlyFollowing ? "User unfollowed" : "Double-tap magic! ✨",
    });
  };

  const handleSwipeFollow = async (userId: string) => {
    if (userId === user?.id) return;
    
    triggerHaptic('medium');
    await toggleFollowUser(userId, true);
    
    toast({
      title: "Followed!",
      description: "Swiped to follow ➡️",
    });
  };

  const handleSwipeDismiss = (userId: string) => {
    triggerHaptic('light');
    setSearchResults(prev => prev.filter(result => result.user_id !== userId));
    
    toast({
      title: "Dismissed",
      description: "User removed from search",
    });
  };

  const handleLongPress = (userId: string, event: React.TouchEvent) => {
    if (userId === user?.id) return;
    
    triggerHaptic('heavy');
    const touch = event.touches[0];
    setContextMenu({
      isVisible: true,
      position: { x: touch.clientX, y: touch.clientY },
      userId,
    });
  };

  const handlePinchZoom = (scale: number) => {
    setPinchScale(scale);
    if (scale > 1.5 && !isZoomed) {
      setIsZoomed(true);
      triggerHaptic('light');
    } else if (scale <= 1.1 && isZoomed) {
      setIsZoomed(false);
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, userId: null });
  };

  const handleContextAction = async (action: string, userId: string) => {
    triggerHaptic('medium');
    
    switch (action) {
      case 'follow':
        await handleDoubleTapFollow(userId);
        break;
      case 'message':
        // Navigate to message
        navigate(`/inbox?user=${userId}`);
        break;
      case 'block':
        toast({
          title: "User Blocked",
          description: "User has been blocked",
        });
        break;
      case 'report':
        toast({
          title: "User Reported",
          description: "Thank you for reporting",
        });
        break;
      case 'share':
        // Handle share
        break;
    }
  };

  // Remove supporter
  const removeSupporterAction = async (supporterId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_supporters')
        .delete()
        .eq('user_id', user.id)
        .eq('supporter_id', supporterId);

      if (error) throw error;

      // Update local state
      setSupporters(prev => prev.filter(s => s.user_id !== supporterId));
      setSupporterStates(prev => ({
        ...prev,
        [supporterId]: false
      }));

      toast({
        title: "Removed",
        description: "Supporter removed from your list"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Use the secure RPC function to search public profiles
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_query: query.trim(),
        limit_count: 10,
        offset_count: 0
      });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search users",
          variant: "destructive"
        });
      } else {
        setSearchResults((data || []) as unknown as Profile[]);
        // Check supporter states for search results
        if (data && data.length > 0) {
          checkSupporterStates((data || []) as unknown as Profile[]);
        }
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

      // Get profiles for followers using the safe function
      const profilePromises = followerIds.map(id => 
        supabase.rpc('get_public_profile_safe', { target_user_id: id })
      );
      const profileResults = await Promise.all(profilePromises);
      const profilesData = profileResults
        .map(result => result.data?.[0])
        .filter(Boolean);
      
      if (profilesData.length === 0) {
        console.error('Error fetching follower profiles');
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

      // Get profiles for following users using the safe function
      const profilePromises = followingIds.map(id => 
        supabase.rpc('get_public_profile_safe', { target_user_id: id })
      );
      const profileResults = await Promise.all(profilePromises);
      const profilesData = profileResults
        .map(result => result.data?.[0])
        .filter(Boolean);
      
      if (profilesData.length === 0) {
        console.error('Error fetching following profiles');
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
  // Remove follower (when viewing your own followers list)
  const handleRemoveFollower = async (followerUserId: string) => {
    if (!user || followerUserId === user.id) return;
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerUserId)
        .eq('following_id', user.id);
      if (error) throw error;

      // Optimistic UI update for real-time feel
      setFollowers(prev => prev.filter(p => p.user_id !== followerUserId));
      setFollowStats(prev => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }));

      toast({
        title: 'Removed follower',
        description: 'This user no longer follows you.'
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };
  
  // Pull-to-refresh functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    // Only allow pull down when at top of page
    if (window.scrollY === 0 && diff > 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff / 3, 100)); // Limit pull distance
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      // Refresh profile data
      Promise.all([
        fetchProfile(),
        fetchFollowStats(),
        fetchXpBalance()
      ]).finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        toast({
          title: "Profile refreshed",
          description: "Your profile data has been updated"
        });
      });
    } else {
      setPullDistance(0);
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
    if (user && followers.length > 0 && listType === 'followers') {
      checkMultipleFollowStates(followers);
    }
  }, [followers, user, listType]);

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
      fetchSupporters();
      fetchHaters();
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
    try {
      // Detect if user is on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Use linkIdentity to connect Spotify to existing account
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/universal-profile`,
          scopes: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
          skipBrowserRedirect: isMobile ? false : true,
        },
      });

      if (error) {
        toast({
          title: 'Connection Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Only handle popup flow for desktop
      if (!isMobile) {
        const url = data?.url;
        if (url) {
          // Open OAuth flow in a popup window
          const popup = window.open(
            url,
            'spotify-connect',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );
          
          if (!popup) {
            toast({
              title: 'Popup Blocked',
              description: 'Please allow popups for Spotify connection to work.',
              variant: 'destructive',
            });
          } else {
            // Listen for popup close to refresh data
            const checkClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkClosed);
                // Refresh profile data after connection
                window.location.reload();
              }
            }, 1000);
          }
        } else {
          toast({
            title: 'Connection Error',
            description: 'Could not start Spotify connection flow.',
            variant: 'destructive',
          });
        }
      }
      // For mobile, the browser will handle the redirect automatically
    } catch (error) {
      console.error('Spotify connection error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect with Spotify',
        variant: 'destructive',
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
  return <div className="min-h-screen bg-background p-4" 
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    {/* Pull-to-refresh indicator */}
    {pullDistance > 0 && (
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4"
        style={{ transform: `translateY(${Math.min(pullDistance - 60, 0)}px)` }}
      >
        <div className="bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 border shadow-lg">
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Refreshing...</span>
            </div>
          ) : pullDistance > 60 ? (
            <span className="text-sm">Release to refresh</span>
          ) : (
            <span className="text-sm">Pull down to refresh</span>
          )}
        </div>
      </div>
    )}
    
      <div className="w-full max-w-4xl mx-auto space-y-6 px-2 sm:px-4 pt-4" style={{ paddingTop: pullDistance > 0 ? `${pullDistance}px` : '16px' }}>
        {/* Header - Instagram Style */}
        <div className="flex justify-between items-center gap-2 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img src="/lovable-uploads/streamcentivesloveable.PNG" alt="Streamcentives Logo" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
              Streamcentives
            </h1>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {!isOwnProfile && <Button onClick={() => navigate('/universal-profile')} variant="ghost" size="sm" className="p-2">
                <Users className="h-5 w-5" />
              </Button>}
            <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 px-2 text-xs">
                  <span className="hidden sm:inline">Switch Dashboard</span>
                  <span className="sm:hidden">Switch</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Choose Your Dashboard</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 p-2 sm:p-0">
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
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-primary rounded-full"></div>
                           <span className="text-sm">Join campaigns and challenges</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-primary rounded-full"></div>
                           <span className="text-sm">Redeem exclusive rewards</span>
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
                           <div className="w-2 h-2 bg-primary rounded-full"></div>
                           <span className="text-sm">Create AI-powered campaigns</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-primary rounded-full"></div>
                           <span className="text-sm">Engage and reward fans</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-primary rounded-full"></div>
                           <span className="text-sm">Access detailed analytics</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 bg-primary rounded-full"></div>
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

        {/* Search Section - Minimal Compact */}
        <div className="max-w-md mx-auto">
          <Card className="card-modern shadow-sm">
            <CardContent className="p-1.5 sm:p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search for users and creators..." 
                  value={searchQuery} 
                  onChange={handleSearchChange} 
                  className="pl-9 h-8 text-sm border-0 bg-muted/30 focus:bg-white focus:text-black placeholder:text-muted-foreground transition-colors" 
                />
                {searching && <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary"></div>
                  </div>}
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                {searchResults.map(result => {
                  // Create gesture handlers for each result without using hooks
                  const handleTouchStart = (e: React.TouchEvent) => {
                    const touch = e.touches[0];
                    const touchData = {
                      startX: touch.clientX,
                      startY: touch.clientY,
                      startTime: Date.now(),
                      userId: result.user_id
                    };
                    
                    // Store touch data on the element
                    (e.currentTarget as any)._touchData = touchData;
                    
                    // Long press timer
                    const longPressTimer = setTimeout(() => {
                      triggerHaptic('heavy');
                      setContextMenu({
                        isVisible: true,
                        position: { x: touch.clientX, y: touch.clientY },
                        userId: result.user_id,
                      });
                    }, 500);
                    
                    (e.currentTarget as any)._longPressTimer = longPressTimer;
                  };

                  const handleTouchMove = (e: React.TouchEvent) => {
                    // Cancel long press on move
                    const timer = (e.currentTarget as any)._longPressTimer;
                    if (timer) {
                      clearTimeout(timer);
                      (e.currentTarget as any)._longPressTimer = null;
                    }
                  };

                  const handleTouchEnd = (e: React.TouchEvent) => {
                    const timer = (e.currentTarget as any)._longPressTimer;
                    if (timer) {
                      clearTimeout(timer);
                      (e.currentTarget as any)._longPressTimer = null;
                    }

                    const touchData = (e.currentTarget as any)._touchData;
                    if (!touchData) return;

                    const touch = e.changedTouches[0];
                    const deltaX = touch.clientX - touchData.startX;
                    const deltaY = touch.clientY - touchData.startY;
                    const deltaTime = Date.now() - touchData.startTime;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    // Check for swipe gestures
                    if (distance > 50 && deltaTime < 300 && Math.abs(deltaX) > Math.abs(deltaY)) {
                      if (deltaX > 0) {
                        // Swipe right - follow
                        handleSwipeFollow(result.user_id);
                      } else {
                        // Swipe left - dismiss
                        handleSwipeDismiss(result.user_id);
                      }
                      return;
                    }

                    // Check for double tap
                    const lastTap = (e.currentTarget as any)._lastTap || 0;
                    const now = Date.now();
                    if (now - lastTap < 300 && distance < 50) {
                      handleDoubleTapFollow(result.user_id);
                      (e.currentTarget as any)._lastTap = 0;
                    } else {
                      (e.currentTarget as any)._lastTap = now;
                    }
                  };

                  return (
                    <div
                      key={result.user_id}
                      className="relative flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-all duration-200 select-none"
                      onClick={() => viewProfile(result.user_id)}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* Heart Animation */}
                      <HeartAnimation 
                        isVisible={showHeartAnimation[result.user_id] || false}
                        onComplete={() => setShowHeartAnimation(prev => ({ ...prev, [result.user_id]: false }))}
                      />
                      
                      <Avatar className="h-9 w-9">
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
                        {/* Follow indicator */}
                        {userFollowStates[result.user_id] && (
                          <Badge variant="outline" className="text-xs text-primary">
                            <Heart className="h-3 w-3 mr-1 fill-primary" />
                            Following
                          </Badge>
                        )}
                        {result.spotify_connected && <Badge variant="outline" className="text-xs">
                            <Music className="h-3 w-3 mr-1" />
                            Creator
                          </Badge>}
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Fan
                        </Badge>
                      </div>
                      
                      {/* Swipe indicators */}
                      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 pointer-events-none transition-opacity" />
                      <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-red-500/20 to-transparent opacity-0 pointer-events-none transition-opacity" />
                    </div>
                  );
                })}
              </div>}
            
            {searchQuery && !searching && searchResults.length === 0 && (
              <div className="text-center text-muted-foreground py-3 text-sm">
                No users found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Profile Card - Instagram Style */}
        <Card className="card-modern">
          <CardContent className="p-4">
            {/* Profile Header Row */}
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className="relative">
                <div 
                  className={`transform transition-transform duration-300 ${isZoomed ? 'scale-150 z-10' : 'scale-100'}`}
                  onTouchStart={(e) => {
                    if (e.touches.length === 2) {
                      const touch1 = e.touches[0];
                      const touch2 = e.touches[1];
                      const distance = Math.sqrt(
                        Math.pow(touch2.clientX - touch1.clientX, 2) + 
                        Math.pow(touch2.clientY - touch1.clientY, 2)
                      );
                      (e.currentTarget as any)._initialPinchDistance = distance;
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 2 && (e.currentTarget as any)._initialPinchDistance) {
                      const touch1 = e.touches[0];
                      const touch2 = e.touches[1];
                      const distance = Math.sqrt(
                        Math.pow(touch2.clientX - touch1.clientX, 2) + 
                        Math.pow(touch2.clientY - touch1.clientY, 2)
                      );
                      const scale = distance / (e.currentTarget as any)._initialPinchDistance;
                      handlePinchZoom(scale);
                    }
                  }}
                  onTouchEnd={(e) => {
                    (e.currentTarget as any)._initialPinchDistance = null;
                  }}
                >
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 cursor-pointer select-none">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-xl">
                      {profile.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {isOwnProfile && (
                  <>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
                    <Button size="sm" className="absolute -bottom-1 -right-1 rounded-full h-6 w-6 p-0 bg-primary hover:bg-primary/90" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={uploading}>
                      <Camera className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>

              {/* Stats - Instagram Layout */}
              <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg sm:text-xl font-bold">{postCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="cursor-pointer hover:opacity-75" onClick={openFollowersList}>
                  <div className="text-lg sm:text-xl font-bold">{followStats.followers_count}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="cursor-pointer hover:opacity-75" onClick={openFollowingList}>
                  <div className="text-lg sm:text-xl font-bold">{followStats.following_count}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold">
                  {profile.display_name || 'New User'}
                </h2>
                {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
              </div>
              
              {/* Bio and Details */}
              <div className="space-y-2">
                {profile.bio && <p className="text-sm">{profile.bio}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-yellow-500 font-medium">{xpBalance} XP</span>
                      {isOwnProfile && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-4 w-4 p-0 ml-1 hover:bg-yellow-100"
                          onClick={() => {
                            fetchXpBalance();
                            toast({
                              title: "Refreshed",
                              description: "XP balance updated",
                            });
                          }}
                        >
                          <BarChart3 className="h-3 w-3 text-yellow-500" />
                        </Button>
                      )}
                    </div>
                    {isOwnProfile && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-green-600 hover:text-green-700 font-medium"
                        onClick={() => navigate('/purchase-xp')}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Buy XP
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3" />
                  Bronze Tier
                </Badge>
                {profile.spotify_connected && <Badge className="bg-[#1db954] hover:bg-[#1ed760] text-white text-xs">
                    <Music className="h-3 w-3 mr-1" />
                    Spotify Connected
                  </Badge>}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isOwnProfile ? <Button onClick={() => navigate('/profile/edit')} className="flex-1 bg-gradient-primary hover:opacity-90">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button> : <>
                    <Button onClick={handleFollowToggle} disabled={followLoading} variant={following ? "outline" : "default"} className={`flex-1 ${following ? "" : "bg-gradient-primary hover:opacity-90"}`}>
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
                        <Button variant="outline" className="flex-1">
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

              {/* Universal Smart Link Section */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {profile.spotify_connected && <Badge className="bg-[#1db954] hover:bg-[#1ed760] text-white text-xs">
                    <Music className="h-3 w-3 mr-1" />
                      Spotify Connected
                    </Badge>}
                  
                  <Badge variant="outline" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Social Ready
                  </Badge>
                </div>
                
                <SmartLinkButton 
                  userId={profile.user_id}
                  displayName={profile.display_name || profile.username}
                  isOwnProfile={isOwnProfile}
                />
                
                <UniversalShareButton 
                  type="profile"
                  itemId={profile.user_id}
                  title={`Check out ${profile.display_name || profile.username}'s profile on StreamCentives!`}
                  description={profile.bio || "Join the music discovery revolution"}
                  creatorName={profile.display_name || profile.username}
                  imageUrl={profile.avatar_url}
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className={`w-full flex md:grid overflow-x-auto gap-1 md:grid-cols-6`}>
            <TabsTrigger value="posts" className="whitespace-nowrap flex-shrink-0 min-w-[80px]">Posts</TabsTrigger>
            <TabsTrigger value="campaigns" className="whitespace-nowrap flex-shrink-0 min-w-[80px]">Campaigns</TabsTrigger> 
            <TabsTrigger value="rewards" className="whitespace-nowrap flex-shrink-0 min-w-[80px]">Rewards</TabsTrigger>
            <TabsTrigger value="smart-links" className="whitespace-nowrap flex-shrink-0 min-w-[80px]">
              <Link2 className="h-4 w-4 mr-1" />
              Smart Links
            </TabsTrigger>
            <TabsTrigger value="supporters" className="whitespace-nowrap flex-shrink-0 min-w-[80px]">Supporters</TabsTrigger>
            <TabsTrigger value="haters" className="whitespace-nowrap flex-shrink-0 min-w-[80px]">Haters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <PostsGrid userId={profile?.user_id || viewingUserId || user?.id || ''} isOwnProfile={isOwnProfile} />
          </TabsContent>
          
          <TabsContent value="campaigns" className="mt-6">
            <Card className="card-modern">
              <CardContent className="px-4 py-6 md:p-6">
                <UserCampaignDisplay 
                  campaigns={joinedCampaigns} 
                  userId={profile?.user_id || user?.id || ''} 
                  isOwnProfile={isOwnProfile} 
                />
                
                {/* Create/Join Campaign CTA */}
                {joinedCampaigns.length === 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-center space-y-4">
                      {isOwnProfile ? (
                        userRole === 'creator' ? (
                          <div className="space-y-4">
                            <p className="text-muted-foreground">No campaigns created yet. Start building your community with your first campaign!</p>
                            <Button onClick={() => navigate('/campaigns')} className="bg-gradient-primary hover:opacity-90">
                              Create Campaign
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-muted-foreground">No campaigns joined yet. Discover and join campaigns to start earning XP!</p>
                            <Button onClick={() => navigate('/fan-campaigns')} className="bg-gradient-primary hover:opacity-90">
                              Join Campaigns
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="space-y-4">
                          <p className="text-muted-foreground">This user hasn't joined any campaigns yet.</p>
                          <Button onClick={() => navigate('/fan-campaigns')} className="bg-gradient-primary hover:opacity-90">
                            Discover Campaigns
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                         <UniversalShareButton
                           type="profile"
                           itemId={profile?.user_id}
                           title={`${profile?.display_name || profile?.username || 'Creator'}'s Profile`}
                           description={`Check out ${profile?.display_name || profile?.username || 'this creator'} on Streamcentives!`}
                           creatorName={profile?.display_name || profile?.username}
                           isOwnContent={user?.id === profile?.user_id}
                         />
                       </div>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">Share Off-Platform</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Share campaigns on social media to attract new users
                      </p>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-primary">+20 XP per share</span>
                         <UniversalShareButton
                           type="campaign"
                           title="Streamcentives Campaigns"
                           description="Discover amazing campaigns and earn rewards on Streamcentives!"
                           creatorName={profile?.display_name || profile?.username}
                         />
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
                         <UniversalShareButton
                           type="reward"
                           title="Streamcentives Rewards"
                           description="Check out these amazing rewards on Streamcentives!"
                           creatorName={profile?.display_name || profile?.username}
                         />
                      </div>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2">Share Off-Platform</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Showcase rewards on social media to attract new fans
                      </p>
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-primary">+15 XP per share</span>
                         <UniversalShareButton
                           type="reward"
                           title="Streamcentives Rewards"
                           description="Discover exclusive rewards and earn them through engagement!"
                           creatorName={profile?.display_name || profile?.username}
                         />
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
          
          {/* Smart Links Tab - Available for Everyone */}
          <TabsContent value="smart-links" className="mt-6">
            {isOwnProfile ? (
              <SmartLinkManager />
            ) : (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Links</h3>
                <p className="text-muted-foreground mb-6">
                  This user hasn't created any public smart links yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Smart Links allow creators to share all their content and social media in one place, with XP rewards for fans who engage.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="supporters" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      {isOwnProfile ? 'My Top Supporters' : `${profile?.display_name || profile?.username || 'User'}'s Supporters`}
                    </h3>
                    {isOwnProfile && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Manage Supporters</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Search users to add as supporters..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10"
                              />
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            {/* Search Results */}
                            {searching && (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                              </div>
                            )}
                            
                            {searchResults.length > 0 && (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                <p className="text-sm text-muted-foreground mb-2">Search Results:</p>
                                {searchResults.map(profile => (
                                  <div key={profile.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={profile.avatar_url || ''} />
                                      <AvatarFallback>
                                        {profile.display_name?.[0] || profile.username?.[0]?.toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {profile.display_name || profile.username || 'Anonymous User'}
                                      </div>
                                      {profile.username && profile.display_name && <div className="text-sm text-muted-foreground">@{profile.username}</div>}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant={supporterStates[profile.user_id] ? "outline" : "default"}
                                      onClick={() => supporterStates[profile.user_id] ? removeSupporterAction(profile.user_id) : handleAddSupporter(profile)}
                                      className={supporterStates[profile.user_id] ? "" : "bg-gradient-primary hover:opacity-90"}
                                    >
                                      {supporterStates[profile.user_id] ? (
                                        <>
                                          <UserMinus className="h-3 w-3 mr-1" />
                                          Remove
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="h-3 w-3 mr-1" />
                                          Add
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {searchQuery && !searching && searchResults.length === 0 && (
                              <div className="text-center text-muted-foreground py-4">
                                No users found matching your search.
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile 
                      ? "Showcase your most supportive fans and friends. This feature shows your top supporters."
                      : "These are the people this user has chosen to highlight as their top supporters."
                    }
                  </p>
                  
                  {/* Top Supporters Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {supporters.slice(0, 12).map((supporter) => (
                      <div key={supporter.user_id} className="text-center">
                        <Avatar className="h-12 w-12 mx-auto cursor-pointer hover:opacity-75" onClick={() => viewProfile(supporter.user_id)}>
                          <AvatarImage src={supporter.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {supporter.display_name?.[0] || supporter.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {supporter.display_name?.split(' ')[0] || supporter.username || 'User'}
                        </p>
                      </div>
                    ))}
                    {supporters.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <Heart className="h-12 w-12 mx-auto mb-2 opacity-30 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {isOwnProfile 
                            ? "No supporters yet. Add people to your supporters list!" 
                            : "This user hasn't added any supporters yet."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {supporters.length > 12 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View All {supporters.length} Supporters
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="haters" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserX className="h-5 w-5 text-red-500" />
                      {isOwnProfile ? 'My Haters List' : `${profile?.display_name || profile?.username || 'User'}'s Haters`}
                    </h3>
                    {isOwnProfile && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Manage Haters</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Search users to add as haters..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10"
                              />
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            {/* Search Results */}
                            {searching && (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                              </div>
                            )}
                            
                            {searchResults.length > 0 && (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                <p className="text-sm text-muted-foreground mb-2">Search Results:</p>
                                {searchResults.map(profile => (
                                  <div key={profile.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={profile.avatar_url || ''} />
                                      <AvatarFallback>
                                        {profile.display_name?.[0] || profile.username?.[0]?.toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {profile.display_name || profile.username || 'Anonymous User'}
                                      </div>
                                      {profile.username && profile.display_name && <div className="text-sm text-muted-foreground">@{profile.username}</div>}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant={haterStates[profile.user_id] ? "outline" : "default"}
                                      onClick={() => haterStates[profile.user_id] ? removeHaterAction(profile.user_id) : handleAddHater(profile)}
                                      className={haterStates[profile.user_id] ? "" : "bg-red-500 hover:bg-red-600"}
                                    >
                                      {haterStates[profile.user_id] ? (
                                        <>
                                          <UserMinus className="h-3 w-3 mr-1" />
                                          Remove
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="h-3 w-3 mr-1" />
                                          Add
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {searchQuery && !searching && searchResults.length === 0 && (
                              <div className="text-center text-muted-foreground py-4">
                                No users found matching your search.
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile 
                      ? "Keep track of users who violate policies or cause problems. This helps you manage troublesome interactions."
                      : "These are the people this user has flagged as policy violators or problematic users."
                    }
                  </p>
                  
                  {/* Haters Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {haters.slice(0, 12).map((hater) => (
                      <div key={hater.user_id} className="text-center">
                        <Avatar className="h-12 w-12 mx-auto cursor-pointer hover:opacity-75 border-2 border-red-200" onClick={() => viewProfile(hater.user_id)}>
                          <AvatarImage src={hater.avatar_url || ''} />
                          <AvatarFallback className="text-xs bg-red-50">
                            {hater.display_name?.[0] || hater.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {hater.display_name?.split(' ')[0] || hater.username || 'User'}
                        </p>
                      </div>
                    ))}
                    {haters.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <UserX className="h-12 w-12 mx-auto mb-2 opacity-30 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {isOwnProfile 
                            ? "No haters added yet. Add users who violate policies to keep track of them." 
                            : "This user hasn't flagged any haters yet."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {haters.length > 12 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View All {haters.length} Haters
                      </Button>
                    </div>
                  )}
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
                    {isOwnProfile && person.user_id !== user?.id && (
                      listType === 'followers' ? (
                        // For followers list, check if we're following them back
                        !userFollowStates[person.user_id] ? (
                          <Button size="sm" variant="default" onClick={() => handleUserFollowToggle(person.user_id)} className="bg-gradient-primary hover:opacity-90">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Follow Back
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleUserFollowToggle(person.user_id)}>
                              <UserMinus className="h-3 w-3 mr-1" />
                              Unfollow
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRemoveFollower(person.user_id)}>
                              <UserMinus className="h-3 w-3 mr-1" />
                              Remove Follower
                            </Button>
                          </div>
                        )
                      ) : (
                        // For following list, always show unfollow since we're following everyone in this list
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserFollowToggle(person.user_id)}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Unfollow
                        </Button>
                      )
                    )}
                  </div>) : <div className="text-center text-muted-foreground py-8">
                  {listType === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </div>}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Add Supporter Confirmation Dialog */}
        <Dialog open={confirmAddSupporter.show} onOpenChange={(open) => setConfirmAddSupporter({ show: open, profile: null })}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Supporter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center">
                Are you sure you want to add <strong>{confirmAddSupporter.profile?.display_name || confirmAddSupporter.profile?.username}</strong> to your supporters list?
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setConfirmAddSupporter({ show: false, profile: null })}>
                  No
                </Button>
                <Button onClick={confirmAddSupporterAction} className="bg-gradient-primary hover:opacity-90">
                  Yes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Hater Confirmation Dialog */}
        <Dialog open={confirmAddHater.show} onOpenChange={(open) => setConfirmAddHater({ show: open, profile: null })}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Hater</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center">
                Are you sure you want to add <strong>{confirmAddHater.profile?.display_name || confirmAddHater.profile?.username}</strong> to your haters list for policy violations?
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setConfirmAddHater({ show: false, profile: null })}>
                  No
                </Button>
                <Button onClick={confirmAddHaterAction} className="bg-red-500 hover:bg-red-600">
                  Yes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Context Menu */}
        <ContextMenuGesture
          isVisible={contextMenu.isVisible}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onFollow={() => contextMenu.userId && handleContextAction('follow', contextMenu.userId)}
          onMessage={() => contextMenu.userId && handleContextAction('message', contextMenu.userId)}
          onBlock={() => contextMenu.userId && handleContextAction('block', contextMenu.userId)}
          onReport={() => contextMenu.userId && handleContextAction('report', contextMenu.userId)}
          onShare={() => contextMenu.userId && handleContextAction('share', contextMenu.userId)}
          isFollowing={contextMenu.userId ? userFollowStates[contextMenu.userId] : false}
        />

        {/* Zoom overlay */}
        {isZoomed && (
          <div 
            className="fixed inset-0 bg-black/50 z-5 flex items-center justify-center"
            onClick={() => {
              setIsZoomed(false);
              setPinchScale(1);
            }}
          >
            <div className="text-white text-center">
              <p className="text-sm mb-2">Pinch to zoom out</p>
              <p className="text-xs opacity-75">Tap anywhere to close</p>
            </div>
          </div>
        )}
      </div>
    </div>;
};
export default UniversalProfile;