import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, MapPin, Calendar, MessageCircle, UserPlus, UserMinus, Eye, TrendingUp } from 'lucide-react';
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

      // Get user's recent posts
      const { data: postData } = await supabase
        .from('posts')
        .select('id, content, created_at, media_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);
      
      setPosts(postData || []);

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
              <Tabs defaultValue="campaigns" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                </TabsList>

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

                <TabsContent value="posts" className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No posts yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {posts.map((post: any) => (
                        <Card key={post.id}>
                          <CardContent className="p-4">
                            {post.media_url && (
                              <img 
                                src={post.media_url} 
                                alt="Post media"
                                className="w-full h-32 object-cover rounded mb-3"
                              />
                            )}
                            <p className="text-sm line-clamp-3">{post.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
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
        creator={profile}
      />
    </>
  );
}