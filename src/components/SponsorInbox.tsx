import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClickableMentions } from "@/components/ui/clickable-mentions";
import { MessageCircle, Mail, TrendingUp, Search, DollarSign, Clock, Check, X, Send, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SponsorMessageComposer } from "@/components/SponsorMessageComposer";

interface SponsorOffer {
  id: string;
  offer_title: string;
  offer_description: string;
  status: string;
  offer_amount_cents: number;
  created_at: string;
  response_count: number;
  last_response_at?: string;
  expires_at?: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  } | null;
}

interface OfferResponse {
  id: string;
  response_type: string;
  message?: string;
  counter_amount_cents?: number;
  created_at: string;
  sender_type: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  } | null;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  status: string;
  xp_cost: number;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export function SponsorInbox() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<SponsorOffer | null>(null);
  const [offerResponses, setOfferResponses] = useState<OfferResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInboxData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    const offersChannel = supabase
      .channel('sponsor-offers-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sponsor_offers',
          filter: `sponsor_id=eq.${user.id}`
        },
        () => fetchOffers()
      )
      .subscribe();

    const responsesChannel = supabase
      .channel('offer-responses-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_responses'
        },
        () => {
          fetchOffers();
          if (selectedOffer) {
            fetchOfferResponses(selectedOffer.id);
          }
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('sponsor-messages-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(offersChannel);
      supabase.removeChannel(responsesChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const fetchInboxData = async () => {
    setLoading(true);
    await Promise.all([fetchOffers(), fetchMessages()]);
    setLoading(false);
  };

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_offers')
        .select(`
          *,
          profiles!sponsor_offers_creator_id_fkey (username, display_name, avatar_url)
        `)
        .eq('sponsor_id', user?.id)
        .order('last_response_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers((data as any[])?.map(offer => ({
        ...offer,
        profiles: offer.profiles || { username: 'unknown', display_name: 'Unknown User', avatar_url: null }
      })) || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender profiles
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (message: any) => {
          const { data: profileResult } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, username')
            .eq('user_id', message.sender_id)
            .single();

          return {
            ...message,
            sender_profile: profileResult || { username: 'unknown', display_name: 'Unknown User', avatar_url: null }
          } as Message;
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchOfferResponses = async (offerId: string) => {
    try {
      const { data, error } = await supabase
        .from('offer_responses')
        .select('*, profiles!offer_responses_sender_id_fkey(username, display_name, avatar_url)')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOfferResponses((data as any[])?.map(response => ({
        ...response,
        profiles: response.profiles || { username: 'unknown', display_name: 'Unknown User', avatar_url: null }
      })) || []);
    } catch (error) {
      console.error('Error fetching offer responses:', error);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedOffer || !responseMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('offer_responses')
        .insert([{
          offer_id: selectedOffer.id,
          sender_id: user?.id,
          sender_type: 'sponsor',
          response_type: 'message',
          message: responseMessage.trim()
        }]);

      if (error) throw error;

      setResponseMessage('');
      fetchOfferResponses(selectedOffer.id);
      
      toast({
        title: "Response sent",
        description: "Your message has been sent to the creator."
      });
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <Check className="h-4 w-4" />;
      case 'declined': return <X className="h-4 w-4" />;
      case 'negotiating': return <MessageCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'accepted': return 'default';
      case 'declined': return 'destructive';
      case 'negotiating': return 'secondary';
      default: return 'default';
    }
  };

  const filteredOffers = offers.filter(offer =>
    offer.offer_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.profiles.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender_profile?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sponsor Inbox</h2>
          <p className="text-muted-foreground">Manage your offers and creator communications</p>
        </div>
        <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Message to Creator</DialogTitle>
            </DialogHeader>
            <SponsorMessageComposer 
              onMessageSent={() => setShowNewMessage(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search offers and messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            My Offers
            <Badge variant="outline" className="ml-1">
              {offers.filter(o => o.response_count > 0).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Messages
            <Badge variant="outline" className="ml-1">
              {messages.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-4 mt-6">
          {selectedOffer ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOffer(null)}>
                      ←
                    </Button>
                    {selectedOffer.offer_title}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Conversation with @{selectedOffer.profiles.username}
                  </p>
                </div>
                <Badge variant={getStatusColor(selectedOffer.status)}>
                  {getStatusIcon(selectedOffer.status)}
                  {selectedOffer.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original Offer */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                      S
                    </div>
                    <span className="font-medium">You</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedOffer.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="ml-8">
                    <p className="font-medium mb-1">Original Offer: ${(selectedOffer.offer_amount_cents / 100).toLocaleString()}</p>
                    <p className="text-sm">{selectedOffer.offer_description}</p>
                  </div>
                </div>

                {/* Responses */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {offerResponses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 rounded-lg ${
                        response.sender_type === 'sponsor' ? 'bg-primary/10 ml-4' : 'bg-muted/50 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          response.sender_type === 'sponsor' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                        }`}>
                          {response.sender_type === 'sponsor' ? 'S' : 'C'}
                        </div>
                        <span className="font-medium">
                          {response.sender_type === 'sponsor' ? 'You' : response.profiles?.display_name || response.profiles?.username}
                        </span>
                        <Badge variant="outline">{response.response_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(response.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="ml-8">
                        {response.counter_amount_cents && (
                          <p className="font-medium text-sm mb-1">
                            Counter Offer: ${(response.counter_amount_cents / 100).toLocaleString()}
                          </p>
                        )}
                        {response.message && <p className="text-sm">{response.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Response Input */}
                {selectedOffer.status !== 'accepted' && selectedOffer.status !== 'declined' && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your response..."
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      className="flex-1"
                      rows={2}
                    />
                    <Button onClick={handleSendResponse} disabled={!responseMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOffers.length > 0 ? (
                filteredOffers.map((offer) => (
                  <Card key={offer.id} className="cursor-pointer hover:bg-muted/50 transition-colors" 
                        onClick={() => {
                          setSelectedOffer(offer);
                          fetchOfferResponses(offer.id);
                        }}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{offer.offer_title}</h3>
                            <Badge variant={getStatusColor(offer.status)} className="flex items-center gap-1">
                              {getStatusIcon(offer.status)}
                              {offer.status}
                            </Badge>
                            {offer.response_count > 0 && (
                              <Badge variant="secondary">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {offer.response_count} responses
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            To: @{offer.profiles?.username} • ${(offer.offer_amount_cents / 100).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Sent {new Date(offer.created_at).toLocaleDateString()}</span>
                        {offer.last_response_at && (
                          <span>Last response {new Date(offer.last_response_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No offers found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search criteria" : "You haven't sent any offers yet"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4 mt-6">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <Card key={message.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        {message.sender_profile?.display_name?.[0] || message.sender_profile?.username?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">
                          {message.sender_profile?.display_name || message.sender_profile?.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{message.sender_profile?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={message.status === 'approved' ? 'default' : 'secondary'}>
                        {message.status}
                      </Badge>
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {message.xp_cost} XP
                      </Badge>
                    </div>
                  </div>
                  <ClickableMentions text={message.content} className="text-sm mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Received {new Date(message.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search criteria" : "You haven't received any messages yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}