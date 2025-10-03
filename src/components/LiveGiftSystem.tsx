import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealtimeXP } from '@/hooks/useRealtimeXP';
import { useToast } from '@/hooks/use-toast';
import { Gift, Sparkles, Crown, Star } from 'lucide-react';
import * as Icons from 'lucide-react';

interface GiftType {
  id: string;
  name: string;
  icon_name: string;
  xp_cost: number;
  animation_type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LiveGiftSystemProps {
  streamId: string;
  creatorId: string;
  creatorType: string;
  onGiftSent?: () => void;
}

export function LiveGiftSystem({
  streamId,
  creatorId,
  creatorType,
  onGiftSent
}: LiveGiftSystemProps) {
  const { user } = useAuth();
  const { xpBalance } = useRealtimeXP();
  const { toast } = useToast();

  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [recentGifts, setRecentGifts] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchGifts();
    fetchRecentGifts();
    setupRealtimeGifts();
  }, [creatorType, streamId]);

  const fetchGifts = async () => {
    const { data } = await supabase
      .from('gift_types')
      .select('*')
      .eq('creator_type', creatorType)
      .order('xp_cost', { ascending: true });

    if (data) {
      const typedGifts = data.map(g => ({
        ...g,
        rarity: g.rarity as 'common' | 'rare' | 'epic' | 'legendary'
      }));
      setGifts(typedGifts);
    }
  };

  const fetchRecentGifts = async () => {
    const { data } = await supabase
      .from('live_stream_gifts')
      .select(`
        *,
        sender:profiles!sender_id(display_name, username, avatar_url)
      `)
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setRecentGifts(data);
  };

  const setupRealtimeGifts = () => {
    const channel = supabase
      .channel(`gifts-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_stream_gifts',
          filter: `stream_id=eq.${streamId}`
        },
        (payload) => {
          fetchRecentGifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendGift = async () => {
    if (!user || !selectedGift) return;

    if (xpBalance < selectedGift.xp_cost) {
      toast({
        title: 'Insufficient XP',
        description: 'You need more XP to send this gift',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-live-gift', {
        body: {
          streamId,
          creatorId,
          giftType: selectedGift.name,
          giftValue: selectedGift.xp_cost,
          message: message.trim() || null
        }
      });

      if (error) throw error;

      toast({
        title: 'Gift Sent! 🎁',
        description: `You sent ${selectedGift.name} to the creator`
      });

      setMessage('');
      setSelectedGift(null);
      onGiftSent?.();
    } catch (error: any) {
      console.error('Error sending gift:', error);
      toast({
        title: 'Error',
        description: 'Failed to send gift',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-8 w-8" /> : <Gift className="h-8 w-8" />;
  };

  return (
    <Card className="h-[calc(100vh-200px)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Send Gifts</span>
          <Badge variant="secondary">{xpBalance} XP</Badge>
        </CardTitle>
      </CardHeader>

      <Tabs defaultValue="gifts" className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mx-4">
          <TabsTrigger value="gifts">Gifts</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="gifts" className="flex-1">
          <ScrollArea className="h-[calc(100vh-400px)] px-4">
            <div className="grid grid-cols-2 gap-3">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedGift?.id === gift.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-full ${getRarityColor(gift.rarity)}`}>
                      {getIcon(gift.icon_name)}
                    </div>
                    <p className="font-semibold text-sm text-center">{gift.name}</p>
                    <Badge variant="outline">{gift.xp_cost} XP</Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {selectedGift && (
            <CardContent className="space-y-3 border-t pt-4">
              <Input
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={100}
              />
              <Button
                onClick={sendGift}
                disabled={sending || xpBalance < selectedGift.xp_cost}
                className="w-full"
              >
                Send {selectedGift.name} ({selectedGift.xp_cost} XP)
              </Button>
            </CardContent>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <ScrollArea className="h-[calc(100vh-350px)] px-4">
            <div className="space-y-3">
              {recentGifts.map((gift) => (
                <div key={gift.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {gift.is_anonymous ? 'Anonymous' : gift.sender?.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{gift.gift_type}</p>
                    {gift.message && (
                      <p className="text-xs mt-1">{gift.message}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{gift.gift_value_xp} XP</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
