import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Gift, Star, Eye, Clock, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Shoutout {
  id: string;
  creator_id: string;
  fan_display_name: string;
  fan_username: string;
  achievement_text: string;
  achievements_data: any[];
  shoutout_text: string;
  tone: string;
  reward_id: string | null;
  reward_data: any | null;
  is_sent: boolean;
  sent_at: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface FanShoutoutsProps {
  className?: string;
}

export function FanShoutouts({ className }: FanShoutoutsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user) {
      loadShoutouts();
    }
  }, [user]);

  // Set up real-time updates for new shoutouts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('fan-shoutouts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shoutouts',
        filter: `fan_id=eq.${user.id}`
      }, (payload) => {
        console.log('New shoutout received:', payload);
        loadShoutouts(); // Refresh the list
        toast({
          title: "New Shoutout!",
          description: "You received a new shoutout from a creator",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const loadShoutouts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('shoutouts')
        .select('*')
        .eq('fan_id', user.id)
        .eq('is_sent', true)
        .order('sent_at', { ascending: false });

      const shoutoutsData = (data || []) as Shoutout[];
      setShoutouts(shoutoutsData);

      // Load creator profiles
      const creatorIds = [...new Set(shoutoutsData.map(s => s.creator_id))];
      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', creatorIds);

        const profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, any>);

        setCreatorProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error loading shoutouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (shoutoutId: string) => {
    try {
      await supabase
        .from('shoutouts')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', shoutoutId);

      setShoutouts(prev => prev.map(s => 
        s.id === shoutoutId 
          ? { ...s, is_read: true, read_at: new Date().toISOString() }
          : s
      ));
    } catch (error) {
      console.error('Error marking shoutout as read:', error);
    }
  };

  const unreadCount = shoutouts.filter(s => !s.is_read).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Fan Love Messages
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shoutouts.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Shoutouts Yet</h3>
            <p className="text-sm text-muted-foreground">
              When creators send you shoutouts, they'll appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {shoutouts.map((shoutout) => {
              const creator = creatorProfiles[shoutout.creator_id];
              const isUnread = !shoutout.is_read;

              return (
                <div
                  key={shoutout.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isUnread ? 'bg-primary/5 border-primary/30' : 'bg-surface border-border'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Creator Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={creator?.avatar_url} />
                          <AvatarFallback>
                            {creator?.display_name?.slice(0, 2).toUpperCase() || 'CR'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">
                            {creator?.display_name || 'Creator'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            @{creator?.username || 'creator'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(shoutout.sent_at), { addSuffix: true })}
                        </Badge>
                      </div>
                    </div>

                    {/* Shoutout Content */}
                    <div className="bg-background/50 p-3 rounded-md">
                      <p className="text-sm leading-relaxed">{shoutout.shoutout_text}</p>
                    </div>

                    {/* Achievement Context */}
                    {shoutout.achievement_text && (
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Celebrating: {shoutout.achievement_text}
                        </p>
                      </div>
                    )}

                    {/* Attached Reward */}
                    {shoutout.reward_data && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                        <Gift className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          Reward: {shoutout.reward_data.title}
                        </span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {shoutout.reward_data.xp_cost 
                            ? `${shoutout.reward_data.xp_cost} XP` 
                            : `$${shoutout.reward_data.cash_price}`
                          }
                        </Badge>
                      </div>
                    )}

                    {/* Action Button */}
                    {isUnread && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => markAsRead(shoutout.id)}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}