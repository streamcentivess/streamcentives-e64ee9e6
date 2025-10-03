import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Crown, Medal, Star, ArrowLeft, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  user: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  total_xp: number;
  total_spent: number;
  creator_count: number;
}

export default function GlobalLeaderboard() {
  const navigate = useNavigate();
  const [topSupporters, setTopSupporters] = useState<LeaderboardEntry[]>([]);
  const [topSpenders, setTopSpenders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
    setupRealtimeUpdates();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // Fetch top supporters by total XP earned
      const { data: supportersData } = await supabase
        .from('user_xp_balances')
        .select(`
          user_id,
          total_earned_xp,
          profiles!inner(username, display_name, avatar_url)
        `)
        .order('total_earned_xp', { ascending: false })
        .limit(100);

      // Fetch top spenders by total XP spent
      const { data: spendersData } = await supabase
        .from('user_xp_balances')
        .select(`
          user_id,
          total_spent_xp,
          profiles!inner(username, display_name, avatar_url)
        `)
        .order('total_spent_xp', { ascending: false })
        .limit(100);

      // Format supporters data
      if (supportersData) {
        const formatted = supportersData.map((entry: any, index) => ({
          rank: index + 1,
          user: {
            user_id: entry.user_id,
            username: entry.profiles.username,
            display_name: entry.profiles.display_name,
            avatar_url: entry.profiles.avatar_url
          },
          total_xp: entry.total_earned_xp,
          total_spent: 0,
          creator_count: 0
        }));
        setTopSupporters(formatted);
      }

      // Format spenders data
      if (spendersData) {
        const formatted = spendersData.map((entry: any, index) => ({
          rank: index + 1,
          user: {
            user_id: entry.user_id,
            username: entry.profiles.username,
            display_name: entry.profiles.display_name,
            avatar_url: entry.profiles.avatar_url
          },
          total_xp: 0,
          total_spent: entry.total_spent_xp,
          creator_count: 0
        }));
        setTopSpenders(formatted);
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    const channel = supabase
      .channel('global-leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_xp_balances'
        },
        () => {
          fetchLeaderboards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Trophy className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    if (rank <= 10) return 'outline';
    return 'outline';
  };

  const LeaderboardList = ({ entries, type }: { entries: LeaderboardEntry[]; type: 'supporters' | 'spenders' }) => (
    <div className="space-y-3">
      {entries.map((entry) => (
        <motion.div
          key={entry.user.user_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: entry.rank * 0.02 }}
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/${entry.user.username}`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  {getRankIcon(entry.rank)}
                  <Badge variant={getRankBadge(entry.rank)}>#{entry.rank}</Badge>
                </div>

                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.user.avatar_url || undefined} />
                  <AvatarFallback>
                    {entry.user.display_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.user.display_name}</p>
                  <p className="text-sm text-muted-foreground truncate">@{entry.user.username}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg">
                    {(type === 'supporters' ? entry.total_xp : entry.total_spent).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">XP {type === 'supporters' ? 'Earned' : 'Spent'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Global Leaderboards</h1>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="supporters" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supporters">Top Supporters</TabsTrigger>
            <TabsTrigger value="spenders">Top Spenders</TabsTrigger>
          </TabsList>

          <TabsContent value="supporters" className="mt-6">
            <LeaderboardList entries={topSupporters} type="supporters" />
          </TabsContent>

          <TabsContent value="spenders" className="mt-6">
            <LeaderboardList entries={topSpenders} type="spenders" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
