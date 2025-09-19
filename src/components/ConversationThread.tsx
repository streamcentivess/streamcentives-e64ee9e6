import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClickableMentions } from '@/components/ui/clickable-mentions';
import { Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  xp_cost: number;
  status: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  parent_message_id?: string;
  conversation_id: string;
  sender_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  recipient_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface ConversationThreadProps {
  conversationId: string;
  onBack: () => void;
}

const ConversationThread: React.FC<ConversationThreadProps> = ({ conversationId, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [otherParticipant, setOtherParticipant] = useState<{id: string, name: string, avatar?: string} | null>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      setupRealtimeSubscription();
    }
  }, [conversationId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          fetchConversation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(data?.flatMap(m => [m.sender_id, m.recipient_id]) || [])];
      // Get profiles using the safe function
      const profilePromises = userIds.map(id => 
        supabase.rpc('get_public_profile_safe', { target_user_id: id })
      );
      const profileResults = await Promise.all(profilePromises);
      const profiles = profileResults
        .map(result => result.data?.[0])
        .filter(Boolean);

      const profileMap = profiles?.reduce((acc: any, profile: any) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {}) || {};

      const messagesWithProfiles = data?.map(message => ({
        ...message,
        sender_profile: profileMap[message.sender_id],
        recipient_profile: profileMap[message.recipient_id]
      })) || [];

      setMessages(messagesWithProfiles);

      // Set other participant info
      const firstMessage = messagesWithProfiles[0];
      if (firstMessage) {
        const otherId = firstMessage.sender_id === user.id ? firstMessage.recipient_id : firstMessage.sender_id;
        const otherProfile = profileMap[otherId];
        setOtherParticipant({
          id: otherId,
          name: otherProfile?.display_name || 'Unknown User',
          avatar: otherProfile?.avatar_url
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (messageId: string) => {
    try {
      const { error } = await supabase.rpc('update_message_status', {
        message_id_param: messageId,
        new_status_param: 'approved'
      });

      if (error) throw error;

      toast({
        title: "Message approved",
        description: "You can now continue the conversation"
      });
    } catch (error: any) {
      console.error('Error approving message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve message",
        variant: "destructive"
      });
    }
  };

  const handleDeny = async (messageId: string) => {
    try {
      const { error } = await supabase.rpc('update_message_status', {
        message_id_param: messageId,
        new_status_param: 'denied'
      });

      if (error) throw error;

      toast({
        title: "Message denied",
        description: "The message has been rejected"
      });
    } catch (error: any) {
      console.error('Error denying message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deny message",
        variant: "destructive"
      });
    }
  };

  const sendReply = async () => {
    if (!user || !replyContent.trim() || !otherParticipant) return;

    setSending(true);
    try {
      // Insert reply directly (no XP cost for replies)
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: otherParticipant.id,
          content: replyContent,
          conversation_id: conversationId,
          parent_message_id: messages[messages.length - 1]?.id, // Reply to latest message
          xp_cost: 0, // No cost for replies
          status: 'approved' // Replies are auto-approved
        });

      if (error) throw error;

      setReplyContent('');
      toast({
        title: "Reply sent",
        description: "Your reply has been sent"
      });
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading conversation...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherParticipant?.avatar} />
          <AvatarFallback>
            {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">Conversation with {otherParticipant?.name}</h2>
          <p className="text-sm text-muted-foreground">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id;
          const profile = isOwnMessage ? message.sender_profile : message.recipient_profile;
          
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                <Card className={`${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <CardContent className="p-3">
                    {message.content.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <div className="space-y-2">
                        <img 
                          src={message.content} 
                          alt="Shared content" 
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    ) : message.content.match(/\.(mp4|webm|ogg)$/i) ? (
                      <div className="space-y-2">
                        <video 
                          src={message.content} 
                          controls 
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    ) : (
                      <ClickableMentions text={message.content} className="text-sm whitespace-pre-wrap break-words" />
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                      {message.xp_cost > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {message.xp_cost} XP
                        </Badge>
                      )}
                      {message.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    
                    {/* Show approve/deny buttons for pending messages from others */}
                    {message.status === 'pending' && message.recipient_id === user?.id && !isOwnMessage && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(message.id)}
                          className="h-6 text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeny(message.id)}
                          className="h-6 text-xs"
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Input - Only show for approved conversations */}
      {messages.some(m => m.status === 'approved') && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Type your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={sendReply}
                  disabled={!replyContent.trim() || sending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConversationThread;