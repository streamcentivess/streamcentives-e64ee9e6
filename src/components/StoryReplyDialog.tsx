import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send } from 'lucide-react';

interface StoryReplyDialogProps {
  storyId: string;
  recipientId: string;
  recipientName: string;
}

export function StoryReplyDialog({ storyId, recipientId, recipientName }: StoryReplyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendReply = async () => {
    if (!user || !message.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('story_replies')
        .insert({
          story_id: storyId,
          sender_id: user.id,
          recipient_id: recipientId,
          message: message.trim()
        });

      if (error) throw error;

      toast({
        title: 'Reply Sent! 💬',
        description: `Your message was sent to ${recipientName}`
      });

      setMessage('');
      setOpen(false);
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to {recipientName}'s Story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
          />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {message.length}/500
            </span>
            <Button
              onClick={sendReply}
              disabled={sending || !message.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
