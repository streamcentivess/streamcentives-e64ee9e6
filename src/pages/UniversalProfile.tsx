import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, MapPin, Globe, Calendar, Star, Trophy, Gift, BarChart3, Users, Music, Settings, UserPlus, UserMinus, UserX, MessageCircle, Search, Share2, Mail, Heart, DollarSign, Link2, Building2 } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import { PostsGrid } from '@/components/PostsGrid';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MessageCreator from '@/components/MessageCreator';
import { SponsorContactOptions } from '@/components/SponsorContactOptions';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfileViewTracking } from '@/hooks/useProfileViewTracking';
import { useRealTimeProfiles } from '@/hooks/useRealTimeProfiles';
import { useCreatorRealtimeData } from '@/hooks/useCreatorRealtimeData';
import { useCreatorSubscription } from '@/hooks/useCreatorSubscription';
import { UniversalShareButton } from '@/components/UniversalShareButton';
import { UserCampaignDisplay } from '@/components/UserCampaignDisplay';
import EnhancedSocialInteractions from '@/components/EnhancedSocialInteractions';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { HeartAnimation } from '@/components/ui/heart-animation';
import { ContextMenuGesture } from '@/components/ui/context-menu-gesture';
import { useIsMobile } from '@/hooks/use-mobile';
import { SmartLinkManager } from '@/components/SmartLinkManager';
import { SmartLinkButton } from '@/components/SmartLinkButton';
import { AlgorithmicSuggestionPopup } from '@/components/AlgorithmicSuggestionPopup';
import { useAlgorithmicSuggestions } from '@/hooks/useAlgorithmicSuggestions';
import { useScrollTrigger } from '@/hooks/useScrollTrigger';

interface Profile {
  id?: string;
  user_id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  spotify_connected?: boolean;
  created_at?: string;
  offer_receiving_rate_cents?: number;
}

const UniversalProfile = () => {
  const { user, signOut } = useAuth();
  const { role: currentUserRole } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileOwnerRole, setProfileOwnerRole] = useState<'fan' | 'creator' | 'sponsor' | null>(null);
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
  const [userRoles, setUserRoles] = useState<Record<string, 'fan' | 'creator' | 'sponsor'>>({});
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

  // Algorithmic suggestions (only for profile owners)
  const {
    currentSuggestion,
    showSuggestion,
    dismissSuggestion,
    handleSuggestionAction,
    triggerSuggestion
  } = useAlgorithmicSuggestions();

  // Trigger suggestions on scroll when viewing own profile
  useScrollTrigger({
    onTrigger: triggerSuggestion,
    threshold: 600,
    cooldown: 60000, // 1 minute between suggestions on profile
    enabled: !!user && isOwnProfile // Only trigger for profile owners
  });
  
  // Track profile views for non-own profiles
  useProfileViewTracking({
    profileUserId: finalUserId || profile?.user_id || null,
    isOwnProfile,
    enabled: !!profile && !isOwnProfile
  });

  const fetchFollowStats = async () => {
    if (!profile?.user_id) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('following_id', profile.user_id);

      if (error) {
        console.error('Error fetching followers count:', error);
      } else {
        setFollowStats(prev => ({ ...prev, followers_count: data?.length || 0 }));
      }

      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', profile.user_id);

      if (followingError) {
        console.error('Error fetching following count:', followingError);
      } else {
        setFollowStats(prev => ({ ...prev, following_count: followingData?.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching follow stats:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!profile?.user_id || !user?.id || isOwnProfile) return;
    
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.user_id)
      .maybeSingle();
    
    setFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user?.id || !profile?.user_id) return;
    setFollowLoading(true);
    
    try {
      if (following) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id);
        setFollowing(false);
        setFollowStats(prev => ({ ...prev, followers_count: prev.followers_count - 1 }));
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: profile.user_id });
        setFollowing(true);
        setFollowStats(prev => ({ ...prev, followers_count: prev.followers_count + 1 }));
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: 'Success', description: 'Avatar updated successfully!' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Error', description: 'Failed to upload avatar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const fetchFollowers = async () => {
    if (!profile?.user_id) return;
    try {
      // First get the follower IDs
      const { data: followData, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', profile.user_id);

      if (error) {
        console.error('Error fetching follower IDs:', error);
        return;
      }

      if (followData && followData.length > 0) {
        const followerIds = followData.map(f => f.follower_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, bio')
          .in('user_id', followerIds);

        if (profilesError) {
          console.error('Error fetching follower profiles:', profilesError);
        } else {
          setFollowers(profilesData || []);
        }
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    if (!profile?.user_id) return;
    try {
      const { data: followData, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profile.user_id);

      if (error) {
        console.error('Error fetching following IDs:', error);
        return;
      }

      if (followData && followData.length > 0) {
        const followingIds = followData.map(f => f.following_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, bio')
          .in('user_id', followingIds);

        if (profilesError) {
          console.error('Error fetching following profiles:', profilesError);
        } else {
          setFollowingUsers(profilesData || []);
        }
      } else {
        setFollowingUsers([]);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchSupportersAndHaters = async () => {
    if (!user?.id) return;
    try {
      // This would need a supporters/haters table - for now using mock data
      setSupporters([]);
      setHaters([]);
    } catch (error) {
      console.error('Error fetching supporters and haters:', error);
    }
  };

  const handleAddSupporter = async (targetProfile: Profile | null) => {
    if (!targetProfile || !user?.id) return;
    
    try {
      // Add logic to save supporter relationship
      setSupporters(prev => [...prev, targetProfile]);
      setSupporterStates(prev => ({ ...prev, [targetProfile.user_id]: true }));
      
      toast({
        title: 'Success',
        description: `Added ${targetProfile.display_name || targetProfile.username} to supporters`,
      });
      
      setConfirmAddSupporter({ show: false, profile: null });
    } catch (error) {
      console.error('Error adding supporter:', error);
      toast({
        title: 'Error',
        description: 'Failed to add supporter',
        variant: 'destructive'
      });
    }
  };

  const handleAddHater = async (targetProfile: Profile | null) => {
    if (!targetProfile || !user?.id) return;
    
    try {
      // Add logic to save hater relationship
      setHaters(prev => [...prev, targetProfile]);
      setHaterStates(prev => ({ ...prev, [targetProfile.user_id]: true }));
      
      toast({
        title: 'Success',
        description: `Added ${targetProfile.display_name || targetProfile.username} to haters`,
      });
      
      setConfirmAddHater({ show: false, profile: null });
    } catch (error) {
      console.error('Error adding hater:', error);
      toast({
        title: 'Error',
        description: 'Failed to add hater',
        variant: 'destructive'
      });
    }
  };

  const fetchJoinedCampaigns = async () => {
    if (!profile?.user_id) return;
    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select('campaigns(*)')
        .eq('user_id', profile.user_id);

      if (error) {
        console.error('Error fetching joined campaigns:', error);
      } else {
        setJoinedCampaigns(data?.map(item => item.campaigns) || []);
      }
    } catch (error) {
      console.error('Error fetching joined campaigns:', error);
    }
  };

  const fetchXpBalance = async () => {
    if (!profile?.user_id && !user?.id) return;
    try {
      const targetUserId = profile?.user_id || user?.id;
      const { data, error } = await supabase
        .from('user_xp_balances')
        .select('current_xp')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching XP balance:', error);
      } else {
        setXpBalance(data?.current_xp || 0);
      }
    } catch (error) {
      console.error('Error fetching XP balance:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
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

  // Fetch additional data after profile is loaded
  useEffect(() => {
    if (profile) {
      fetchFollowStats();
      fetchXpBalance();
      checkFollowStatus();
      fetchSupportersAndHaters();
      
      const targetUserId = profile?.user_id || finalUserId || user?.id;
      if (targetUserId) {
        fetchJoinedCampaigns();
      }
    }
  }, [profile?.user_id, finalUserId, user?.id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Determine query based on whether we have userId or username
      let query;
      let targetUserId = finalUserId;
      
      if (finalUserId) {
        query = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', finalUserId)
          .maybeSingle();
      } else if (finalUsername) {
        query = supabase
          .from('profiles')
          .select('*')
          .eq('username', finalUsername)
          .maybeSingle();
      } else if (user?.id) {
        // Default to current user if no specific user requested
        targetUserId = user.id;
        query = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
      } else {
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await query;

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: 'Error',
          description: `Failed to load profile. ${profileError.message}`,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);
        // Set document title to profile display name
        document.title = `${profileData.display_name || profileData.username || 'Profile'} | Universal Profile`;

        // Fetch the user's role based on their user_id
        const { data: sponsorProfile } = await supabase
          .from('sponsor_profiles')
          .select('id')
          .eq('user_id', profileData.user_id)
          .maybeSingle();

        if (sponsorProfile) {
          setProfileOwnerRole('sponsor');
        } else if (profileData.spotify_connected) {
          setProfileOwnerRole('creator');
        } else {
          setProfileOwnerRole('fan');
        }
      } else {
        // If no profile data, navigate to create profile if it's the user's own profile
        if (isOwnProfile) {
          toast({
            title: 'No Profile Found',
            description: 'Redirecting to create profile.',
          });
          navigate('/profile/create');
        } else {
          toast({
            title: 'No Profile Found',
            description: 'No profile found for this user.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while loading the profile.',
        variant: 'destructive'
      });
     } finally {
       setLoading(false);
     }
   };

   return (
    <div className="min-h-screen bg-background">
      {/* Algorithmic Suggestion Popup - only show for profile owners */}
      {showSuggestion && currentSuggestion && isOwnProfile && (
        <AlgorithmicSuggestionPopup
          suggestion={currentSuggestion}
          onDismiss={dismissSuggestion}
          onAction={handleSuggestionAction}
          isVisible={showSuggestion}
        />
      )}
      
      {loading ? (
        <div className="text-center text-muted-foreground">
          Profile content loading...
        </div>
      ) : profile ? (
        <div className="container py-10">
          <Card className="w-full max-w-4xl mx-auto">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-2xl font-bold">{profile.display_name || profile.username}</CardTitle>
               <div className="flex items-center space-x-2">
                 {/* User Search Dialog */}
                 <Dialog>
                   <DialogTrigger asChild>
                     <Button variant="outline" size="sm">
                       <Search className="h-4 w-4" />
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="max-w-md">
                     <DialogHeader>
                       <DialogTitle>Search Users</DialogTitle>
                     </DialogHeader>
                     <div className="space-y-4">
                       <Input
                         placeholder="Search by username or name..."
                         value={searchQuery}
                         onChange={(e) => {
                           setSearchQuery(e.target.value);
                           searchUsers(e.target.value);
                         }}
                       />
                       {searching && <div className="text-center text-muted-foreground">Searching...</div>}
                       <div className="space-y-2">
                         {searchResults.map((user) => (
                           <div key={user.user_id} className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                               <Avatar className="w-8 h-8">
                                 <AvatarImage src={user.avatar_url} />
                                 <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}</AvatarFallback>
                               </Avatar>
                               <div>
                                 <p className="font-medium text-sm">{user.display_name || user.username}</p>
                                 <p className="text-xs text-muted-foreground">{user.bio}</p>
                               </div>
                             </div>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => navigate(`/universal-profile?user=${user.user_id}`)}
                             >
                               View
                             </Button>
                           </div>
                         ))}
                       </div>
                     </div>
                   </DialogContent>
                 </Dialog>

                 {/* Conditional rendering based on user role */}
                 {currentUserRole === 'sponsor' && !isOwnProfile && (
                    <SponsorContactOptions 
                      creator={{
                        user_id: profile.user_id,
                        username: profile.username || '',
                        display_name: profile.display_name,
                        avatar_url: profile.avatar_url,
                        bio: profile.bio,
                        followerCount: followStats.followers_count,
                        engagementRate: 0.05, // Default engagement rate
                        offer_receiving_rate_cents: profile.offer_receiving_rate_cents
                      }}
                      recipientName={profile.display_name || profile.username || 'User'}
                    />
                  )}
                  {/* Universal Share Button */}
                  <UniversalShareButton 
                    type="profile"
                    title={`${profile.display_name || profile.username || 'Profile'}'s Profile`}
                    description={profile.bio}
                    creatorName={profile.display_name || profile.username}
                    isOwnContent={isOwnProfile}
                  />
               </div>
             </CardHeader>
            <CardContent>
               <div className="flex flex-col md:flex-row items-center space-y-4 md:space-x-6 md:space-y-0">
                 <div className="relative">
                   <Avatar className="w-24 h-24 md:w-32 md:h-32">
                     <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username || 'Avatar'} />
                     <AvatarFallback>{profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}</AvatarFallback>
                   </Avatar>
                   {isOwnProfile && (
                     <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors">
                       <Camera className="h-4 w-4" />
                       <input
                         id="avatar-upload"
                         type="file"
                         accept="image/*"
                         onChange={handleAvatarUpload}
                         className="hidden"
                         disabled={uploading}
                       />
                     </label>
                   )}
                 </div>
                 <div className="flex-1">
                   <div className="flex flex-col space-y-2">
                     <div className="flex items-center space-x-2">
                       <h2 className="text-xl font-semibold">{profile.display_name || profile.username}</h2>
                       {profileOwnerRole && (
                         <Badge variant="secondary">{profileOwnerRole}</Badge>
                       )}
                     </div>
                     <p className="text-muted-foreground">{profile.bio || 'No bio available.'}</p>
                     <div className="flex items-center space-x-4">
                       {/* Follow Stats - clickable to show lists */}
                       <Dialog open={showFollowersList} onOpenChange={setShowFollowersList}>
                         <DialogTrigger asChild>
                           <Button 
                             variant="ghost" 
                             className="p-0 h-auto font-normal"
                             onClick={() => {
                               setListType('followers');
                               fetchFollowers();
                               setShowFollowersList(true);
                             }}
                           >
                             <div className="flex items-center space-x-1">
                               <Users className="h-4 w-4" />
                               <span>{followStats.followers_count} Followers</span>
                             </div>
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-md">
                           <DialogHeader>
                             <DialogTitle>
                               {listType === 'followers' ? 'Followers' : 'Following'}
                             </DialogTitle>
                           </DialogHeader>
                           <div className="space-y-4">
                             {(listType === 'followers' ? followers : followingUsers).map((user) => (
                               <div key={user.user_id} className="flex items-center justify-between">
                                 <div className="flex items-center space-x-3">
                                   <Avatar className="w-10 h-10">
                                     <AvatarImage src={user.avatar_url} />
                                     <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}</AvatarFallback>
                                   </Avatar>
                                   <div>
                                     <p className="font-medium">{user.display_name || user.username}</p>
                                     <p className="text-sm text-muted-foreground">{user.bio}</p>
                                   </div>
                                 </div>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => navigate(`/universal-profile?user=${user.user_id}`)}
                                 >
                                   View Profile
                                 </Button>
                               </div>
                             ))}
                           </div>
                         </DialogContent>
                       </Dialog>
                       
                       <Button 
                         variant="ghost" 
                         className="p-0 h-auto font-normal"
                         onClick={() => {
                           setListType('following');
                           fetchFollowing();
                           setShowFollowersList(true);
                         }}
                       >
                         <div className="flex items-center space-x-1">
                           <UserPlus className="h-4 w-4" />
                           <span>{followStats.following_count} Following</span>
                         </div>
                       </Button>

                       {/* XP Balance Display */}
                       {isOwnProfile && (
                         <div className="flex items-center space-x-1">
                           <Star className="h-4 w-4 text-yellow-500" />
                           <span>{xpBalance} XP</span>
                         </div>
                       )}
                     </div>
                     
                     {/* Spotify Connected Badge */}
                     {profile.spotify_connected && (
                       <div className="flex items-center space-x-1 mt-2">
                         <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                           <Music className="h-3 w-3 mr-1" />
                           Spotify Connected
                         </Badge>
                       </div>
                     )}

                     {/* User Level Badge */}
                     <div className="flex items-center space-x-1 mt-2">
                       <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                         <Trophy className="h-3 w-3 mr-1" />
                         Bronze Level
                       </Badge>
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex items-center space-x-2 mt-4">
                       {!isOwnProfile && user && (
                         <>
                           <Button
                             onClick={handleFollow}
                             disabled={followLoading}
                             variant={following ? "outline" : "default"}
                           >
                             {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
                           </Button>
                           <MessageCreator 
                             recipientId={profile.user_id} 
                             recipientName={profile.display_name || profile.username || 'User'}
                           />
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               // Handle adding to supporters
                               setConfirmAddSupporter({ show: true, profile });
                             }}
                           >
                             <Heart className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               // Handle adding to haters
                               setConfirmAddHater({ show: true, profile });
                             }}
                           >
                             <UserX className="h-4 w-4" />
                           </Button>
                         </>
                       )}
                       {isOwnProfile && (
                         <>
                           <Button onClick={() => navigate('/profile/edit')} variant="outline">
                             <Settings className="h-4 w-4 mr-2" />
                             Edit Profile
                           </Button>
                           {profileOwnerRole === 'fan' && (
                             <Button onClick={() => navigate('/fan-dashboard')} variant="outline">
                               <BarChart3 className="h-4 w-4 mr-2" />
                               Fan Dashboard
                             </Button>
                           )}
                           {profileOwnerRole === 'creator' && (
                             <Button onClick={() => navigate('/creator-dashboard')} variant="outline">
                               <Users className="h-4 w-4 mr-2" />
                               Creator Dashboard
                             </Button>
                           )}
                         </>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
               <Tabs defaultValue="posts" className="w-full mt-6">
                 <TabsList className="w-full flex justify-center">
                   <TabsTrigger value="posts">Posts</TabsTrigger>
                   <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                   <TabsTrigger value="social">Social</TabsTrigger>
                   {isOwnProfile && <TabsTrigger value="xp">Buy XP</TabsTrigger>}
                   {isOwnProfile && <TabsTrigger value="supporters">Supporters</TabsTrigger>}
                   {isOwnProfile && <TabsTrigger value="smartlink">Smart Link</TabsTrigger>}
                   {isOwnProfile && <TabsTrigger value="settings">Settings</TabsTrigger>}
                 </TabsList>
                  <TabsContent value="posts" className="mt-4">
                    <PostsGrid userId={profile.user_id} isOwnProfile={isOwnProfile} />
                  </TabsContent>
                  <TabsContent value="campaigns" className="mt-4">
                    <UserCampaignDisplay campaigns={joinedCampaigns} userId={profile.user_id} isOwnProfile={isOwnProfile} />
                  </TabsContent>
                  <TabsContent value="social" className="mt-4">
                    <EnhancedSocialInteractions targetUserId={profile.user_id} />
                  </TabsContent>
                  {isOwnProfile && (
                    <TabsContent value="xp" className="mt-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">Purchase XP</h3>
                          <p className="text-muted-foreground mb-4">
                            Buy XP to support creators and unlock exclusive content.
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <Card className="p-4 text-center">
                            <h4 className="font-medium">100 XP</h4>
                            <p className="text-2xl font-bold mt-2">$1.00</p>
                            <Button className="w-full mt-4" onClick={() => navigate('/purchase-xp?amount=100')}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Buy Now
                            </Button>
                          </Card>
                          <Card className="p-4 text-center">
                            <h4 className="font-medium">500 XP</h4>
                            <p className="text-2xl font-bold mt-2">$5.00</p>
                            <Button className="w-full mt-4" onClick={() => navigate('/purchase-xp?amount=500')}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Buy Now
                            </Button>
                          </Card>
                          <Card className="p-4 text-center">
                            <h4 className="font-medium">1000 XP</h4>
                            <p className="text-2xl font-bold mt-2">$10.00</p>
                            <Button className="w-full mt-4" onClick={() => navigate('/purchase-xp?amount=1000')}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Buy Now
                            </Button>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                  {isOwnProfile && (
                    <TabsContent value="supporters" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Your Supporters & Haters</h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card className="p-4">
                            <h4 className="font-medium text-green-600 mb-4 flex items-center">
                              <Heart className="h-4 w-4 mr-2" />
                              Supporters ({supporters.length})
                            </h4>
                            <div className="space-y-2">
                              {supporters.length > 0 ? (
                                supporters.map((supporter) => (
                                  <div key={supporter.user_id} className="flex items-center space-x-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={supporter.avatar_url} />
                                      <AvatarFallback>{supporter.display_name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{supporter.display_name || supporter.username}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground text-sm">No supporters yet</p>
                              )}
                            </div>
                          </Card>
                          <Card className="p-4">
                            <h4 className="font-medium text-red-600 mb-4 flex items-center">
                              <UserX className="h-4 w-4 mr-2" />
                              Haters ({haters.length})
                            </h4>
                            <div className="space-y-2">
                              {haters.length > 0 ? (
                                haters.map((hater) => (
                                  <div key={hater.user_id} className="flex items-center space-x-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={hater.avatar_url} />
                                      <AvatarFallback>{hater.display_name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{hater.display_name || hater.username}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground text-sm">No haters yet</p>
                              )}
                            </div>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                  {isOwnProfile && (
                    <TabsContent value="smartlink" className="mt-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">Your Smart Link</h3>
                          <p className="text-muted-foreground mb-4">
                            Share your personalized smart link to connect with fans and grow your audience.
                          </p>
                        </div>
                        <SmartLinkButton 
                          userId={profile.user_id} 
                          displayName={profile.display_name || profile.username || 'User'}
                          isOwnProfile={isOwnProfile}
                        />
                        <SmartLinkManager />
                      </div>
                    </TabsContent>
                  )}
                 {isOwnProfile && (
                   <TabsContent value="settings" className="mt-4">
                     <div className="space-y-4">
                       <h3 className="text-lg font-medium">Profile Settings</h3>
                       <Button onClick={() => navigate('/profile/edit')} variant="outline">
                         <Settings className="h-4 w-4 mr-2" />
                         Edit Profile
                       </Button>
                       <Button onClick={() => signOut()} variant="destructive">
                         Sign Out
                       </Button>
                     </div>
                   </TabsContent>
                 )}
               </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          Profile not found.
        </div>
      )}

      {/* Confirmation Dialogs */}
      <Dialog open={confirmAddSupporter.show} onOpenChange={(open) => setConfirmAddSupporter({ show: open, profile: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Supporters</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to add {confirmAddSupporter.profile?.display_name || confirmAddSupporter.profile?.username} to your supporters list?</p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmAddSupporter({ show: false, profile: null })}>
              Cancel
            </Button>
            <Button onClick={() => handleAddSupporter(confirmAddSupporter.profile)}>
              Add Supporter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAddHater.show} onOpenChange={(open) => setConfirmAddHater({ show: open, profile: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Haters</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to add {confirmAddHater.profile?.display_name || confirmAddHater.profile?.username} to your haters list?</p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmAddHater({ show: false, profile: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleAddHater(confirmAddHater.profile)}>
              Add Hater
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UniversalProfile;
