import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Check, X, AlertTriangle, Clock, Shield, MessageCircle, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  xp_cost: number;
  status: string;
  created_at: string;
  sender_id: string;
  conversation_id: string;
  analysis_status: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    username?: string;
  } | null;
  message_analysis: Array<{
    is_appropriate: boolean;
    severity: string;
    flags: string[];
    confidence: number;
  }>;
}

interface Conversation {
  conversation_id: string;
  sender_id: string;
  latest_message: Message;
  message_count: number;
  unread_count: number;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    username?: string;
  } | null;
}

interface CreatorInboxProps {
  onViewConversation?: (conversationId: string) => void;
  searchQuery?: string;
}

const CreatorInbox: React.FC<CreatorInboxProps> = ({ onViewConversation, searchQuery = '' }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('creator-inbox-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime message change:', payload);
          // Immediately refetch conversations on any change
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all messages for the user
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        xp_cost,
        status,
        created_at,
        sender_id,
        conversation_id,
        analysis_status,
        message_analysis(is_appropriate, severity, flags, confidence)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Group messages by conversation_id or sender_id if no conversation_id
    const conversationMap = new Map<string, Message[]>();
    
    (messages || []).forEach((message: any) => {
      const key = message.conversation_id || message.sender_id;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, []);
      }
      conversationMap.get(key)!.push(message);
    });

    // Create conversation objects with profiles
    const conversationsWithProfiles: Conversation[] = await Promise.all(
      Array.from(conversationMap.entries()).map(async ([key, msgs]) => {
        const latestMessage = msgs[0]; // First message is latest due to ordering
        const senderId = latestMessage.sender_id;
        
        const { data: profileResult } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, username')
          .eq('user_id', senderId)
          .single();
        const profile = profileResult;

        const unreadCount = msgs.filter(m => m.status === 'pending').length;

        return {
          conversation_id: key,
          sender_id: senderId,
          latest_message: {
            ...latestMessage,
            profiles: (profile as any) || { display_name: 'Anonymous', avatar_url: null, username: null }
          } as Message,
          message_count: msgs.length,
          unread_count: unreadCount,
          profiles: (profile as any) || { display_name: 'Anonymous', avatar_url: null, username: null }
        };
      })
    );

    setConversations(conversationsWithProfiles);
    setIsLoading(false);
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const senderName = conversation.profiles?.display_name?.toLowerCase() || '';
    const content = conversation.latest_message.content.toLowerCase();
    
    return senderName.includes(query) || content.includes(query);
  });

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Deleting conversation:', conversationId);

      // Delete all messages in the conversation where user is recipient
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('recipient_id', user.id)
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Delete successful, updating UI');

      // Immediately update the local state
      setConversations(prevConversations => {
        const filtered = prevConversations.filter(conv => conv.conversation_id !== conversationId);
        console.log('Filtered conversations:', filtered.length, 'from', prevConversations.length);
        return filtered;
      });

      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted successfully.",
      });

    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (unreadCount: number, latestStatus: string) => {
    if (unreadCount > 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {unreadCount} New
      </Badge>;
    }
    
    switch (latestStatus) {
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <Check className="h-3 w-3" />
          Active
        </Badge>;
      case 'denied':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <X className="h-3 w-3" />
          Closed
        </Badge>;
      default:
        return <Badge variant="outline">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>;
    }
  };

  const getModerationBadge = (analysis: Message['message_analysis'][0]) => {
    if (!analysis) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Analyzing...
      </Badge>;
    }

    if (!analysis.is_appropriate) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Flagged ({analysis.severity})
      </Badge>;
    }

    return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
      <Shield className="h-3 w-3" />
      Safe
    </Badge>;
  };

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-6">
        <CardContent className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-muted-foreground">Messages from your fans will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  if (filteredConversations.length === 0 && searchQuery.trim()) {
    return (
      <Card className="p-6">
        <CardContent className="text-center">
          <p className="text-muted-foreground">No conversations found matching "{searchQuery}"</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Creator Inbox</h2>
      
      {filteredConversations.map((conversation) => {
        const latestMessage = conversation.latest_message;
        const analysis = latestMessage.message_analysis[0];
        
        return (
          <Card key={conversation.conversation_id} className="w-full hover:bg-muted/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar 
                    className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (conversation.profiles?.username) {
                        navigate(`/universal-profile?username=${conversation.profiles.username}`);
                      }
                    }}
                  >
                    <AvatarImage src={conversation.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {conversation.profiles?.display_name || 'Anonymous'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {conversation.message_count} message{conversation.message_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(conversation.unread_count, latestMessage.status)}
                  {analysis && getModerationBadge(analysis)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{format(new Date(latestMessage.created_at), 'MMM dd, yyyy at HH:mm')}</span>
                <Badge variant="outline">{latestMessage.xp_cost} XP</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Latest message:</p>
                <p className="text-sm line-clamp-2">{latestMessage.content}</p>
              </div>

              {analysis && !analysis.is_appropriate && (
                <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  <p className="text-sm text-destructive font-medium mb-2">
                    Content Moderation Alert
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>Severity: {analysis.severity}</p>
                    <p>Confidence: {Math.round(analysis.confidence * 100)}%</p>
                    {analysis.flags.length > 0 && (
                      <p>Flags: {analysis.flags.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />
              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewConversation && onViewConversation(conversation.conversation_id)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    View Conversation
                  </Button>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this conversation with {conversation.profiles?.display_name || 'Anonymous'}? 
                        This will permanently remove all {conversation.message_count} message{conversation.message_count !== 1 ? 's' : ''} and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteConversation(conversation.conversation_id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Conversation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CreatorInbox;