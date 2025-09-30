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
import ConversationThread from '@/components/ConversationThread';
import MessageCreator from '@/components/MessageCreator';
import { CreatorOffersTab } from '@/components/CreatorOffersTab';
import { ClickableMentions } from '@/components/ui/clickable-mentions';
import { MessageCircle, Inbox as InboxIcon, Send, Search, Filter, Mail, Settings, User, ArrowLeft, Trash2, Plus, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';
import { SponsorInbox } from '@/components/SponsorInbox';

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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { role, loading: roleLoading } = useUserRole();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

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
          console.log('Sent message update:', payload);
          fetchSentMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Use the secure RPC function to search public profiles
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_query: query,
        limit_count: 10,
        offset_count: 0
      });

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error in searchUsers:', error);
    }
  };

  const handleUserSearch = (query: string) => {
    setSearchUserQuery(query);
    searchUsers(query);
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
            const { data: profileResult } = await supabase.rpc('get_public_profile_safe', { 
              target_user_id: message.recipient_id 
            });
            const profile = profileResult?.[0];

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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Immediately update the local state
      setSentMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== messageId)
      );

      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully.",
      });

    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to delete message.",
        variant: "destructive",
      });
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

  // Show sponsor-specific inbox for sponsors
  if (role === 'sponsor') {
    return (
      <div className={`container mx-auto px-4 py-8 max-w-4xl ${isMobile ? 'px-2' : ''}`}>
        <div className={`flex items-center justify-between mb-6 ${isMobile ? 'mb-4' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <InboxIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Sponsor Inbox</h1>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Manage your partnership offers and creator communications</p>
            </div>
          </div>
          {!isMobile && (
            <Button
              variant="outline"
              onClick={async () => {
                if (user) {
                  const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle();
                  if (profile?.username) navigate(`/${profile.username}`);
                }
              }}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              My Profile
            </Button>
          )}
        </div>
        <SponsorInbox />
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 max-w-4xl ${isMobile ? 'px-2' : ''}`}>
      {/* Header with Search and Profile Button */}
      <div className={`flex items-center justify-between mb-6 ${isMobile ? 'mb-4' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <InboxIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Message Center</h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Manage your messages and messaging settings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowNewMessageDialog(true)}
            className="bg-gradient-primary hover:opacity-90"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
          {!isMobile && (
            <Button
              variant="outline"
              onClick={async () => {
                if (user) {
                  const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle();
                  if (profile?.username) navigate(`/${profile.username}`);
                }
              }}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              My Profile
            </Button>
          )}
        </div>
      </div>

      {/* Global Search Bar */}
      <Card className={`mb-6 ${isMobile ? 'mb-4' : ''}`}>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search messages by user name or content..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className={`pl-10 ${isMobile ? 'text-base' : ''}`}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {isMobile ? 'Inbox' : 'Inbox'}
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {isMobile ? 'Offers' : 'Offers'}
          </TabsTrigger>
          {!isMobile && (
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent
              <Badge variant="outline" className="ml-1">
                {sentCounts.all}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          {selectedConversation ? (
            <ConversationThread
              conversationId={selectedConversation}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <CreatorInbox 
              onViewConversation={setSelectedConversation}
              searchQuery={globalSearchQuery}
            />
          )}
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          <CreatorOffersTab />
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this message to {(message as any).recipient_profile?.display_name || 'Unknown User'}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMessage(message.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Message
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ClickableMentions text={message.content} className="text-sm leading-relaxed mb-2" />
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

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className={`${isMobile ? 'h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] p-4 rounded-lg m-auto top-[2.5vh] left-[2.5vw] translate-x-0 translate-y-0' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Send New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedRecipient ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or display name..."
                      value={searchUserQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center space-x-3 p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => setSelectedRecipient(user)}
                      >
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name || user.username}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                    {selectedRecipient.avatar_url ? (
                      <img src={selectedRecipient.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedRecipient.display_name || selectedRecipient.username}</p>
                    <p className="text-sm text-muted-foreground">@{selectedRecipient.username}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRecipient(null);
                      setSearchUserQuery('');
                      setSearchResults([]);
                    }}
                  >
                    Change
                  </Button>
                </div>
                
                <MessageCreator
                  recipientId={selectedRecipient.user_id}
                  recipientName={selectedRecipient.display_name || selectedRecipient.username}
                  onMessageSent={() => {
                    setShowNewMessageDialog(false);
                    setSelectedRecipient(null);
                    setSearchUserQuery('');
                    setSearchResults([]);
                    // Refresh the inbox
                    fetchSentMessages();
                    toast({
                      title: "Message sent!",
                      description: `Your message has been sent to ${selectedRecipient.display_name || selectedRecipient.username}.`,
                    });
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;