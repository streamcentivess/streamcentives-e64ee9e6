import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, AlertTriangle, Clock, Shield, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

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
  } | null;
  message_analysis: Array<{
    is_appropriate: boolean;
    severity: string;
    flags: string[];
    confidence: number;
  }>;
}

interface CreatorInboxProps {
  onViewConversation?: (conversationId: string) => void;
}

const CreatorInbox: React.FC<CreatorInboxProps> = ({ onViewConversation }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
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

    // Fetch sender profiles separately
    const messagesWithProfiles: Message[] = await Promise.all(
      (data || []).map(async (message: any) => {
        const { data: profile } = await supabase
          .from('public_profiles' as any)
          .select('display_name, avatar_url')
          .eq('user_id', message.sender_id)
          .maybeSingle();

        return {
          ...message,
          profiles: (profile as any) || { display_name: 'Anonymous', avatar_url: null }
        } as Message;
      })
    );

    setMessages(messagesWithProfiles);
    setIsLoading(false);
  };

  const handleMessageAction = async (messageId: string, action: 'approved' | 'denied') => {
    try {
      const { error } = await supabase.rpc('update_message_status', {
        message_id_param: messageId,
        new_status_param: action
      });

      if (error) throw error;

      toast({
        title: `Message ${action}`,
        description: `The message has been ${action}.`,
      });

      fetchMessages(); // Refresh messages
    } catch (error: any) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update message.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending Review
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <Check className="h-3 w-3" />
          Approved
        </Badge>;
      case 'denied':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <X className="h-3 w-3" />
          Denied
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    return <div className="p-4">Loading messages...</div>;
  }

  if (messages.length === 0) {
    return (
      <Card className="p-6">
        <CardContent className="text-center">
          <p className="text-muted-foreground">No messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Creator Inbox</h2>
      
      {messages.map((message) => {
        const analysis = message.message_analysis[0];
        
        return (
          <Card key={message.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  From: {message.profiles?.display_name || 'Anonymous'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(message.status)}
                  {getModerationBadge(analysis)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{format(new Date(message.created_at), 'MMM dd, yyyy at HH:mm')}</span>
                <Badge variant="outline">{message.xp_cost} XP</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{message.content}</p>
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
                {message.status === 'approved' && onViewConversation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewConversation(message.conversation_id)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    View Conversation
                  </Button>
                )}
                
                {message.status === 'pending' && (
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMessageAction(message.id, 'denied')}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Deny
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMessageAction(message.id, 'approved')}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CreatorInbox;