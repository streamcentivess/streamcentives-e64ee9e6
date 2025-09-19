import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ClickableMentions } from '@/components/ui/clickable-mentions';
import { Check, X, MessageCircle, Clock, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  status: 'pending' | 'approved' | 'denied';
  xp_cost: number;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface InboxMessageProps {
  message: Message;
  onMessageUpdate: (messageId: string, newStatus: 'approved' | 'denied') => void;
}

export const InboxMessage: React.FC<InboxMessageProps> = ({ message, onMessageUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('update_message_status', {
        message_id_param: message.id,
        new_status_param: 'approved'
      });

      if (error) throw error;

      onMessageUpdate(message.id, 'approved');
      toast({
        title: "Message approved",
        description: "The message has been approved and the sender has been notified.",
      });
    } catch (error: any) {
      console.error('Error approving message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('update_message_status', {
        message_id_param: message.id,
        new_status_param: 'denied'
      });

      if (error) throw error;

      onMessageUpdate(message.id, 'denied');
      toast({
        title: "Message denied",
        description: "The message has been denied.",
      });
    } catch (error: any) {
      console.error('Error denying message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deny message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (message.status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <Check className="h-3 w-3" />
          Approved
        </Badge>;
      case 'denied':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <X className="h-3 w-3" />
          Denied
        </Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender_profile?.avatar_url} />
            <AvatarFallback>
              {message.sender_profile?.display_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{message.sender_profile?.display_name || 'Unknown User'}</p>
            <p className="text-sm text-muted-foreground">@{message.sender_profile?.username || 'unknown'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Badge variant="outline" className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {message.xp_cost} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ClickableMentions text={message.content} className="text-sm leading-relaxed" />
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </p>
            
            {message.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeny}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Deny
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};