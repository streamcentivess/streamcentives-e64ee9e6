import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  sender: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface LiveChatProps {
  streamId: string;
  creatorId: string;
}

export function LiveChat({ streamId, creatorId }: LiveChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    setupRealtimeChat();
  }, [streamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('live_stream_chat')
      .select(`
        *,
        sender:profiles!user_id(display_name, username, avatar_url)
      `)
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) setMessages(data as any);
  };

  const setupRealtimeChat = () => {
    const channel = supabase
      .channel(`chat-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_stream_chat',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('user_id', newMsg.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, sender } as any]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('live_stream_chat')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Live Chat</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={msg.sender?.avatar_url || undefined} />
                  <AvatarFallback>{msg.sender?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm truncate">
                      {msg.sender?.display_name || 'Unknown'}
                    </span>
                    {msg.user_id === creatorId && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Creator
                      </span>
                    )}
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="flex gap-2 px-4 pb-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message..."
            maxLength={500}
            disabled={!user || sending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!user || !newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
