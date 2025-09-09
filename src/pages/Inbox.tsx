import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { InboxMessage } from '@/components/InboxMessage';
import CreatorInbox from '@/components/CreatorInbox';
import MessageSettings from '@/components/MessageSettings';
import { MessageCircle, Inbox as InboxIcon, Send, Search, Filter, Mail, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  status: string; // Changed from union type to string to match database
  xp_cost: number;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  recipient_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  useEffect(() => {
    if (user) {
      fetchSentMessages();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Message update:', payload);
          fetchSentMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchSentMessages = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch sent messages with recipient profiles
      const { data: sent, error: sentError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          content,
          status,
          xp_cost,
          created_at
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error('Error fetching sent messages:', sentError);
      } else {
        // Fetch recipient profiles for sent messages
        const messagesWithRecipients = await Promise.all(
          (sent || []).map(async (message: any) => {
            const { data: profile } = await supabase
              .from('public_profiles' as any)
              .select('username, display_name, avatar_url')
              .eq('user_id', message.recipient_id)
              .maybeSingle();

            return {
              ...message,
              recipient_profile: profile || { username: 'unknown', display_name: 'Unknown User', avatar_url: null }
            } as Message;
          })
        );
        
        setSentMessages(messagesWithRecipients);
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = (messages: Message[]) => {
    let filtered = messages;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    return filtered;
  };

  const getStatusCounts = (messages: Message[]) => {
    return {
      all: messages.length,
      pending: messages.filter(m => m.status === 'pending').length,
      approved: messages.filter(m => m.status === 'approved').length,
      denied: messages.filter(m => m.status === 'denied').length,
    };
  };

  const sentCounts = getStatusCounts(sentMessages);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
          <InboxIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Message Center</h1>
          <p className="text-muted-foreground">Manage your messages and messaging settings</p>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent
            <Badge variant="outline" className="ml-1">
              {sentCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <CreatorInbox />
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {/* Search and Filter Controls for Sent Messages */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search sent messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'pending', 'approved', 'denied'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filterMessages(sentMessages).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No sent messages</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't sent any messages yet."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filterMessages(sentMessages).map((message) => (
              <Card key={message.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">
                        To: {(message as any).recipient_profile?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{(message as any).recipient_profile?.username || 'unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        message.status === 'approved' ? 'default' : 
                        message.status === 'denied' ? 'destructive' : 'secondary'
                      }
                    >
                      {message.status}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {message.xp_cost} XP
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed mb-2">{message.content}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {new Date(message.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 flex justify-center">
          <MessageSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inbox;