import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import CommunityUpload from '@/components/CommunityUpload';
import UserProfileSearch from '@/components/UserProfileSearch';
import { FeedPopupSystem } from '@/components/FeedPopupSystem';
import { FeedFilters, FeedFilterState } from '@/components/FeedFilters';
import { CreatorTypeBadge } from '@/components/CreatorTypeBadge';
import { VerificationBadge } from '@/components/VerificationBadge';
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
  Music, 
  Home, 
  Filter
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
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [feedFilters, setFeedFilters] = useState<FeedFilterState>({
    contentType: 'all',
    creatorTypes: [],
    sponsorTypes: []
  });
  const POSTS_PER_PAGE = 10;
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video autoplay functionality
  const setupVideoObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.8,
        rootMargin: '0px'
      }
    );

    videoRefs.current.forEach((video) => {
      if (observerRef.current) {
        observerRef.current.observe(video);
      }
    });
  }, []);

  const addVideoRef = useCallback((postId: string, video: HTMLVideoElement | null) => {
    if (video) {
      videoRefs.current.set(postId, video);
      if (observerRef.current) {
        observerRef.current.observe(video);
      }
    } else {
      const existingVideo = videoRefs.current.get(postId);
      if (existingVideo && observerRef.current) {
        observerRef.current.unobserve(existingVideo);
      }
      videoRefs.current.delete(postId);
    }
  }, []);

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

  useEffect(() => {
    if (posts.length > 0) {
      setTimeout(() => {
        setupVideoObserver();
      }, 100);
    }
  }, [posts, setupVideoObserver]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const fetchTrendingCreators = async () => {
    try {
      setLoading(true);
      
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

      let query = supabase
        .from('posts')
        .select('*')
        .eq('is_community_post', true);

      let userIds: string[] = [];
      if (feedFilters.contentType === 'creators') {
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .not('creator_type', 'is', null);
        
        if (creatorProfiles && creatorProfiles.length > 0) {
          userIds = creatorProfiles.map(p => p.user_id);
          query = query.in('user_id', userIds);
        } else {
          setPosts([]);
          return;
        }
      } else if (feedFilters.contentType === 'fans') {
        const { data: fanProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .is('creator_type', null);
        
        if (fanProfiles && fanProfiles.length > 0) {
          userIds = fanProfiles.map(p => p.user_id);
          query = query.in('user_id', userIds);
        } else {
          setPosts([]);
          return;
        }
      } else if (feedFilters.contentType === 'sponsors') {
        const { data: sponsorProfiles } = await supabase
          .from('sponsor_profiles')
          .select('user_id');
        
        if (sponsorProfiles && sponsorProfiles.length > 0) {
          userIds = sponsorProfiles.map(p => p.user_id);
          query = query.in('user_id', userIds);
        } else {
          setPosts([]);
          return;
        }
      }

      if (feedFilters.creatorTypes.length > 0 && (feedFilters.contentType === 'all' || feedFilters.contentType === 'creators')) {
        const { data: filteredCreatorProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .in('creator_type', feedFilters.creatorTypes as any);
        
        if (filteredCreatorProfiles && filteredCreatorProfiles.length > 0) {
          const creatorUserIds = filteredCreatorProfiles.map(p => p.user_id);
          if (userIds.length > 0) {
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

      if (feedFilters.sponsorTypes.length > 0 && (feedFilters.contentType === 'all' || feedFilters.contentType === 'sponsors')) {
        const { data: filteredSponsorProfiles } = await supabase
          .from('sponsor_profiles')
          .select('user_id')
          .in('industry', feedFilters.sponsorTypes);
        
        if (filteredSponsorProfiles && filteredSponsorProfiles.length > 0) {
          const sponsorUserIds = filteredSponsorProfiles.map(p => p.user_id);
          if (userIds.length > 0) {
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

      const hasMore = postsData.length === POSTS_PER_PAGE;
      setHasMorePosts(hasMore);
      
      if (postsData.length === 0 && pageNum === 0) {
        setPosts([]);
        return;
      }

      const postUserIds = [...new Set(postsData.map(post => post.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, creator_type')
        .in('user_id', postUserIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      let filteredPostsData = postsData;
      if (feedFilters.creatorTypes.length > 0) {
        filteredPostsData = postsData.filter(post => {
          const profile = profilesMap.get(post.user_id);
          return profile && profile.creator_type && feedFilters.creatorTypes.includes(profile.creator_type);
        });
      }

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

      const postsWithCampaigns = await Promise.all(
        postsWithCounts.map(async (post) => {
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
            
            const { count: participantCount } = await supabase
              .from('campaign_participants')
              .select('id', { count: 'exact' })
              .eq('campaign_id', campaign.id);

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
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }

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
      setShowCommentInput(null);
      setNewComment('');
    } else {
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

      const isFollowing = !!userFollowsRecipient.data || !!recipientFollowsUser.data;
      const xpCost = isFollowing ? 0 : 100;

      const messageContent = `${sharePostData.shareText}\n\n${sharePostData.shareUrl}`;

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

      toast({
        title: isFollowing ? "Message Sent! 💌" : "Message Sent for 100 XP! 💌",
        description: isFollowing 
          ? `Sent to ${selectedUser.display_name || selectedUser.username} for free (mutual follow)`
          : `Sent to ${selectedUser.display_name || selectedUser.username} for 100 XP`,
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      
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

      setPosts(prev => prev.map(p => 
        p.id === postId ? {
          ...p,
          is_reposted: !p.is_reposted,
          repost_count: p.is_reposted ? (p.repost_count || 0) - 1 : (p.repost_count || 0) + 1
        } : p
      ));
      
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
        setLoading(true);
        setReposts([]);
        setRepostPage(0);
      } else {
        setLoadingMore(true);
      }

      const { data: repostsData, error: repostsError } = await supabase
        .from('reposts')
        .select('id, user_id, post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      if (repostsError) throw repostsError;

      const hasMore = repostsData.length === POSTS_PER_PAGE;
      setHasMoreReposts(hasMore);

      if (!repostsData || repostsData.length === 0) {
        if (reset) setReposts([]);
        setLoadingMore(false);
        return;
      }

      const postIds = repostsData.map(r => r.post_id);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, content_url, content_type, caption, created_at, user_id')
        .in('id', postIds);

      if (postsError) throw postsError;

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

      const postsMap = new Map();
      postsData?.forEach(post => {
        postsMap.set(post.id, post);
      });

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
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (activeView === 'community') {
      setPosts([]);
      setPage(0);
      setHasMorePosts(true);
      fetchPosts(0, true);
    } else if (activeView === 'fanlove') {
      setReposts([]);
      setRepostPage(0);
      setHasMoreReposts(true);
      fetchReposts(0, true);
    }
  }, [user, activeView]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || (!hasMorePosts && !hasMoreReposts)) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 300) {
        if (activeView === 'community' && hasMorePosts) {
          fetchPosts(page + 1, false);
        } else if (activeView === 'fanlove' && hasMoreReposts) {
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
        className="min-h-screen bg-background flex items-center justify-center"
      >
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
      </motion.div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <FeedPopupSystem />
      
      {/* Top Navigation Bar - Fixed */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo/Home Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="h-5 w-5" />
            {!isMobile && <span className="font-bold">Home</span>}
          </Button>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'trending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigationClick('trending')}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {!isMobile && <span>Trending</span>}
            </Button>
            
            <Button
              variant={activeView === 'community' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigationClick('community')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              {!isMobile && <span>Community</span>}
            </Button>
            
            <Button
              variant={activeView === 'fanlove' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigationClick('fanlove')}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              {!isMobile && <span>Fan Love</span>}
            </Button>
          </div>

          {/* Upload & Filter Buttons */}
          <div className="flex items-center gap-2">
            {activeView === 'community' && (
              <Dialog open={showFilters} onOpenChange={setShowFilters}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {!isMobile && <span>Filter</span>}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter Feed</DialogTitle>
                  </DialogHeader>
                  <FeedFilters 
                    onFiltersChange={setFeedFilters}
                    initialFilters={feedFilters}
                  />
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  <Camera className="h-4 w-4" />
                  {!isMobile && <span>Create</span>}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Share with Community
                  </DialogTitle>
                </DialogHeader>
                <CommunityUpload onUploadComplete={() => {
                  fetchPosts(0, true);
                  setShowUploadModal(false);
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Full-Screen Snap-Scroll Container */}
      <div 
        ref={containerRef}
        className="snap-y snap-mandatory h-screen overflow-y-scroll scroll-smooth pt-16"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {activeView === 'community' && posts.map((post, index) => (
          <div 
            key={post.id} 
            className="snap-start snap-always h-screen relative bg-black"
          >
            {/* Video Content */}
            {post.content_type === 'video' ? (
              <video
                ref={(video) => addVideoRef(post.id, video)}
                src={post.content_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                muted
                onClick={(e) => {
                  const video = e.currentTarget;
                  if (video.paused) {
                    video.play();
                  } else {
                    video.pause();
                  }
                }}
              />
            ) : (
              <img
                src={post.content_url}
                alt={post.caption || 'Post content'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Bottom Overlay - Creator Info & Caption */}
            <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
              <div 
                className="flex items-center gap-3 mb-3 cursor-pointer"
                onClick={async () => {
                  const { data } = await supabase.from('profiles').select('username').eq('user_id', post.user_id).maybeSingle();
                  if (data?.username) navigate(`/${data.username}`);
                }}
              >
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {(post.profiles?.display_name || post.profiles?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-lg">
                      {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                    </p>
                    <VerificationBadge 
                      isVerified={true}
                      followerCount={1000}
                      size="sm"
                    />
                  </div>
                  {post.profiles?.creator_type && (
                    <CreatorTypeBadge creatorType={post.profiles.creator_type} size="sm" />
                  )}
                </div>
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="text-white text-sm mb-2 line-clamp-2">
                  {post.caption}
                </p>
              )}

              {/* Campaign Badge */}
              {post.campaign && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleViewCampaign(post.campaign!.id)}
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    {post.campaign.title}
                  </Badge>
                  {!post.campaign.is_joined && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCampaign(post.campaign!.id);
                      }}
                      className="h-6 text-xs bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      Join Campaign
                    </Button>
                  )}
                </div>
              )}

              {/* Music Attribution */}
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Music className="h-3 w-3" />
                <span>Original audio</span>
              </div>
            </div>

            {/* Right Side Actions - Vertical Stack */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
              {/* Profile Avatar Button */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative cursor-pointer"
                onClick={async () => {
                  const { data } = await supabase.from('profiles').select('username').eq('user_id', post.user_id).maybeSingle();
                  if (data?.username) navigate(`/${data.username}`);
                }}
              >
                <Avatar className="h-14 w-14 border-2 border-white">
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                    {(post.profiles?.display_name || post.profiles?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Like Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleLike(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Heart 
                    className={`h-7 w-7 ${post.is_liked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                  />
                </div>
                <span className="text-white text-xs font-semibold">{post.likes}</span>
              </motion.button>

              {/* Comment Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleComment(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">{post.comments}</span>
              </motion.button>

              {/* Repost Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRepost(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Repeat2 
                    className={`h-7 w-7 ${post.is_reposted ? 'text-green-500' : 'text-white'}`}
                  />
                </div>
                <span className="text-white text-xs font-semibold">{post.repost_count || 0}</span>
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleShare(post)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Share</span>
              </motion.button>
            </div>

            {/* Comment Input Overlay */}
            {showCommentInput === post.id && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg p-4 border-t border-border"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitComment(post.id);
                      }
                    }}
                  />
                  <Button
                    onClick={() => submitComment(post.id)}
                    disabled={!newComment.trim()}
                    size="sm"
                  >
                    Post
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        ))}

        {/* Fan Love Posts */}
        {activeView === 'fanlove' && reposts.map((repost) => (
          <div key={repost.id} className="relative snap-start h-screen flex-shrink-0 bg-black">
            {/* Video/Image Content */}
            {repost.posts?.content_type === 'video' ? (
              <video
                ref={(video) => addVideoRef(repost.posts!.id, video)}
                src={repost.posts.content_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                muted
                onClick={(e) => {
                  const video = e.currentTarget;
                  if (video.paused) {
                    video.play();
                  } else {
                    video.pause();
                  }
                }}
              />
            ) : (
              <img
                src={repost.posts?.content_url}
                alt={repost.posts?.caption || 'Reposted content'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Bottom Overlay - Creator Info & Caption */}
            <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
              {/* Reposted By Indicator */}
              <div className="flex items-center gap-2 mb-2 text-white/80 text-sm">
                <Repeat2 className="h-4 w-4 text-green-500" />
                <span>Reposted by you</span>
              </div>

              <div 
                className="flex items-center gap-3 mb-3 cursor-pointer"
                onClick={async () => {
                  const { data } = await supabase.from('profiles').select('username').eq('user_id', repost.posts?.user_id).maybeSingle();
                  if (data?.username) navigate(`/${data.username}`);
                }}
              >
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={repost.posts?.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {(repost.posts?.profiles?.display_name || repost.posts?.profiles?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-lg">
                      {repost.posts?.profiles?.display_name || repost.posts?.profiles?.username || 'Anonymous'}
                    </p>
                    <VerificationBadge 
                      isVerified={true}
                      followerCount={1000}
                      size="sm"
                    />
                  </div>
                  {repost.posts?.profiles?.creator_type && (
                    <CreatorTypeBadge creatorType={repost.posts.profiles.creator_type} size="sm" />
                  )}
                </div>
              </div>

              {/* Caption */}
              {repost.posts?.caption && (
                <p className="text-white text-sm mb-2 line-clamp-2">
                  {repost.posts.caption}
                </p>
              )}

              {/* Campaign Badge */}
              {repost.posts?.campaign && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleViewCampaign(repost.posts!.campaign!.id)}
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    {repost.posts.campaign.title}
                  </Badge>
                  {!repost.posts.campaign.is_joined && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCampaign(repost.posts!.campaign!.id);
                      }}
                      className="h-6 text-xs bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      Join Campaign
                    </Button>
                  )}
                </div>
              )}

              {/* Music Attribution */}
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Music className="h-3 w-3" />
                <span>Original audio</span>
              </div>
            </div>

            {/* Right Side Actions - Vertical Stack */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
              {/* Profile Avatar Button */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative cursor-pointer"
                onClick={async () => {
                  const { data } = await supabase.from('profiles').select('username').eq('user_id', repost.posts?.user_id).maybeSingle();
                  if (data?.username) navigate(`/${data.username}`);
                }}
              >
                <Avatar className="h-14 w-14 border-2 border-white">
                  <AvatarImage src={repost.posts?.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                    {(repost.posts?.profiles?.display_name || repost.posts?.profiles?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Like Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleLike(repost.posts!.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Heart 
                    className={`h-7 w-7 ${repost.posts?.is_liked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                  />
                </div>
                <span className="text-white text-xs font-semibold">{repost.posts?.likes || 0}</span>
              </motion.button>

              {/* Comment Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleComment(repost.posts!.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">{repost.posts?.comments || 0}</span>
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleShare(repost.posts!)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Share</span>
              </motion.button>
            </div>

            {/* Comment Input Overlay */}
            {showCommentInput === repost.posts?.id && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg p-4 border-t border-border"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitComment(repost.posts!.id);
                      }
                    }}
                  />
                  <Button
                    onClick={() => submitComment(repost.posts!.id)}
                    disabled={!newComment.trim()}
                    size="sm"
                  >
                    Post
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        ))}

        {/* Empty State - Community */}
        {activeView === 'community' && posts.length === 0 && !loading && (
          <div className="snap-start h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 p-8">
              <Users className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-2xl font-bold">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to share something amazing!</p>
              <Button onClick={() => setShowUploadModal(true)} className="gap-2">
                <Camera className="h-4 w-4" />
                Create Post
              </Button>
            </div>
          </div>
        )}

        {/* Empty State - Fan Love */}
        {activeView === 'fanlove' && reposts.length === 0 && !loading && (
          <div className="snap-start h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 p-8">
              <Repeat2 className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-2xl font-bold">No Fan Love yet</h3>
              <p className="text-muted-foreground">Repost content you love to see it here!</p>
            </div>
          </div>
        )}
      </div>

      {/* User Search Modal for Sharing */}
      <Dialog open={showUserSearch} onOpenChange={(open) => {
        setShowUserSearch(open);
        if (!open) setSharePostData(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share via DM</DialogTitle>
          </DialogHeader>
          <UserProfileSearch
            onProfileSelect={handleUserSelect}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;
