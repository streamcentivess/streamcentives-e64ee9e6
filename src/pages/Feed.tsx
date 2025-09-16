import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/AppNavigation';
import CommunityUpload from '@/components/CommunityUpload';
import UserProfileSearch from '@/components/UserProfileSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play,
  Target,
  Calendar,
  Trophy,
  DollarSign,
  Users,
  Repeat2,
  Sparkles,
  UserPlus
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
  is_liked?: boolean;
  is_reposted?: boolean;
  repost_count?: number;
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

interface Repost {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  posts: Post;
  profiles: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Repost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('community');
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreReposts, setHasMoreReposts] = useState(true);
  const [page, setPage] = useState(0);
  const [repostPage, setRepostPage] = useState(0);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [sharePostData, setSharePostData] = useState<{ post: Post; shareText: string; shareUrl: string } | null>(null);
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const POSTS_PER_PAGE = 5;

  useEffect(() => {
    if (user) {
      fetchPosts(0, true);
    }
  }, [user]);

  const fetchPosts = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPosts([]);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      // Fetch posts with pagination - only community posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_community_post', true)
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      if (postsError) throw postsError;

      // Check if we have more posts
      const hasMore = postsData.length === POSTS_PER_PAGE;
      setHasMorePosts(hasMore);
      
      if (postsData.length === 0 && pageNum === 0) {
        setPosts([]);
        return;
      }

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

      // Get likes, comments, reposts count and user interaction status for each post
      const postsWithCounts = await Promise.all(
        postsData.map(async (post) => {
          const [likesResult, commentsResult, repostsResult, userLikeResult, userRepostResult] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            supabase
              .from('post_comments')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            supabase
              .from('reposts')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            user ? supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single() : Promise.resolve({ data: null }),
            user ? supabase
              .from('reposts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single() : Promise.resolve({ data: null })
          ]);

          return {
            ...post,
            profiles: profilesMap.get(post.user_id) || null,
            likes: likesResult.count || 0,
            comments: commentsResult.count || 0,
            repost_count: repostsResult.count || 0,
            is_liked: !!userLikeResult.data,
            is_reposted: !!userRepostResult.data
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

      // Update posts state
      if (reset) {
        setPosts(postsWithCampaigns);
        setPage(0);
      } else {
        setPosts(prev => [...prev, ...postsWithCampaigns]);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load feed posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId ? {
          ...p,
          is_liked: !p.is_liked,
          likes: p.is_liked ? p.likes - 1 : p.likes + 1
        } : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive"
      });
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) return;

    if (showCommentInput === postId) {
      // Hide comment input if already showing for this post
      setShowCommentInput(null);
      setNewComment('');
    } else {
      // Show comment input for this post
      setShowCommentInput(postId);
      setNewComment('');
    }
  };

  const submitComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      // Update comment count in UI
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      );

      setNewComment('');
      setShowCommentInput(null);

      toast({
        title: "Success",
        description: "Comment added successfully"
      });

    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `Check out this post by ${post.profiles?.display_name || post.profiles?.username || 'a creator'}!`;
    
    // Create sharing options
    const shareOptions = [
      {
        name: 'StreamCentives DM',
        url: '',
        icon: '💌',
        internal: true
      },
      {
        name: 'Twitter',
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        icon: '🐦'
      },
      {
        name: 'Facebook',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        icon: '📘'
      },
      {
        name: 'WhatsApp',
        url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        icon: '💬'
      },
      {
        name: 'Telegram',
        url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        icon: '✈️'
      },
      {
        name: 'LinkedIn',
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        icon: '💼'
      }
    ];

    // Try native sharing first on mobile
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // Fall through to custom options
      }
    }

    // Show custom sharing options
    const choice = await new Promise<string | null>((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
      modal.onclick = (e) => {
        if (e.target === modal) resolve(null);
      };

      modal.innerHTML = `
        <div class="bg-background rounded-xl p-6 max-w-sm w-full border shadow-xl">
          <h3 class="font-bold text-lg mb-4 text-center">Share Post</h3>
          <div class="space-y-2">
            ${shareOptions.map(option => `
              <button 
                data-option="${option.name}" 
                class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border"
              >
                <span class="text-xl">${option.icon}</span>
                <span class="font-medium">Share on ${option.name}</span>
              </button>
            `).join('')}
            <button 
              data-option="copy" 
              class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border"
            >
              <span class="text-xl">📋</span>
              <span class="font-medium">Copy Link</span>
            </button>
          </div>
          <button 
            data-option="cancel" 
            class="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      `;

      document.body.appendChild(modal);
      
      modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const option = target.closest('[data-option]')?.getAttribute('data-option');
        if (option) {
          document.body.removeChild(modal);
          resolve(option);
        }
      });
    });

    if (!choice || choice === 'cancel') return;

    if (choice === 'StreamCentives DM') {
      // Show user search modal
      setSharePostData({ post, shareText, shareUrl });
      setShowUserSearch(true);
      return;
    }

    if (choice === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Share link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Unable to Copy",
          description: "Please copy the link manually",
          variant: "destructive"
        });
      }
    } else {
      const selectedOption = shareOptions.find(opt => opt.name === choice);
      if (selectedOption) {
        window.open(selectedOption.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleUserSelect = async (selectedUser: any) => {
    if (!sharePostData || !user) return;
    
    try {
      // Check mutual follow relationship
      const [userFollowsRecipient, recipientFollowsUser] = await Promise.all([
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', selectedUser.user_id)
          .single(),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', selectedUser.user_id)
          .eq('following_id', user.id)
          .single()
      ]);

      // Determine XP cost - free if either follows the other
      const isFollowing = !!userFollowsRecipient.data || !!recipientFollowsUser.data;
      const xpCost = isFollowing ? 0 : 100;

      const messageContent = `${sharePostData.shareText}\n\n${sharePostData.shareUrl}`;

      // Send message directly using the database function
      const { data: messageId, error } = await supabase.rpc('send_message_with_xp', {
        recipient_id_param: selectedUser.user_id,
        content_param: messageContent,
        xp_cost_param: xpCost
      });

      if (error) {
        throw error;
      }

      setShowUserSearch(false);
      setSharePostData(null);

      // Show success message
      toast({
        title: isFollowing ? "Message Sent! 💌" : "Message Sent for 100 XP! 💌",
        description: isFollowing 
          ? `Sent to ${selectedUser.display_name || selectedUser.username} for free (mutual follow)`
          : `Sent to ${selectedUser.display_name || selectedUser.username} for 100 XP`,
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle specific error cases
      let errorMessage = "Failed to send message";
      if (error.message?.includes('Insufficient XP')) {
        errorMessage = "Insufficient XP balance. You need 100 XP to send this message.";
      } else if (error.message?.includes('pending message')) {
        errorMessage = "You already have a pending message with this creator. Please wait for them to respond.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleRepost = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_reposted) {
        // Remove repost
        await supabase
          .from('reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        toast({
          title: "Removed from Fan Love",
          description: "Post removed from your Fan Love collection",
        });
      } else {
        // Add repost
        await supabase
          .from('reposts')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        toast({
          title: "Added to Fan Love! ✨",
          description: "Post saved to your Fan Love collection",
        });
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId ? {
          ...p,
          is_reposted: !p.is_reposted,
          repost_count: p.is_reposted ? (p.repost_count || 0) - 1 : (p.repost_count || 0) + 1
        } : p
      ));
      
      // Always refresh reposts data so it appears in Fan Love
      fetchReposts(0, true);
    } catch (error) {
      console.error('Error reposting:', error);
      toast({
        title: "Error",
        description: "Failed to repost",
        variant: "destructive"
      });
    }
  };

  const fetchReposts = async (pageNum: number = 0, reset: boolean = false) => {
    if (!user) return;

    try {
      if (reset) {
        setLoadingMore(false);
        setReposts([]);
        setRepostPage(0);
      } else {
        setLoadingMore(true);
      }

      // First get reposts with pagination
      const { data: repostsData, error: repostsError } = await supabase
        .from('reposts')
        .select('id, user_id, post_id, created_at')
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      if (repostsError) throw repostsError;

      // Check if we have more reposts
      const hasMore = repostsData.length === POSTS_PER_PAGE;
      setHasMoreReposts(hasMore);

      if (!repostsData || repostsData.length === 0) {
        if (reset) setReposts([]);
        setLoadingMore(false);
        return;
      }

      // Get posts for these reposts
      const postIds = repostsData.map(r => r.post_id);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, content_url, content_type, caption, created_at, user_id')
        .in('id', postIds);

      if (postsError) throw postsError;

      // Get profiles for reposters and original post authors
      const reposterIds = repostsData.map(r => r.user_id);
      const originalAuthorIds = postsData?.map(p => p.user_id) || [];
      const allUserIds = [...new Set([...reposterIds, ...originalAuthorIds])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', allUserIds);

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Create posts map
      const postsMap = new Map();
      postsData?.forEach(post => {
        postsMap.set(post.id, post);
      });

      // Get likes and comments for reposted posts
      const repostsWithData = await Promise.all(
        repostsData.map(async (repost) => {
          const post = postsMap.get(repost.post_id);
          if (!post) return null;

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
            ...repost,
            profiles: profilesMap.get(repost.user_id) || null,
            posts: {
              ...post,
              profiles: profilesMap.get(post.user_id) || null,
              likes: likesResult.count || 0,
              comments: commentsResult.count || 0
            }
          };
        })
      );

      // Update reposts state
      if (reset) {
        setReposts(repostsWithData.filter(Boolean) as Repost[]);
        setRepostPage(0);
      } else {
        setReposts(prev => [...prev, ...(repostsWithData.filter(Boolean) as Repost[])]);
        setRepostPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching reposts:', error);
      toast({
        title: "Error",
        description: "Failed to load Fan Love content",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Reset and fetch initial data when tab changes
      if (activeTab === 'community') {
        setPosts([]);
        setPage(0);
        setHasMorePosts(true);
        fetchPosts(0, true);
      } else {
        setReposts([]);
        setRepostPage(0);
        setHasMoreReposts(true);
        fetchReposts(0, true);
      }
    }
  }, [user, activeTab]);

  // Infinite scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMorePosts && !hasMoreReposts) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 1000) { // Load more when 1000px from bottom
        if (activeTab === 'community' && hasMorePosts) {
          fetchPosts(page + 1, false);
        } else if (activeTab === 'fanlove' && hasMoreReposts) {
          fetchReposts(repostPage + 1, false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMorePosts, hasMoreReposts, activeTab, page, repostPage]);

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
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            Community Vibes
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover amazing content and spread the love ✨
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Community Feed
            </TabsTrigger>
            <TabsTrigger value="fanlove" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Fan Love
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="space-y-6">
            {/* Compact Upload Button - Always show at top */}
            <div className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-dashed border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all duration-300"
                  >
                    <UserPlus className="h-5 w-5 text-primary" />
                    <span className="font-medium text-primary">Upload to Feed</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Share with Community
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <CommunityUpload onUploadComplete={() => {
                      fetchPosts(0, true);
                      // Close the dialog after successful upload
                      const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
                      closeButton?.click();
                    }} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {posts.length === 0 ? (
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-dashed border-primary/20">
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
                  <h3 className="font-bold text-xl mb-2 bg-gradient-primary bg-clip-text text-transparent">No posts yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to share something amazing! 🚀
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="h-12 w-12 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all" 
                        onClick={() => navigate(`/universal-profile?user=${post.user_id}`)}
                      >
                        <AvatarImage src={post.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-white font-bold">
                          {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p 
                            className="font-bold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/universal-profile?user=${post.user_id}`)}
                          >
                            {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                          </p>
                          <UserPlus className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Post Content */}
                    <div className="relative rounded-xl overflow-hidden">
                      {post.content_type.startsWith('video/') ? (
                        <div className="relative bg-black rounded-xl overflow-hidden">
                          <video 
                            controls 
                            className="w-full max-h-96 object-contain"
                            preload="metadata"
                            playsInline
                          >
                            <source src={post.content_url} type={post.content_type} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <img 
                          src={post.content_url} 
                          alt="Post content"
                          className="w-full max-h-96 object-cover rounded-xl shadow-lg"
                        />
                      )}
                    </div>

                    {/* Caption */}
                    {post.caption && (
                      <p className="text-sm leading-relaxed">{post.caption}</p>
                    )}

                    {/* Campaign Info */}
                    {post.campaign && (
                      <>
                        <Separator />
                        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-xl p-4 space-y-3 border border-primary/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-5 w-5 text-primary" />
                                <Badge variant="secondary" className="bg-primary/20 text-primary font-semibold">
                                  {post.campaign.type}
                                </Badge>
                              </div>
                              <h4 className="font-bold text-lg mb-1">{post.campaign.title}</h4>
                              {post.campaign.description && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {post.campaign.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 font-semibold">
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                  {post.campaign.xp_reward} XP
                                </div>
                                {post.campaign.cash_reward && (
                                  <div className="flex items-center gap-1 font-semibold">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    ${post.campaign.cash_reward}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {post.campaign.participant_count} joined
                                </div>
                                {post.campaign.end_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
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
                                className="flex-1 border-primary/20 hover:bg-primary/10"
                              >
                                View Campaign
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleJoinCampaign(post.campaign!.id)}
                                  className="flex-1 bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-md"
                                >
                                  Join Campaign
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewCampaign(post.campaign!.id)}
                                  className="border-primary/20 hover:bg-primary/10"
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
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center gap-2 hover:bg-red-50 hover:text-red-500 transition-all rounded-full ${
                            post.is_liked ? 'text-red-500 bg-red-50' : ''
                          }`}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
                          {post.likes}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center gap-2 hover:bg-blue-50 hover:text-blue-500 transition-all rounded-full ${
                            showCommentInput === post.id ? 'text-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => handleComment(post.id)}
                        >
                          <MessageCircle className="h-5 w-5" />
                          {post.comments}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center gap-2 hover:bg-purple-50 hover:text-purple-500 transition-all rounded-full ${
                            post.is_reposted ? 'text-purple-500 bg-purple-50' : ''
                          }`}
                          onClick={() => handleRepost(post.id)}
                          title="Add to Fan Love"
                        >
                          <Repeat2 className={`h-5 w-5 ${post.is_reposted ? 'fill-current' : ''}`} />
                          {post.repost_count || 0}
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-primary/10 hover:text-primary transition-all rounded-full"
                        onClick={() => handleShare(post)}
                        title="Share post"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Comment Input */}
                    {showCommentInput === post.id && (
                      <div className="pt-3 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submitComment(post.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => submitComment(post.id)}
                            disabled={!newComment.trim()}
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))
            )}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading more amazing content...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fanlove" className="space-y-6">
            {reposts.length === 0 ? (
              <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-dashed border-pink-200 dark:from-pink-950/20 dark:to-purple-950/20">
                <CardContent className="text-center py-12">
                  <Heart className="h-16 w-16 text-pink-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="font-bold text-xl mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    No Fan Love Yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start spreading the love by reposting content you enjoy! 💖
                  </p>
                  <Button 
                    onClick={() => setActiveTab('community')} 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Explore Community
                  </Button>
                </CardContent>
              </Card>
            ) : (
              reposts.map((repost) => (
                <Card key={repost.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8 ring-1 ring-pink-200">
                        <AvatarImage src={repost.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs">
                          {repost.profiles?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Repeat2 className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{repost.profiles?.display_name}</span>
                        <span>shared with love</span>
                        <span>•</span>
                        <span>{new Date(repost.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarImage src={repost.posts.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {repost.posts.profiles?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {repost.posts.profiles?.display_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Original • {new Date(repost.posts.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden">
                      {repost.posts.content_type.startsWith('video/') ? (
                        <video 
                          controls 
                          className="w-full max-h-96 object-contain rounded-xl"
                          preload="metadata"
                          playsInline
                        >
                          <source src={repost.posts.content_url} type={repost.posts.content_type} />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img 
                          src={repost.posts.content_url} 
                          alt="Reposted content"
                          className="w-full max-h-96 object-cover rounded-xl"
                        />
                      )}
                    </div>

                    {repost.posts.caption && (
                      <p className="text-sm leading-relaxed">{repost.posts.caption}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {repost.posts.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {repost.posts.comments}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            
            {/* Loading more indicator for reposts */}
            {loadingMore && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading more fan love...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* User Search Modal */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              💌 Send to StreamCentives DM
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <UserProfileSearch 
              onProfileSelect={handleUserSelect}
              className="max-h-[60vh] overflow-y-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;