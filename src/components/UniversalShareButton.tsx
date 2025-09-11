import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Copy, Twitter, Facebook, MessageCircle, Coins, Instagram, Mail, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UniversalShareButtonProps {
  type: 'post' | 'profile' | 'reward' | 'campaign';
  itemId?: string;
  title: string;
  description?: string;
  creatorName?: string;
  isOwnContent?: boolean;
  customUrl?: string;
  imageUrl?: string;
}

export const UniversalShareButton: React.FC<UniversalShareButtonProps> = ({ 
  type,
  itemId,
  title,
  description,
  creatorName,
  isOwnContent = false,
  customUrl,
  imageUrl
}) => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Generate the shareable URL
  const getShareableUrl = () => {
    if (customUrl) return customUrl;
    
    const baseUrl = window.location.origin;
    switch (type) {
      case 'profile':
        return `${baseUrl}/universal-profile?user=${itemId}`;
      case 'post':
        return `${baseUrl}/feed?post=${itemId}`;
      case 'reward':
        return `${baseUrl}/marketplace?reward=${itemId}`;
      case 'campaign':
        return `${baseUrl}/campaigns?campaign=${itemId}`;
      default:
        return window.location.href;
    }
  };

  const shareUrl = getShareableUrl();

  const handleShare = async (shareType: 'on_platform' | 'off_platform', platform?: string) => {
    if (!user || isOwnContent) {
      if (isOwnContent) {
        toast.error('Cannot earn XP from sharing your own content');
      } else {
        toast.error('Please sign in to earn XP from sharing');
      }
      return;
    }

    setIsSharing(true);
    try {
      // Handle different share types
      if (type === 'post' && itemId) {
        const { data, error } = await supabase.rpc('handle_post_share', {
          post_id_param: itemId,
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
      } else {
        // For other types, just show success (can implement XP system later)
        toast.success('Shared successfully!');
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      toast.error(error.message || 'Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareToTwitter = () => {
    const text = `Check out this ${type} by ${creatorName || 'creator'} on Streamcentives! ${description ? `"${description}"` : ''}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    handleShare('off_platform', 'twitter');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    handleShare('off_platform', 'facebook');
  };

  const shareToInstagram = () => {
    // Instagram doesn't have direct URL sharing, so we copy the link and provide instructions
    copyToClipboard();
    toast.success('Link copied! Paste it in your Instagram story or bio.');
  };

  const shareViaSMS = () => {
    const message = `Check out this ${type} on Streamcentives: ${title}${description ? ` - ${description}` : ''} ${shareUrl}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
    handleShare('off_platform', 'sms');
  };

  const shareViaEmail = () => {
    const subject = `Check out this ${type} on Streamcentives`;
    const body = `Hey!\n\nI wanted to share this ${type} with you: ${title}${description ? `\n\n"${description}"` : ''}\n\nCheck it out here: ${shareUrl}\n\nStreamcentives - Where fans and creators connect!`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
    handleShare('off_platform', 'email');
  };

  const shareOnPlatform = () => {
    handleShare('on_platform', 'streamcentives');
  };

  const sendPrivateMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      // This would need to be implemented with a user selector
      // For now, we'll just copy the content to clipboard with the link
      const fullMessage = `${messageContent}\n\nCheck this out: ${shareUrl}`;
      await navigator.clipboard.writeText(fullMessage);
      toast.success('Message with link copied to clipboard!');
      setMessageDialogOpen(false);
      setMessageContent('');
    } catch (error) {
      toast.error('Failed to prepare message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Share2 className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="center">
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Share {title}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {description || `Share this ${type} with your network`}
              </p>
            </div>

            <div className="space-y-2">
              {/* Streamcentives Internal Sharing */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Share on Streamcentives:</p>
                
                <Button
                  onClick={shareOnPlatform}
                  disabled={isSharing}
                  className="w-full justify-start gap-2 bg-gradient-primary hover:opacity-90"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Share to Feed
                </Button>

                <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      size="sm"
                    >
                      <Mail className="h-4 w-4" />
                      Send Private Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Private Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Add a personal message to share with the link:
                      </p>
                      <Textarea
                        placeholder="Add your message here..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={sendPrivateMessage} disabled={sendingMessage}>
                          {sendingMessage ? 'Preparing...' : 'Copy Message & Link'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Quick Share:</p>
                
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>

                <Button
                  onClick={shareViaSMS}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                >
                  <Smartphone className="h-4 w-4" />
                  Share via SMS
                </Button>

                <Button
                  onClick={shareViaEmail}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                >
                  <Mail className="h-4 w-4" />
                  Share via Email
                </Button>
              </div>

              {/* Social Media Sharing */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Share to social media:</p>
                
                <Button
                  onClick={shareToTwitter}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                >
                  <Twitter className="h-4 w-4" />
                  Share on X (Twitter)
                </Button>

                <Button
                  onClick={shareToFacebook}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                >
                  <Facebook className="h-4 w-4" />
                  Share on Facebook
                </Button>

                <Button
                  onClick={shareToInstagram}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                >
                  <Instagram className="h-4 w-4" />
                  Share on Instagram
                </Button>
              </div>
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                Sign in to share on Streamcentives
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};