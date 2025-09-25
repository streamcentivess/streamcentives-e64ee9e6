import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { FeedPopupSystem } from '@/components/FeedPopupSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileContainer, MobileHeader, MobileCard } from '@/components/ui/mobile-container';
import { FeedFilters, FeedFilterState } from '@/components/FeedFilters';
import { CreatorTypeBadge } from '@/components/CreatorTypeBadge';
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
  UserPlus,
  Camera,
  TrendingUp,
  Star,
  Flame,
  Music
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
    creator_type?: string | null;
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
  const isMobile = useIsMobile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Repost[]>([]);
  const [trendingCreators, setTrendingCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('community');
  const [activeView, setActiveView] = useState<'trending' | 'community' | 'fanlove'>('community');
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreReposts, setHasMoreReposts] = useState(true);
  const [page, setPage] = useState(0);
  const [repostPage, setRepostPage] = useState(0);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [sharePostData, setSharePostData] = useState<{ post: Post; shareText: string; shareUrl: string } | null>(null);
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [feedFilters, setFeedFilters] = useState<FeedFilterState>({
    contentType: 'all',
    creatorTypes: [],
    sponsorTypes: []
  });
  const POSTS_PER_PAGE = 5;

  useEffect(() => {
    if (user) {
      if (activeView === 'trending') {
        fetchTrendingCreators();
      } else if (activeView === 'community') {
        fetchPosts(0, true);
      } else if (activeView === 'fanlove') {
        fetchReposts(0, true);
      }
    }
  }, [user, activeView, feedFilters]);

  const fetchTrendingCreators = async () => {
    try {
      setLoading(true);
      
      // Get creators with high engagement based on recent activity
      const { data: analyticsData, error } = await supabase
        .from('creator_analytics')
        .select(`
          creator_id,
          engagement_rate,
          total_fans,
          new_fans,
          total_xp_awarded,
          profiles!creator_analytics_creator_id_fkey (
            display_name,
            username,
            avatar_url,
            bio
          )
        `)
        .order('engagement_rate', { ascending: false })
        .order('total_fans', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setTrendingCreators(analyticsData || []);
    } catch (error) {
      console.error('Error fetching trending creators:', error);
      toast({
        title: "Error",
        description: "Failed to load trending creators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationClick = (view: 'trending' | 'community' | 'fanlove') => {
    setActiveView(view);
    setPage(0);
    setRepostPage(0);
    setHasMorePosts(true);
    setHasMoreReposts(true);
  };

  const fetchPosts = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPosts([]);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      // Build query for posts with filtering
      let query = supabase
        .from('posts')
        .select('*')
        .eq('is_community_post', true);

      // Apply content type filter by getting user IDs first
      let userIds: string[] = [];
      if (feedFilters.contentType === 'creators') {
        // Get posts from users who have a creator_type set
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .not('creator_type', 'is', null);
        
        if (creatorProfiles && creatorProfiles.length > 0) {
          userIds = creatorProfiles.map(p => p.user_id);
          query = query.in('user_id', userIds);
        } else {
          // No creators found, return empty
          setPosts([]);
          return;
        }
      } else if (feedFilters.contentType === 'fans') {
        // Get posts from users who don't have a creator_type set (fans)
        const { data: fanProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .is('creator_type', null);
        
        if (fanProfiles && fanProfiles.length > 0) {
          userIds = fanProfiles.map(p => p.user_id);
          query = query.in('user_id', userIds);
        } else {
          // No fans found, return empty
          setPosts([]);
          return;
        }
      } else if (feedFilters.contentType === 'sponsors') {
        // Get posts from users who have a sponsor profile
        const { data: sponsorProfiles } = await supabase
          .from('sponsor_profiles')
          .select('user_id');
        
        if (sponsorProfiles && sponsorProfiles.length > 0) {
          userIds = sponsorProfiles.map(p => p.user_id);
          query = query.in('user_id', userIds);
        } else {
          // No sponsors found, return empty
          setPosts([]);
          return;
        }
      }

      // Apply creator type filter if selected
      if (feedFilters.creatorTypes.length > 0 && (feedFilters.contentType === 'all' || feedFilters.contentType === 'creators')) {
        const { data: filteredCreatorProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .in('creator_type', feedFilters.creatorTypes as any);
        
        if (filteredCreatorProfiles && filteredCreatorProfiles.length > 0) {
          const creatorUserIds = filteredCreatorProfiles.map(p => p.user_id);
          if (userIds.length > 0) {
            // Intersect with existing userIds
            userIds = userIds.filter(id => creatorUserIds.includes(id));
          } else {
            userIds = creatorUserIds;
          }
          query = query.in('user_id', userIds);
        } else {
          setPosts([]);
          return;
        }
      }

      // Apply sponsor type filter if selected
      if (feedFilters.sponsorTypes.length > 0 && (feedFilters.contentType === 'all' || feedFilters.contentType === 'sponsors')) {
        const { data: filteredSponsorProfiles } = await supabase
          .from('sponsor_profiles')
          .select('user_id')
          .in('industry', feedFilters.sponsorTypes);
        
        if (filteredSponsorProfiles && filteredSponsorProfiles.length > 0) {
          const sponsorUserIds = filteredSponsorProfiles.map(p => p.user_id);
          if (userIds.length > 0) {
            // Intersect with existing userIds
            userIds = userIds.filter(id => sponsorUserIds.includes(id));
          } else {
            userIds = sponsorUserIds;
          }
          query = query.in('user_id', userIds);
        } else {
          setPosts([]);
          return;
        }
      }

      const { data: postsData, error: postsError } = await query
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
      const postUserIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, creator_type')
        .in('user_id', postUserIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Filter posts by creator type if specified
      let filteredPostsData = postsData;
      if (feedFilters.creatorTypes.length > 0) {
        filteredPostsData = postsData.filter(post => {
          const profile = profilesMap.get(post.user_id);
          return profile && profile.creator_type && feedFilters.creatorTypes.includes(profile.creator_type);
        });
      }

      // Get likes, comments, reposts count and user interaction status for each post
      const postsWithCounts = await Promise.all(
        filteredPostsData.map(async (post) => {
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

  const handleCommentSubmit = async (postId: string) => {
    if (!newComment.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      setShowCommentInput(null);
      
      // Refresh posts to show new comment count
      fetchPosts(0, true);
      
      toast({
        title: "Comment added!",
        description: "Your comment has been posted."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-surface to-background"
      >
        <AppNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-primary to-secondary bg-clip-border mx-auto"></div>
              <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-primary/20 to-secondary/20"></div>
            </div>
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg font-medium text-gradient-primary"
            >
              Loading amazing content...
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-background via-surface to-background"
    >
      <AppNavigation />
      <FeedPopupSystem />
      
      {/* Hero Section - TikTok Style */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden hero-gradient py-8 text-center"
      >
        <div className="absolute inset-0 bg-grid-subtle opacity-20"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="flex items-center justify-center gap-3"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center"
            >
              <Flame className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-4xl font-black text-gradient-primary">
              Community Vibes
            </h1>
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.5
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"
            >
              <Star className="h-6 w-6 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg font-medium text-muted-foreground"
          >
            Discover amazing content and spread the love ✨
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-4"
          >
            <motion.button 
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border-2 ${
                activeView === 'trending' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-300/50 shadow-2xl shadow-orange-500/20' 
                  : 'glass-card text-muted-foreground hover:text-foreground hover:border-orange-300/30 border-transparent hover:shadow-lg'
              }`}
              onClick={() => handleNavigationClick('trending')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
              {activeView === 'trending' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </motion.button>
            
            <motion.button 
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border-2 ${
                activeView === 'community' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-300/50 shadow-2xl shadow-blue-500/20' 
                  : 'glass-card text-muted-foreground hover:text-foreground hover:border-blue-300/30 border-transparent hover:shadow-lg'
              }`}
              onClick={() => handleNavigationClick('community')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="h-4 w-4" />
              <span>Community</span>
              {activeView === 'community' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </motion.button>
            
            <motion.button 
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border-2 ${
                activeView === 'fanlove' 
                  ? 'bg-gradient-to-r from-pink-500 to-red-600 text-white border-pink-300/50 shadow-2xl shadow-pink-500/20' 
                  : 'glass-card text-muted-foreground hover:text-foreground hover:border-pink-300/30 border-transparent hover:shadow-lg'
              }`}
              onClick={() => handleNavigationClick('fanlove')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className="h-4 w-4" />
              <span>Fan Love</span>
              {activeView === 'fanlove' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
      
      <MobileContainer>
        <div className="max-w-md mx-auto space-y-6">

        {/* Content based on activeView */}
        <AnimatePresence mode="wait">
          {activeView === 'trending' && (
            <motion.div
              key="trending"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <MobileCard className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-gradient-primary">Trending Creators</h3>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-muted-foreground">
                  Discover creators with the highest engagement and growing fan bases
                </p>
              </MobileCard>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : trendingCreators.length === 0 ? (
                <MobileCard className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No trending creators found yet</p>
                </MobileCard>
              ) : (
                <div className="space-y-4">
                  {trendingCreators.map((creator, index) => (
                    <motion.div
                      key={creator.creator_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => navigate(`/universal-profile?userId=${creator.creator_id}`)}
                      className="cursor-pointer"
                    >
                      <MobileCard className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-200/20 hover:border-orange-400/40 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
                        <div className="relative z-10 flex items-center gap-4 p-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-orange-300/30">
                              <AvatarImage 
                                src={creator.profiles?.avatar_url} 
                                alt={creator.profiles?.display_name || creator.profiles?.username || 'Creator'} 
                              />
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold">
                                {(creator.profiles?.display_name || creator.profiles?.username || 'TC').slice(0,2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">#{index + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gradient-primary">
                              {creator.profiles?.display_name || creator.profiles?.username || 'Trending Creator'}
                            </p>
                            {creator.profiles?.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {creator.profiles.bio}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-blue-500" />
                                <span className="text-muted-foreground">
                                  {creator.total_fans?.toLocaleString() || 0} fans
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-muted-foreground">
                                  {creator.engagement_rate?.toFixed(1) || 0}% engagement
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3 text-yellow-500" />
                                <span className="text-muted-foreground">
                                  {creator.total_xp_awarded?.toLocaleString() || 0} XP
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-none">
                            View
                          </Button>
                        </div>
                      </MobileCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* TikTok-Style Upload Button */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6, type: "spring" }}
                className="flex justify-center"
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative group"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-shift"></div>
                      <Button 
                        className="relative flex items-center gap-3 px-8 py-4 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-2xl border-0 hover:shadow-3xl transition-all duration-300"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Camera className="h-6 w-6" />
                        </motion.div>
                        <span>Create Magic</span>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-2 border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-6 w-6 text-primary" />
                        </motion.div>
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
              </motion.div>
              
              {/* Add Filter Component */}
              <FeedFilters 
                onFiltersChange={setFeedFilters}
                initialFilters={feedFilters}
              />

              <AnimatePresence mode="popLayout">
                {posts.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                  >
                    <MobileCard className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 border-2 border-dashed border-primary/30">
                      <div className="text-center py-12 space-y-6">
                        <motion.div
                          animate={{ 
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Users className="h-20 w-20 text-primary mx-auto" />
                        </motion.div>
                        <div>
                          <h3 className="font-black text-2xl mb-2 text-gradient-primary">No posts yet</h3>
                          <p className="text-muted-foreground text-lg">
                            Be the first to share something amazing! 🚀
                          </p>
                        </div>
                      </div>
                    </MobileCard>
                  </motion.div>
                ) : (
                  posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -50, scale: 0.95 }}
                      transition={{ 
                        duration: 0.6, 
                        type: "spring",
                        delay: index * 0.1
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="group"
                    >
                      <MobileCard className="relative overflow-hidden border-2 hover:border-primary/40 transition-all duration-500 bg-gradient-to-br from-background to-surface hover:shadow-2xl hover:shadow-primary/10">
                        {/* Animated Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <CardHeader className="relative pb-3">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Avatar 
                                className="h-14 w-14 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/60 transition-all duration-300" 
                                onClick={() => navigate(`/universal-profile?user=${post.user_id}`)}
                              >
                                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">
                                  {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                            <div className="flex-1">
                               <div className="flex items-center gap-2">
                                 <motion.p 
                                   whileHover={{ scale: 1.05 }}
                                   className="font-bold cursor-pointer hover:text-primary transition-colors text-lg"
                                   onClick={() => navigate(`/universal-profile?user=${post.user_id}`)}
                                 >
                                   {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                                 </motion.p>
                                 {post.profiles?.creator_type && (
                                   <CreatorTypeBadge 
                                     creatorType={post.profiles.creator_type} 
                                     size="sm" 
                                   />
                                 )}
                                 <motion.div
                                   whileHover={{ scale: 1.2, rotate: 180 }}
                                   whileTap={{ scale: 0.8 }}
                                 >
                                   <UserPlus className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                                 </motion.div>
                               </div>
                              <p className="text-sm text-muted-foreground font-medium">
                                {new Date(post.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="relative space-y-4">
                          {/* Post Content */}
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="relative rounded-2xl overflow-hidden shadow-2xl"
                          >
                            {post.content_type === 'video' ? (
                              <div className="relative bg-gradient-to-br from-black to-gray-900 rounded-2xl overflow-hidden">
                                <motion.video 
                                  controls 
                                  className="w-full max-h-96 object-contain"
                                  preload="metadata"
                                  playsInline
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <source src={post.content_url} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </motion.video>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                              </div>
                            ) : (
                              <div className="relative">
                                <motion.img 
                                  src={post.content_url} 
                                  alt="Post content"
                                  className="w-full max-h-96 object-cover rounded-2xl"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.3 }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-2xl"></div>
                              </div>
                            )}
                          </motion.div>

                          {/* Caption */}
                          {post.caption && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="bg-gradient-to-r from-muted/50 to-transparent rounded-xl p-4"
                            >
                              <p className="text-sm leading-relaxed font-medium">{post.caption}</p>
                            </motion.div>
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
                          <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center gap-2">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-bold transition-all duration-300 ${
                                    post.is_liked 
                                      ? 'text-red-500 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200' 
                                      : 'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-500 hover:border hover:border-red-200'
                                  }`}
                                  onClick={() => handleLike(post.id)}
                                >
                                  <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                                  <span>{post.likes}</span>
                                </Button>
                              </motion.div>

                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="flex items-center gap-2 rounded-2xl px-4 py-2 font-bold hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-500 hover:border hover:border-blue-200 transition-all duration-300"
                                  onClick={() => handleComment(post.id)}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  <span>{post.comments}</span>
                                </Button>
                              </motion.div>

                                  <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-bold transition-all duration-300 ${
                                    post.is_reposted 
                                      ? 'text-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
                                      : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-500 hover:border hover:border-purple-200'
                                  }`}
                                  onClick={() => handleRepost(post.id)}
                                >
                                  <Repeat2 className={`h-4 w-4 ${post.is_reposted ? 'fill-current' : ''}`} />
                                  <span>{post.repost_count || 0}</span>
                                </Button>
                            </div>

                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-2xl px-4 py-2 font-bold hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-500 hover:border hover:border-green-200 transition-all duration-300"
                                onClick={() => handleShare(post)}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>

                          {/* Comment Input */}
                          {showCommentInput === post.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 p-4 bg-gradient-to-r from-muted/30 to-transparent rounded-xl border border-primary/10"
                            >
                              <div className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                                  <AvatarFallback className="bg-gradient-primary text-white text-xs">
                                    {user?.user_metadata?.display_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                  <Input
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1 border-primary/20 focus:border-primary/40"
                                  />
                                  <Button size="sm" onClick={() => handleCommentSubmit(post.id)}>
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </MobileCard>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              
              {/* Loading more indicator */}
              {loadingMore && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="relative mx-auto mb-4 w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-primary to-secondary bg-clip-border animate-spin"></div>
                    <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse"></div>
                  </div>
                  <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-lg font-medium text-gradient-primary"
                  >
                    Loading more amazing content...
                  </motion.p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeView === 'fanlove' && (
            <motion.div
              key="fanlove"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <AnimatePresence mode="popLayout">
                {reposts.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                  >
                    <MobileCard className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-red-500/10 border-2 border-dashed border-pink-300/50">
                      <div className="text-center py-12 space-y-6">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Heart className="h-20 w-20 text-pink-500 mx-auto" />
                        </motion.div>
                        <div>
                          <h3 className="font-black text-2xl mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            No Fan Love Yet
                          </h3>
                          <p className="text-muted-foreground text-lg mb-6">
                            Start spreading the love by reposting content you enjoy! 💖
                          </p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              onClick={() => handleNavigationClick('community')} 
                              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <Heart className="h-5 w-5 mr-2" />
                              </motion.div>
                              Explore Community
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </MobileCard>
                  </motion.div>
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
              </AnimatePresence>
              
              {/* Loading more indicator for reposts */}
              {loadingMore && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading more fan love...</p>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </MobileContainer>

      {/* User Search Modal */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
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
    </motion.div>
  );
};

export default Feed;