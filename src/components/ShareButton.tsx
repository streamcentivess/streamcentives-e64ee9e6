import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Share2, Copy, Twitter, Facebook, MessageCircle, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ShareButtonProps {
  postId: string;
  postUrl: string;
  postCaption?: string;
  creatorName?: string;
  isOwnPost?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ 
  postId, 
  postUrl, 
  postCaption, 
  creatorName,
  isOwnPost = false 
}) => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [shareSettings, setShareSettings] = useState<{
    on_platform_xp: number;
    off_platform_xp: number;
    is_shareable: boolean;
  } | null>(null);

  React.useEffect(() => {
    fetchShareSettings();
  }, [postId]);

  const fetchShareSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('post_share_settings')
        .select('on_platform_xp, off_platform_xp, is_shareable')
        .eq('post_id', postId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching share settings:', error);
        return;
      }

      // Use default values if no settings exist
      setShareSettings(data || {
        on_platform_xp: 5,
        off_platform_xp: 10,
        is_shareable: true
      });
    } catch (error) {
      console.error('Error fetching share settings:', error);
    }
  };

  const handleShare = async (shareType: 'on_platform' | 'off_platform', platform?: string) => {
    if (!user || isOwnPost) {
      if (isOwnPost) {
        toast.error('Cannot earn XP from sharing your own content');
      } else {
        toast.error('Please sign in to earn XP from sharing');
      }
      return;
    }

    if (!shareSettings?.is_shareable) {
      toast.error('Sharing is disabled for this post');
      return;
    }

    setIsSharing(true);
    try {
      const { data, error } = await supabase.rpc('handle_post_share', {
        post_id_param: postId,
        share_type_param: shareType,
        platform_param: platform || null
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast.success(`Shared successfully! Earned ${result.xp_earned} XP`);
      } else {
        toast.error(result?.error || 'Failed to share');
      }
    } catch (error: any) {
      console.error('Error sharing post:', error);
      toast.error(error.message || 'Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareToTwitter = () => {
    const text = `Check out this post by ${creatorName || 'creator'} on Streamcentives! ${postCaption ? `"${postCaption}"` : ''}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank');
    handleShare('off_platform', 'twitter');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank');
    handleShare('off_platform', 'facebook');
  };

  const shareOnPlatform = () => {
    // For on-platform sharing, we'll create a post referencing the original
    handleShare('on_platform', 'streamcentives');
  };

  if (!shareSettings?.is_shareable) {
    return null; // Don't show share button if sharing is disabled
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Share2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="center">
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-semibold mb-2">Share & Earn XP</h4>
            {!isOwnPost && user && (
              <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  On-platform: {shareSettings?.on_platform_xp || 5} XP
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  Off-platform: {shareSettings?.off_platform_xp || 10} XP
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {/* On-platform share */}
            <Button
              onClick={shareOnPlatform}
              disabled={isSharing}
              className="w-full justify-start gap-2 bg-gradient-primary hover:opacity-90"
              size="sm"
            >
              <MessageCircle className="h-4 w-4" />
              Share on Streamcentives
              {!isOwnPost && user && (
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                  +{shareSettings?.on_platform_xp || 5} XP
                </span>
              )}
            </Button>

            {/* Copy link */}
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>

            {/* External platform shares */}
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2">Share to social media:</p>
              
              <Button
                onClick={shareToTwitter}
                variant="outline"
                className="w-full justify-start gap-2 mb-2"
                size="sm"
              >
                <Twitter className="h-4 w-4" />
                Share on X (Twitter)
                {!isOwnPost && user && (
                  <span className="ml-auto text-xs bg-muted px-2 py-1 rounded">
                    +{shareSettings?.off_platform_xp || 10} XP
                  </span>
                )}
              </Button>

              <Button
                onClick={shareToFacebook}
                variant="outline"
                className="w-full justify-start gap-2"
                size="sm"
              >
                <Facebook className="h-4 w-4" />
                Share on Facebook
                {!isOwnPost && user && (
                  <span className="ml-auto text-xs bg-muted px-2 py-1 rounded">
                    +{shareSettings?.off_platform_xp || 10} XP
                  </span>
                )}
              </Button>
            </div>
          </div>

          {!user && (
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              Sign in to earn XP from sharing
            </p>
          )}

          {isOwnPost && (
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              You can't earn XP from sharing your own content
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};