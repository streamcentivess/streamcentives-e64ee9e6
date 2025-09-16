import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users } from 'lucide-react';

interface Fan {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  country_name: string;
  total_xp_earned: number;
  total_listens: number;
  last_activity_at: string;
}

interface FanSelectorProps {
  selectedFan: Fan | null;
  onFanSelect: (fan: Fan) => void;
}

export function FanSelector({ selectedFan, onFanSelect }: FanSelectorProps) {
  const { user } = useAuth();
  const [fans, setFans] = useState<Fan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCreatorFans();
    }
  }, [user]);

  const loadCreatorFans = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get fans from leaderboards (fans who have interacted with this creator)
      const { data: leaderboardData } = await supabase
        .from('creator_fan_leaderboards')
        .select(`
          fan_user_id,
          total_xp_earned,
          total_listens,
          last_activity_at
        `)
        .eq('creator_user_id', user.id)
        .order('total_xp_earned', { ascending: false })
        .limit(50);

      if (!leaderboardData || leaderboardData.length === 0) {
        setFans([]);
        return;
      }

      // Get fan profile details
      const fanIds = leaderboardData.map(l => l.fan_user_id);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio, country_name')
        .in('user_id', fanIds);

      // Combine leaderboard and profile data
      const fansWithData = leaderboardData.map(leaderboard => {
        const profile = profileData?.find(p => p.user_id === leaderboard.fan_user_id);
        return {
          user_id: leaderboard.fan_user_id,
          username: profile?.username || `user_${leaderboard.fan_user_id.slice(0, 8)}`,
          display_name: profile?.display_name || profile?.username || 'Unknown User',
          avatar_url: profile?.avatar_url || '',
          bio: profile?.bio || '',
          country_name: profile?.country_name || '',
          total_xp_earned: leaderboard.total_xp_earned,
          total_listens: leaderboard.total_listens,
          last_activity_at: leaderboard.last_activity_at
        };
      });

      setFans(fansWithData);
    } catch (error) {
      console.error('Error loading fans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFans = fans.filter(fan =>
    fan.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fan.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your fans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedFan && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedFan.avatar_url} />
                <AvatarFallback>{selectedFan.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{selectedFan.display_name}</h3>
                  <Badge variant="secondary">Selected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">@{selectedFan.username}</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {selectedFan.total_xp_earned.toLocaleString()} XP earned
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedFan.total_listens} listens
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="max-h-64 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredFans.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {fans.length === 0 ? "No fans found. Fans appear here after they interact with your campaigns." : "No fans match your search."}
            </p>
          </div>
        ) : (
          filteredFans.map((fan) => (
            <Card 
              key={fan.user_id}
              className={`cursor-pointer transition-colors hover:bg-surface ${
                selectedFan?.user_id === fan.user_id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onFanSelect(fan)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={fan.avatar_url} />
                    <AvatarFallback>{fan.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{fan.display_name}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {fan.total_xp_earned.toLocaleString()} XP
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">@{fan.username}</p>
                    {fan.country_name && (
                      <p className="text-xs text-muted-foreground">{fan.country_name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}