import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Share, Bookmark, UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialInteractionsProps {
  contentId?: string;
  contentType?: 'post' | 'campaign' | 'reward' | 'message';
  targetUserId?: string;
  showCounts?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'horizontal' | 'vertical';
}

interface InteractionCounts {
  like: number;
  share: number;
  comment: number;
  bookmark: number;
}

interface UserInteractions {
  like: boolean;
  share: boolean;
  bookmark: boolean;
  follow: boolean;
}

const EnhancedSocialInteractions: React.FC<SocialInteractionsProps> = ({
  contentId,
  contentType,
  targetUserId,
  showCounts = true,
  size = 'md',
  variant = 'horizontal'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [counts, setCounts] = useState<InteractionCounts>({
    like: 0,
    share: 0,
    comment: 0,
    bookmark: 0
  });
  
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    like: false,
    share: false,
    bookmark: false,
    follow: false
  });

  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (contentId && contentType) {
      fetchContentCounts();
      fetchUserInteractions();
    }
    if (targetUserId) {
      fetchFollowStatus();
    }
  }, [contentId, contentType, targetUserId, user]);

  const fetchContentCounts = async () => {
    if (!contentId || !contentType) return;

    try {
      const { data, error } = await supabase.rpc('get_social_counts', {
        target_content_id_param: contentId,
        content_type_param: contentType
      });

      if (error) throw error;

      const countsMap = data?.reduce((acc: any, item: any) => {
        acc[item.interaction_type] = item.count;
        return acc;
      }, {}) || {};

      setCounts({
        like: countsMap.like || 0,
        share: countsMap.share || 0,
        comment: countsMap.comment || 0,
        bookmark: countsMap.bookmark || 0
      });
    } catch (error) {
      console.error('Error fetching content counts:', error);
    }
  };

  const fetchUserInteractions = async () => {
    if (!user || !contentId || !contentType) return;

    try {
      const { data, error } = await supabase
        .from('social_interactions')
        .select('interaction_type')
        .eq('user_id', user.id)
        .eq('target_content_id', contentId)
        .eq('content_type', contentType);

      if (error) throw error;

      const interactions = data?.reduce((acc: any, item: any) => {
        acc[item.interaction_type] = true;
        return acc;
      }, {}) || {};

      setUserInteractions(prev => ({
        ...prev,
        like: interactions.like || false,
        share: interactions.share || false,
        bookmark: interactions.bookmark || false
      }));
    } catch (error) {
      console.error('Error fetching user interactions:', error);
    }
  };

  const fetchFollowStatus = async () => {
    if (!user || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('social_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_user_id', targetUserId)
        .eq('interaction_type', 'follow')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setUserInteractions(prev => ({
        ...prev,
        follow: !!data
      }));
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  const handleContentInteraction = async (type: 'like' | 'share' | 'bookmark') => {
    if (!user || !contentId || !contentType) return;

    const isCurrentlyActive = userInteractions[type];
    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      if (isCurrentlyActive) {
        // Remove interaction
        const { error } = await supabase
          .from('social_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('target_content_id', contentId)
          .eq('content_type', contentType)
          .eq('interaction_type', type);

        if (error) throw error;

        setUserInteractions(prev => ({ ...prev, [type]: false }));
        setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));

        // Create notification for content creator
        if (type === 'like') {
          toast({
            title: "Like removed",
            description: "You unliked this content."
          });
        }
      } else {
        // Add interaction
        const { error } = await supabase
          .from('social_interactions')
          .insert({
            user_id: user.id,
            target_content_id: contentId,
            content_type: contentType,
            interaction_type: type,
            metadata: { timestamp: new Date().toISOString() }
          });

        if (error) throw error;

        setUserInteractions(prev => ({ ...prev, [type]: true }));
        setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));

        if (type === 'like') {
          toast({
            title: "Content liked!",
            description: "You liked this content."
          });
        } else if (type === 'bookmark') {
          toast({
            title: "Content bookmarked!",
            description: "Added to your bookmarks."
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFollowUser = async () => {
    if (!user || !targetUserId) return;

    const isCurrentlyFollowing = userInteractions.follow;
    setLoading(prev => ({ ...prev, follow: true }));

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('social_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('target_user_id', targetUserId)
          .eq('interaction_type', 'follow');

        if (error) throw error;

        setUserInteractions(prev => ({ ...prev, follow: false }));
        
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user."
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('social_interactions')
          .insert({
            user_id: user.id,
            target_user_id: targetUserId,
            interaction_type: 'follow',
            metadata: { timestamp: new Date().toISOString() }
          });

        if (error) throw error;

        setUserInteractions(prev => ({ ...prev, follow: true }));

        // Create notification for followed user
        await supabase.rpc('create_notification', {
          user_id_param: targetUserId,
          type_param: 'follow',
          title_param: 'New Follower',
          message_param: 'Someone started following you!',
          data_param: { follower_id: user.id }
        });

        toast({
          title: "Following!",
          description: "You are now following this user."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleShare = async () => {
    await handleContentInteraction('share');
    
    if (navigator.share && contentId) {
      try {
        await navigator.share({
          title: 'Check this out!',
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "The link has been copied to your clipboard."
        });
      }
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'default';
      default: return 'sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  const buttonClass = variant === 'vertical' ? 'flex-col gap-1' : 'flex-row gap-1';

  return (
    <div className={cn(
      'flex items-center gap-2',
      variant === 'vertical' && 'flex-col'
    )}>
      {/* Content Interactions */}
      {contentId && contentType && (
        <>
          {/* Like Button */}
          <Button
            variant={userInteractions.like ? "default" : "ghost"}
            size={getButtonSize()}
            onClick={() => handleContentInteraction('like')}
            disabled={loading.like || !user}
            className={cn(buttonClass, userInteractions.like && "text-red-500 hover:text-red-600")}
          >
            <Heart className={cn(getIconSize(), userInteractions.like && "fill-current")} />
            {showCounts && variant === 'horizontal' && <span>{counts.like}</span>}
          </Button>
          {showCounts && variant === 'vertical' && (
            <Badge variant="outline" className="text-xs">{counts.like}</Badge>
          )}

          {/* Share Button */}
          <Button
            variant={userInteractions.share ? "default" : "ghost"}
            size={getButtonSize()}
            onClick={handleShare}
            disabled={loading.share || !user}
            className={buttonClass}
          >
            <Share className={getIconSize()} />
            {showCounts && variant === 'horizontal' && <span>{counts.share}</span>}
          </Button>
          {showCounts && variant === 'vertical' && (
            <Badge variant="outline" className="text-xs">{counts.share}</Badge>
          )}

          {/* Bookmark Button */}
          <Button
            variant={userInteractions.bookmark ? "default" : "ghost"}
            size={getButtonSize()}
            onClick={() => handleContentInteraction('bookmark')}
            disabled={loading.bookmark || !user}
            className={cn(buttonClass, userInteractions.bookmark && "text-blue-500 hover:text-blue-600")}
          >
            <Bookmark className={cn(getIconSize(), userInteractions.bookmark && "fill-current")} />
            {showCounts && variant === 'horizontal' && <span>{counts.bookmark}</span>}
          </Button>
          {showCounts && variant === 'vertical' && (
            <Badge variant="outline" className="text-xs">{counts.bookmark}</Badge>
          )}
        </>
      )}

      {/* Follow Button */}
      {targetUserId && targetUserId !== user?.id && (
        <Button
          variant={userInteractions.follow ? "outline" : "default"}
          size={getButtonSize()}
          onClick={handleFollowUser}
          disabled={loading.follow || !user}
          className={buttonClass}
        >
          {userInteractions.follow ? (
            <UserMinus className={getIconSize()} />
          ) : (
            <UserPlus className={getIconSize()} />
          )}
          {variant === 'horizontal' && (
            <span>{userInteractions.follow ? 'Unfollow' : 'Follow'}</span>
          )}
        </Button>
      )}
    </div>
  );
};

export default EnhancedSocialInteractions;