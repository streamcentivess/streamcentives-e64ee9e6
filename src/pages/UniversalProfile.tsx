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
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_xp_balances')
        .select('current_xp')
        .eq('user_id', user.id)
        .single();

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

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq(finalUserId ? 'user_id' : 'username', finalUserId || finalUsername)
        .single();

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
        } else {
          setProfileOwnerRole('fan'); // Default to fan
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
                {/* Conditional rendering based on user role */}
                {currentUserRole === 'sponsor' && (
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
                <Avatar className="w-24 h-24 md:w-32 md:h-32 relative">
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username || 'Avatar'} />
                  <AvatarFallback>{profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
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
                      {/* Follow Stats */}
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{followStats.followers_count} Followers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <UserPlus className="h-4 w-4" />
                        <span>{followStats.following_count} Following</span>
                      </div>
                      {/* XP Balance Display */}
                      {isOwnProfile && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{xpBalance} XP</span>
                        </div>
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
                  <TabsContent value="settings" className="mt-4">
                    {/* Settings content here */}
                    <Button onClick={() => signOut()} variant="destructive">Sign Out</Button>
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
    </div>
  );
};

export default UniversalProfile;
