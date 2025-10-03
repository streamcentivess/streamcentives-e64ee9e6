import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Gift, Eye } from 'lucide-react';
import { LiveStreamPlayer } from '@/components/LiveStreamPlayer';
import { LiveGiftSystem } from '@/components/LiveGiftSystem';
import { LiveChat } from '@/components/LiveChat';

interface LiveStream {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: string;
  viewer_count: number;
  total_gifts_received: number;
  total_xp_earned: number;
  hls_url: string | null;
  creator: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    creator_type: string | null;
  };
}

export default function LiveStream() {
  const { streamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (streamId) {
      fetchStream();
      setupRealtimeUpdates();
    }
  }, [streamId]);

  const fetchStream = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          creator:profiles!creator_id(display_name, username, avatar_url, creator_type)
        `)
        .eq('id', streamId)
        .single();

      if (error) throw error;

      setStream(data as any);

      // Track viewer
      if (user) {
        await supabase.from('live_stream_viewers').upsert({
          stream_id: streamId,
          user_id: user.id,
          joined_at: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Error fetching stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stream',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    const channel = supabase
      .channel(`live-stream-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
          filter: `id=eq.${streamId}`
        },
        (payload) => {
          if (payload.new) {
            setStream(prev => prev ? { ...prev, ...payload.new as any } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-muted-foreground">Stream not found</p>
        <Button onClick={() => navigate('/feed')}>Back to Feed</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/feed')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={stream.creator.avatar_url || undefined} />
                <AvatarFallback>{stream.creator.display_name?.[0] || 'C'}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{stream.creator.display_name}</h2>
                <p className="text-sm text-muted-foreground">@{stream.creator.username}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              LIVE
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{stream.viewer_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Player and Chat */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Stream Player */}
          <div className="lg:col-span-2 space-y-4">
            <LiveStreamPlayer
              streamUrl={stream.hls_url || ''}
              streamId={stream.id}
            />

            {/* Stream Info */}
            <Card className="p-4">
              <h1 className="text-2xl font-bold mb-2">{stream.title}</h1>
              {stream.description && (
                <p className="text-muted-foreground">{stream.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{stream.viewer_count}</span>
                  <span className="text-sm text-muted-foreground">viewers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{stream.total_gifts_received}</span>
                  <span className="text-sm text-muted-foreground">gifts</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Live Chat */}
            <LiveChat
              streamId={stream.id}
              creatorId={stream.creator_id}
            />

            {/* Gift System */}
            <LiveGiftSystem
              streamId={stream.id}
              creatorId={stream.creator_id}
              creatorType={stream.creator.creator_type || 'music'}
              onGiftSent={() => {
                toast({
                  title: 'Gift Sent! 🎁',
                  description: 'Your gift has been delivered'
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
