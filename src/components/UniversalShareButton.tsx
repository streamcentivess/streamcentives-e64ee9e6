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
import { UserProfileSearch } from '@/components/UserProfileSearch';

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
  const [selectedUser, setSelectedUser] = useState<{id: string; username: string; display_name: string} | null>(null);

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

  const handleShare = async (platform: string) => {
    if (!user || isOwnContent) {
      if (isOwnContent) {
        toast.error('Cannot earn XP from sharing your own content');
      } else {
        toast.error('Please sign in to earn XP from sharing');
      }
      return;
    }

    if (!itemId) {
      toast.error('Cannot share: content ID is missing');
      return;
    }

    setIsSharing(true);
    try {
      const { data, error } = await supabase.rpc('handle_universal_share', {
        content_type_param: type,
        content_id_param: itemId,
        platform_param: platform,
        share_url_param: shareUrl
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast.success(`${result.message}`);
      } else {
        toast.error(result?.error || 'Failed to share');
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
    handleShare('twitter');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    handleShare('facebook');
  };

  const shareToInstagram = async () => {
    // Instagram Stories URL - opens Instagram app with camera ready
    const instagramUrl = `instagram://story-camera`;
    
    // Try to open Instagram app first
    try {
      window.open(instagramUrl, '_blank');
      // Copy link for manual sharing
      await copyToClipboard();
      toast.success('Instagram opened! Link copied to paste in your story.');
      
      // Award XP for Instagram sharing
      await handleShare('instagram');
    } catch (error) {
      // Fallback: just copy link if Instagram app can't be opened
      await copyToClipboard();
      toast.success('Link copied! Open Instagram and paste in your story or bio.');
      await handleShare('instagram');
    }
  };

  const shareViaSMS = () => {
    const message = `Check out this ${type} on Streamcentives: ${title}${description ? ` - ${description}` : ''} ${shareUrl}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
    handleShare('sms');
  };

  const shareViaEmail = () => {
    const subject = `Check out this ${type} on Streamcentives`;
    const body = `Hey!\n\nI wanted to share this ${type} with you: ${title}${description ? `\n\n"${description}"` : ''}\n\nCheck it out here: ${shareUrl}\n\nStreamcentives - Where fans and creators connect!`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
    handleShare('email');
  };

  const shareOnPlatform = () => {
    handleShare('streamcentives');
  };

  const sendPrivateMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!selectedUser) {
      toast.error('Please select a user to send the message to');
      return;
    }

    setSendingMessage(true);
    try {
      // Send the message with the shared link
      const fullMessage = `${messageContent}\n\nCheck this out: ${shareUrl}`;
      
      const { data: messageId, error } = await supabase.rpc('send_message_with_xp', {
        recipient_id_param: selectedUser.id,
        content_param: fullMessage,
        xp_cost_param: 100 // Default XP cost
      });

      if (error) throw error;

      toast.success(`Message sent to ${selectedUser.display_name || selectedUser.username}!`);
      setMessageDialogOpen(false);
      setMessageContent('');
      setSelectedUser(null);
      
      // Award XP for sharing via message
      await handleShare('streamcentives');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
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
                      <div>
                        <label className="text-sm font-medium mb-2 block">Select User:</label>
                        {selectedUser ? (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{selectedUser.display_name}</p>
                              <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedUser(null)}
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <UserProfileSearch
                            onProfileSelect={(profile) => setSelectedUser({
                              id: profile.user_id,
                              username: profile.username,
                              display_name: profile.display_name
                            })}
                          />
                        )}
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Message:</label>
                        <Textarea
                          placeholder="Add your message here..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setMessageDialogOpen(false);
                          setSelectedUser(null);
                          setMessageContent('');
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={sendPrivateMessage} 
                          disabled={sendingMessage || !selectedUser || !messageContent.trim()}
                        >
                          {sendingMessage ? 'Sending...' : 'Send Message'}
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