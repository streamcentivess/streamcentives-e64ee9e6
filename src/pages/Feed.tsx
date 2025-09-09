import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/AppNavigation';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play,
  Target,
  Calendar,
  Trophy,
  DollarSign,
  Users
} from 'lucide-react';

interface Post {
  id: string;
  content_url: string;
  content_type: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes: number;
  comments: number;
  campaign?: {
    id: string;
    title: string;
    description: string | null;
    xp_reward: number;
    cash_reward: number | null;
    end_date: string | null;
    type: string;
    status: string;
    participant_count: number;
    is_joined: boolean;
  };
}

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles for all post authors
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Get likes and comments count for each post
      const postsWithCounts = await Promise.all(
        postsData.map(async (post) => {
          const [likesResult, commentsResult] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            supabase
              .from('post_comments')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id)
          ]);

          return {
            ...post,
            profiles: profilesMap.get(post.user_id) || null,
            likes: likesResult.count || 0,
            comments: commentsResult.count || 0
          };
        })
      );

      // Check for campaign associations through hashtags or user participation
      const postsWithCampaigns = await Promise.all(
        postsWithCounts.map(async (post) => {
          // Check if the post creator has active campaigns
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select(`
              id,
              title,
              description,
              xp_reward,
              cash_reward,
              end_date,
              type,
              status
            `)
            .eq('creator_id', post.user_id)
            .eq('status', 'active')
            .limit(1);

          if (campaigns && campaigns.length > 0) {
            const campaign = campaigns[0];
            
            // Get participant count
            const { count: participantCount } = await supabase
              .from('campaign_participants')
              .select('id', { count: 'exact' })
              .eq('campaign_id', campaign.id);

            // Check if current user has joined
            const { data: userParticipation } = await supabase
              .from('campaign_participants')
              .select('id')
              .eq('campaign_id', campaign.id)
              .eq('user_id', user?.id)
              .single();

            return {
              ...post,
              campaign: {
                ...campaign,
                participant_count: participantCount || 0,
                is_joined: !!userParticipation
              }
            };
          }

          return post;
        })
      );

      setPosts(postsWithCampaigns);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load feed posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCampaign = async (campaignId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaignId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Joined",
            description: "You're already participating in this campaign",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Campaign Joined!",
        description: "You've successfully joined the campaign"
      });

      // Refresh posts to update join status
      fetchPosts();
    } catch (error) {
      console.error('Error joining campaign:', error);
      toast({
        title: "Error",
        description: "Failed to join campaign",
        variant: "destructive"
      });
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/fan-campaigns?highlight=${campaignId}`);
  };

  const formatTimeRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Ended';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading feed...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Community Feed
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover content from creators and fans in your community
          </p>
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share content in your community
                </p>
                <Button onClick={() => navigate('/universal-profile')}>
                  Create First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      className="h-10 w-10 cursor-pointer" 
                      onClick={() => navigate(`/universal-profile?user=${post.user_id}`)}
                    >
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p 
                        className="font-semibold cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/universal-profile?user=${post.user_id}`)}
                      >
                        {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Post Content */}
                  <div className="relative">
                    {post.content_type.startsWith('video/') ? (
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video 
                          controls 
                          className="w-full max-h-96 object-contain"
                          poster={post.content_url}
                        >
                          <source src={post.content_url} type={post.content_type} />
                        </video>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Play className="h-12 w-12 text-white/80" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={post.content_url} 
                        alt="Post content"
                        className="w-full max-h-96 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-sm">{post.caption}</p>
                  )}

                  {/* Campaign Info */}
                  {post.campaign && (
                    <>
                      <Separator />
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-primary" />
                              <Badge variant="secondary">{post.campaign.type}</Badge>
                            </div>
                            <h4 className="font-semibold text-sm mb-1">{post.campaign.title}</h4>
                            {post.campaign.description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {post.campaign.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {post.campaign.xp_reward} XP
                              </div>
                              {post.campaign.cash_reward && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${post.campaign.cash_reward}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {post.campaign.participant_count} joined
                              </div>
                              {post.campaign.end_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatTimeRemaining(post.campaign.end_date)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {post.campaign.is_joined ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCampaign(post.campaign!.id)}
                              className="flex-1"
                            >
                              View Campaign
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleJoinCampaign(post.campaign!.id)}
                                className="flex-1"
                              >
                                Join Campaign
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewCampaign(post.campaign!.id)}
                              >
                                Details
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Feed;