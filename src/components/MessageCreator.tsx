import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Coins, Mic, Type, MessageSquare, Zap } from 'lucide-react';
import { VoiceMessageRecorder } from './VoiceMessageRecorder';
import MessageTemplateManager from './MessageTemplateManager';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageCreatorProps {
  recipientId: string;
  recipientName: string;
  onMessageSent?: () => void;
}

interface MessageCost {
  xp_cost: number;
  is_accepting_messages: boolean;
}

interface XPBalance {
  current_xp: number;
}

const MessageCreator: React.FC<MessageCreatorProps> = ({
  recipientId,
  recipientName,
  onMessageSent
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCost, setMessageCost] = useState<MessageCost | null>(null);
  const [userXP, setUserXP] = useState<number>(0);
  const [hasPendingMessage, setHasPendingMessage] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [messageMode, setMessageMode] = useState<'text' | 'voice'>('text');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isPriorityMessage, setIsPriorityMessage] = useState(false);

  useEffect(() => {
    fetchMessageCost();
    fetchUserXP();
    checkPendingMessage();
  }, [recipientId]);

  const fetchMessageCost = async () => {
    const { data, error } = await supabase
      .from('message_costs')
      .select('xp_cost, is_accepting_messages')
      .eq('creator_id', recipientId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching message cost:', error);
      // Default cost if not set
      setMessageCost({ xp_cost: 100, is_accepting_messages: true });
    } else if (data) {
      setMessageCost(data);
    } else {
      // No message cost record exists, create default
      setMessageCost({ xp_cost: 100, is_accepting_messages: true });
    }
  };

  const fetchUserXP = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_xp_balances')
      .select('current_xp')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setUserXP(data.current_xp);
    } else {
      setUserXP(0);
    }
  };

  const checkPendingMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', user.id)
      .eq('recipient_id', recipientId)
      .eq('status', 'pending')
      .maybeSingle();

    setHasPendingMessage(!!data);
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !messageCost) return;

    // Allow free messages to go to requests for all users
    const isFreeMessage = !isPriorityMessage;
    const actualXPCost = isFreeMessage ? 0 : messageCost.xp_cost;

    if (!isFreeMessage && userXP < messageCost.xp_cost) {
      toast({
        title: "Insufficient XP",
        description: `You need ${messageCost.xp_cost} XP to send this message, but you only have ${userXP} XP.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create message with appropriate status
      const messageStatus = isFreeMessage ? 'pending' : 'pending'; // Both go to pending initially
      const messageXPCost = actualXPCost;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          recipient_id: recipientId,
          content: messageContent.trim(),
          xp_cost: messageXPCost,
          status: messageStatus
        })
        .select()
        .single();

      if (error) throw error;

      // Only deduct XP if it's a priority message
      if (!isFreeMessage && actualXPCost > 0) {
        const { error: xpError } = await supabase.rpc('send_message_with_xp', {
          recipient_id_param: recipientId,
          content_param: messageContent.trim(),
          xp_cost_param: actualXPCost
        });

        if (xpError) throw xpError;
      }

      // Trigger AI analysis
      const messageId = data.id;
      await supabase.functions.invoke('analyze-message-sentiment', {
        body: { message: messageContent.trim(), messageId }
      });

      const messageDestination = isFreeMessage ? 'request inbox' : 'inbox';
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${recipientName}'s ${messageDestination}.`,
      });

      setMessage('');
      setHasPendingMessage(true);
      setShowVoiceRecorder(false);
      setMessageMode('text');
      setIsPriorityMessage(false);
      fetchUserXP(); // Refresh XP balance
      onMessageSent?.();

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = async (transcription: string, audioBlob?: Blob) => {
    // Automatically send the voice message using the transcription
    await sendMessage(transcription);
  };

  const toggleMessageMode = () => {
    if (messageMode === 'text') {
      setMessageMode('voice');
      setShowVoiceRecorder(true);
    } else {
      setMessageMode('text');
      setShowVoiceRecorder(false);
    }
  };

  if (!messageCost) {
    return <div className="p-4">Loading...</div>;
  }

  if (!messageCost.is_accepting_messages) {
    return (
      <Card className="p-4">
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {recipientName} is not currently accepting messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasPendingMessage) {
    return (
      <Card className="p-4">
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-2">
            You have a pending message with {recipientName}.
          </p>
          <p className="text-sm text-muted-foreground">
            Please wait for them to respond before sending another message.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isMobile ? 'mx-2' : ''}`}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Send Message to {recipientName}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Cost: {isPriorityMessage ? messageCost.xp_cost : 'Free'} {isPriorityMessage ? 'XP' : ''}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Your XP: {userXP}
            </Badge>
          </div>
        </div>

        {/* Priority Toggle - Available for all users */}
        <div className="flex items-center gap-4">
          <Button
            variant={!isPriorityMessage ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPriorityMessage(false)}
            disabled={isLoading}
          >
            📨 Free Request
          </Button>
          <Button
            variant={isPriorityMessage ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPriorityMessage(true)}
            disabled={isLoading || userXP < messageCost.xp_cost}
          >
            <Zap className="h-4 w-4 mr-1" />
            Priority ({messageCost.xp_cost} XP)
          </Button>
        </div>

        {/* Message Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={messageMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMessageMode('text');
              setShowVoiceRecorder(false);
              setShowTemplates(false);
            }}
            disabled={isLoading}
          >
            <Type className="h-4 w-4 mr-1" />
            Text Message
          </Button>
          <Button
            variant={messageMode === 'voice' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMessageMode}
            disabled={isLoading || (!isPriorityMessage ? false : userXP < messageCost.xp_cost)}
          >
            <Mic className="h-4 w-4 mr-1" />
            Voice Message
          </Button>
          <Button
            variant={showTemplates ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowTemplates(!showTemplates);
              setMessageMode('text');
              setShowVoiceRecorder(false);
            }}
            disabled={isLoading}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Templates
          </Button>
        </div>

        {/* Templates */}
        {showTemplates && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Choose a template:</h4>
            <MessageTemplateManager
              mode="select"
              onSelectTemplate={(template) => {
                setMessage(template.template_content);
                setShowTemplates(false);
              }}
            />
          </div>
        )}

        {/* Voice Recorder */}
        {messageMode === 'voice' && showVoiceRecorder && (
          <VoiceMessageRecorder
            onSendVoiceMessage={handleVoiceMessage}
            onCancel={() => {
              setShowVoiceRecorder(false);
              setMessageMode('text');
            }}
            disabled={isLoading || (!isPriorityMessage ? false : userXP < messageCost.xp_cost)}
          />
        )}

        {/* Text Message Input */}
        {messageMode === 'text' && !showVoiceRecorder && !showTemplates && (
          <>
            <Textarea
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={isMobile ? 3 : 4}
              disabled={isLoading}
              className={isMobile ? 'text-base' : ''}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {message.length}/500 characters
              </p>
              <Button
                onClick={() => sendMessage(message)}
                disabled={!message.trim() || isLoading || (!isPriorityMessage ? false : userXP < messageCost.xp_cost)}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isLoading ? 'Sending...' : 
                  isPriorityMessage ? `Send Priority (${messageCost.xp_cost} XP)` : 'Send Free Request'
                }
              </Button>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          {isPriorityMessage ? 
            'Priority messages go directly to inbox and cost XP.' : 
            'Free requests go to request inbox for approval.'
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default MessageCreator;