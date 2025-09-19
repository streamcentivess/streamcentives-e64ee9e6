import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, MapPin, Calendar, MessageCircle, UserPlus, UserMinus, Eye, TrendingUp, Heart, MessageSquare, Share2, Activity } from 'lucide-react';
import { SponsorOfferModal } from './SponsorOfferModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface ProfileData {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  country_name?: string;
  created_at: string;
  spotify_connected: boolean;
  merch_store_connected: boolean;
  offer_receiving_rate_cents?: number;
}

export function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [posts, setPosts] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [postStats, setPostStats] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
      trackProfileView();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Get profile data
      const { data: profileResult } = await supabase
        .rpc('get_public_profile_safe', { target_user_id: userId });
      
      if (profileResult?.[0]) {
        setProfile(profileResult[0]);
      }

      // Get follow stats
      const { data: followStats } = await supabase
        .rpc('get_user_follow_stats_safe', { target_user_id: userId });
      
      if (followStats?.[0]) {
        setFollowerCount(followStats[0].followers_count);
        setFollowingCount(followStats[0].following_count);
      }

      // Check if current user follows this profile
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();
        
        setIsFollowing(!!followData);
      }

      // Get user's active campaigns
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, title, description, xp_reward, current_progress, target_value, status')
        .eq('creator_id', userId)
        .eq('status', 'active')
        .limit(6);
      
      setCampaigns(campaignData || []);

      // Get user's recent posts with enhanced data
      const { data: postData } = await supabase
        .from('posts')
        .select('id, content, created_at, media_url, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12);
      
      setPosts(postData || []);

      // Get post engagement stats for each post
      if (postData?.length) {
        const statsPromises = postData.map(async (post: any) => {
          const { data: socialData } = await supabase
            .rpc('get_social_counts', { 
              target_content_id_param: post.id, 
              content_type_param: 'post' 
            });
          
          const stats = socialData?.reduce((acc: any, curr: any) => {
            acc[curr.interaction_type] = curr.count;
            return acc;
          }, {}) || {};
          
          return { postId: post.id, stats };
        });
        
        const allStats = await Promise.all(statsPromises);
        const statsMap = allStats.reduce((acc, { postId, stats }) => {
          acc[postId] = stats;
          return acc;
        }, {});
        
        setPostStats(statsMap);
      }

      // Get supporters (followers)
      const { data: supportersData } = await supabase
        .from('follows')
        .select(`
          created_at,
          follower:profiles!follows_follower_id_fkey(
            user_id, username, display_name, avatar_url
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setSupporters(supportersData || []);

      // Get recent activity
      const { data: activityData } = await supabase
        .from('social_interactions')
        .select(`
          id, interaction_type, created_at,
          user:profiles!social_interactions_user_id_fkey(
            user_id, username, display_name, avatar_url
          )
        `)
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);
      
      setRecentActivity(activityData || []);

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async () => {
    if (!userId || !user || user.id === userId) return;

    try {
      // Track profile view
      await supabase
        .from('fan_behavior_analytics')
        .insert({
          fan_id: user.id,
          creator_id: userId,
          behavior_type: 'profile_view',
          behavior_data: {
            timestamp: new Date().toISOString(),
            page: 'profile_modal'
          }
        });

      // Create notification for profile owner
      await supabase.rpc('create_notification', {
        user_id_param: userId,
        type_param: 'profile_view',
        title_param: 'Profile View',
        message_param: `${user.user_metadata?.display_name || 'Someone'} viewed your profile`,
        data_param: {
          viewer_id: user.id,
          viewer_name: user.user_metadata?.display_name
        },
        priority_param: 'low'
      });

    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
        
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);

        // Create notification
        await supabase.rpc('create_notification', {
          user_id_param: userId,
          type_param: 'follow',
          title_param: 'New Follower',
          message_param: `${user.user_metadata?.display_name || 'Someone'} started following you`,
          data_param: {
            follower_id: user.id,
            follower_name: user.user_metadata?.display_name
          },
          priority_param: 'normal'
        });
      }

      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: `You are now ${isFollowing ? 'no longer following' : 'following'} ${profile?.display_name || profile?.username}`
      });

    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  const handleSendOffer = () => {
    setShowOfferModal(true);
  };

  if (!profile && !loading) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">User Profile</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="w-24 h-24 mx-auto sm:mx-0">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold">
                    {profile.display_name || profile.username}
                  </h2>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  
                  {profile.bio && (
                    <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                    {profile.country_name && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {profile.country_name}
                      </Badge>
                    )}
                    {profile.spotify_connected && (
                      <Badge variant="secondary">Spotify Connected</Badge>
                    )}
                    {profile.merch_store_connected && (
                      <Badge variant="secondary">Merch Store</Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mt-4 justify-center sm:justify-start">
                    <div className="text-center">
                      <div className="font-bold">{followerCount}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{followingCount}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                   <div className="text-center">
                     <div className="font-bold">{campaigns.length}</div>
                     <div className="text-sm text-muted-foreground">Campaigns</div>
                   </div>
                   <div className="text-center">
                     <div className="font-bold">{posts.length}</div>
                     <div className="text-sm text-muted-foreground">Posts</div>
                   </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {user && user.id !== userId && (
                  <div className="flex flex-col gap-2 sm:w-auto w-full">
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className="flex items-center gap-2"
                    >
                      {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/inbox?user=${userId}`, '_self')}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                    
                    {profile.offer_receiving_rate_cents && (
                      <Button
                        onClick={handleSendOffer}
                        className="bg-gradient-primary hover:opacity-90 flex items-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Send Offer
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Content Tabs */}
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  <TabsTrigger value="supporters">Supporters</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No posts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post: any) => {
                        const stats = postStats[post.id] || {};
                        return (
                          <Card key={post.id}>
                            <CardContent className="p-4">
                              {post.media_url && (
                                <img 
                                  src={post.media_url} 
                                  alt="Post media"
                                  className="w-full h-48 object-cover rounded-lg mb-3"
                                />
                              )}
                              <p className="text-sm mb-3">{post.content}</p>
                              
                              {/* Post engagement stats */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {stats.like || 0}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {stats.comment || 0}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Share2 className="h-3 w-3" />
                                    {stats.repost || 0}
                                  </div>
                                </div>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-4">
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No active campaigns</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaigns.map((campaign: any) => (
                        <Card key={campaign.id}>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{campaign.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {campaign.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">
                                {campaign.xp_reward} XP
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {campaign.current_progress}/{campaign.target_value}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="supporters" className="space-y-4">
                  {supporters.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No supporters yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {supporters.map((supporter: any, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={supporter.follower?.avatar_url} />
                                <AvatarFallback>
                                  {supporter.follower?.display_name?.[0] || supporter.follower?.username?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {supporter.follower?.display_name || supporter.follower?.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  @{supporter.follower?.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Followed {new Date(supporter.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity: any) => (
                        <Card key={activity.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={activity.user?.avatar_url} />
                                <AvatarFallback>
                                  {activity.user?.display_name?.[0] || activity.user?.username?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">
                                    {activity.user?.display_name || activity.user?.username}
                                  </span>
                                  {activity.interaction_type === 'like' && ' liked your content'}
                                  {activity.interaction_type === 'comment' && ' commented on your post'}
                                  {activity.interaction_type === 'repost' && ' reposted your content'}
                                  {activity.interaction_type === 'follow' && ' started following you'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {activity.interaction_type === 'like' && <Heart className="h-4 w-4 text-red-500" />}
                              {activity.interaction_type === 'comment' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                              {activity.interaction_type === 'repost' && <Share2 className="h-4 w-4 text-green-500" />}
                              {activity.interaction_type === 'follow' && <UserPlus className="h-4 w-4 text-purple-500" />}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Sponsor Offer Modal */}
      <SponsorOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        creator={profile ? {
          ...profile,
          followerCount: followerCount,
          engagementRate: 0 // Default value for modal compatibility
        } : null}
      />
    </>
  );
}