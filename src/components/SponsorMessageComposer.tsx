import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Send, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { VerificationBadge } from '@/components/VerificationBadge';

interface Creator {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  creator_type?: string;
  follower_count?: number;
}

interface SponsorMessageComposerProps {
  onMessageSent?: () => void;
}

export function SponsorMessageComposer({ onMessageSent }: SponsorMessageComposerProps) {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string>('');
  const [message, setMessage] = useState('');
  const [xpCost, setXpCost] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_query: '',
        limit_count: 50,
        offset_count: 0
      });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCreators = async (query: string) => {
    if (!query.trim()) {
      fetchCreators();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_query: query,
        limit_count: 20,
        offset_count: 0
      });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error searching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreator || !message.trim() || !user) return;

    setSending(true);
    try {
      // Use the secure function to send message
      const { data, error } = await supabase.rpc('send_message_with_xp', {
        recipient_id_param: selectedCreator,
        content_param: message.trim(),
        xp_cost_param: xpCost
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Your message has been sent to the creator."
      });

      // Reset form
      setSelectedCreator('');
      setMessage('');
      setXpCost(50);
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const filteredCreators = creators.filter(creator =>
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <form onSubmit={handleSendMessage} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search-creators">Search Creators</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-creators"
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchCreators(e.target.value);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="creator-select">Select Creator</Label>
        <Select value={selectedCreator} onValueChange={setSelectedCreator}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a creator to message" />
          </SelectTrigger>
          <SelectContent>
            {filteredCreators.map((creator) => (
              <SelectItem key={creator.user_id} value={creator.user_id}>
                <div className="flex items-center gap-2">
                  {creator.avatar_url ? (
                    <img 
                      src={creator.avatar_url} 
                      alt={creator.display_name || creator.username}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                  <span>{creator.display_name || creator.username}</span>
                  <VerificationBadge 
                    isVerified={!!creator.creator_type}
                    followerCount={creator.follower_count || 0}
                    size="sm"
                  />
                  <span className="text-muted-foreground">@{creator.username}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="xp-cost">XP Cost</Label>
        <Select value={xpCost.toString()} onValueChange={(value) => setXpCost(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 XP - Basic message</SelectItem>
            <SelectItem value="50">50 XP - Standard message</SelectItem>
            <SelectItem value="100">100 XP - Priority message</SelectItem>
            <SelectItem value="200">200 XP - VIP message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message-content">Message</Label>
        <Textarea
          id="message-content"
          placeholder="Write your message to the creator..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Your message will be sent for {xpCost} XP. 
            The creator can approve or decline your message. XP is only deducted when you send the message.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={!selectedCreator || !message.trim() || sending}>
          <Send className="h-4 w-4 mr-2" />
          {sending ? "Sending..." : `Send Message (${xpCost} XP)`}
        </Button>
      </div>
    </form>
  );
}