import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trophy, Crown, Medal, Star, Search, ArrowLeft, Users, Target, ShoppingBag, Music, Share, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  id: string;
  rank: number;
  user: {
    user_id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  value: number;
  change: number;
  badges: string[];
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  details?: {
    purchases?: number;
    streams?: number;
    shares?: number;
    cashSpent?: number;
  };
}

interface CreatorLeaderboard {
  id: string;
  creator: {
    user_id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  categories: {
    merchMonster: LeaderboardEntry[];
    replayAddict: LeaderboardEntry[];
    streetTeam: LeaderboardEntry[];
    bigSpender: LeaderboardEntry[];
  };
  totalXPDistributed: number;
  totalFans: number;
}

const Leaderboards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('all');
  const [activeCategory, setActiveCategory] = useState('merchMonster');
  const [loading, setLoading] = useState(true);
  
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [creatorLeaderboards, setCreatorLeaderboards] = useState<CreatorLeaderboard[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [currentUserStats, setCurrentUserStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchLeaderboards();
      fetchCreators();
      fetchUserStats();
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscriptions
    const channels = [
      supabase
        .channel('leaderboard-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'creator_fan_leaderboards' }, 
          () => fetchLeaderboards()
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'campaign_purchases' }, 
          () => fetchLeaderboards()
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'post_shares' }, 
          () => fetchLeaderboards()
        )
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .limit(50);

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      const { data: xpData } = await supabase
        .from('user_xp_balances')
        .select('current_xp, total_earned_xp')
        .eq('user_id', user.id)
        .single();

      const { data: leaderboardData } = await supabase
        .from('creator_fan_leaderboards')
        .select('total_xp_earned')
        .eq('fan_user_id', user.id);

      const totalXP = leaderboardData?.reduce((sum, entry) => sum + entry.total_xp_earned, 0) || 0;
      
      setCurrentUserStats({
        currentXP: xpData?.current_xp || 0,
        totalEarnedXP: totalXP,
        rank: 47 // Placeholder - would need complex query to calculate real rank
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      
      // Fetch creator leaderboards with category data
      const { data: leaderboardData, error } = await supabase
        .from('creator_fan_leaderboards')
        .select(`
          *,
          creator:profiles!creator_user_id(user_id, username, display_name, avatar_url),
          fan:profiles!fan_user_id(user_id, username, display_name, avatar_url)
        `)
        .order('total_xp_earned', { ascending: false });

      if (error) throw error;

      // Transform data into categories
      const creatorMap = new Map<string, CreatorLeaderboard>();
      
      (leaderboardData || []).forEach((entry: any) => {
        const creatorId = entry.creator_user_id;
        
        if (!creatorMap.has(creatorId)) {
          creatorMap.set(creatorId, {
            id: creatorId,
            creator: {
              user_id: entry.creator.user_id,
              name: entry.creator.display_name || entry.creator.username,
              username: entry.creator.username,
              avatar: entry.creator.avatar_url || '',
              verified: true // You might want to add a verified field to profiles
            },
            categories: {
              merchMonster: [],
              replayAddict: [],
              streetTeam: [],
              bigSpender: []
            },
            totalXPDistributed: 0,
            totalFans: 0
          });
        }

        const creatorBoard = creatorMap.get(creatorId)!;
        const fanEntry: LeaderboardEntry = {
          id: entry.fan_user_id,
          rank: 0, // Will be calculated after sorting
          user: {
            user_id: entry.fan.user_id,
            name: entry.fan.display_name || entry.fan.username,
            username: entry.fan.username,
            avatar: entry.fan.avatar_url || '',
            verified: false
          },
          value: entry.total_xp_earned,
          change: 0,
          badges: [],
          tier: getTierFromXP(entry.total_xp_earned),
          details: {
            streams: entry.total_listens,
            purchases: 0, // Would need to fetch from campaign_purchases
            shares: 0, // Would need to fetch from post_shares
            cashSpent: 0 // Would need to fetch from revenue data
          }
        };

        // Categorize based on activity (simplified logic)
        if (entry.total_listens > 100) {
          creatorBoard.categories.replayAddict.push(fanEntry);
        }
        if (entry.total_xp_earned > 1000) {
          creatorBoard.categories.bigSpender.push({ ...fanEntry, value: entry.total_xp_earned });
        }
        
        creatorBoard.totalXPDistributed += entry.total_xp_earned;
        creatorBoard.totalFans++;
      });

      // Convert map to array and sort categories
      const creatorBoards = Array.from(creatorMap.values()).map(board => ({
        ...board,
        categories: {
          merchMonster: board.categories.merchMonster.sort((a, b) => b.value - a.value).map((entry, index) => ({ ...entry, rank: index + 1 })),
          replayAddict: board.categories.replayAddict.sort((a, b) => (b.details?.streams || 0) - (a.details?.streams || 0)).map((entry, index) => ({ ...entry, rank: index + 1 })),
          streetTeam: board.categories.streetTeam.sort((a, b) => (b.details?.shares || 0) - (a.details?.shares || 0)).map((entry, index) => ({ ...entry, rank: index + 1 })),
          bigSpender: board.categories.bigSpender.sort((a, b) => b.value - a.value).map((entry, index) => ({ ...entry, rank: index + 1 }))
        }
      }));

      setCreatorLeaderboards(creatorBoards);
      
      // Create global leaderboard from all fans
      const allFans = leaderboardData?.map((entry: any, index: number) => ({
        id: entry.fan_user_id,
        rank: index + 1,
        user: {
          user_id: entry.fan.user_id,
          name: entry.fan.display_name || entry.fan.username,
          username: entry.fan.username,
          avatar: entry.fan.avatar_url || '',
          verified: false
        },
        value: entry.total_xp_earned,
        change: 0,
        badges: getBadgesForXP(entry.total_xp_earned),
        tier: getTierFromXP(entry.total_xp_earned)
      })) || [];

      setGlobalLeaderboard(allFans.slice(0, 50));
      
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierFromXP = (xp: number): LeaderboardEntry['tier'] => {
    if (xp >= 10000) return 'diamond';
    if (xp >= 5000) return 'platinum';
    if (xp >= 2000) return 'gold';
    if (xp >= 500) return 'silver';
    return 'bronze';
  };

  const getBadgesForXP = (xp: number): string[] => {
    const badges: string[] = [];
    if (xp >= 10000) badges.push('💎');
    if (xp >= 5000) badges.push('🏆');
    if (xp >= 2000) badges.push('🥇');
    if (xp >= 1000) badges.push('⭐');
    return badges;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'text-cyan-400';
      case 'platinum': return 'text-slate-300';
      case 'gold': return 'text-yellow-500';
      case 'silver': return 'text-gray-400';
      case 'bronze': return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond': return '💎';
      case 'platinum': return '🏆';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '⭐';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'merchMonster': return <ShoppingBag className="h-5 w-5 text-purple-500" />;
      case 'replayAddict': return <Music className="h-5 w-5 text-green-500" />;
      case 'streetTeam': return <Share className="h-5 w-5 text-blue-500" />;
      case 'bigSpender': return <DollarSign className="h-5 w-5 text-yellow-500" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'merchMonster': return 'Merch Monsters';
      case 'replayAddict': return 'Replay Addicts';
      case 'streetTeam': return 'Street Team';
      case 'bigSpender': return 'Big Spenders';
      default: return 'Category';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'merchMonster': return 'Top merchandise purchasers';
      case 'replayAddict': return 'Most song streams and replays';
      case 'streetTeam': return 'Leading content sharers and promoters';
      case 'bigSpender': return 'Highest cash purchase amounts';
      default: return 'Category description';
    }
  };

  const filteredCreators = useMemo(() => {
    return creatorLeaderboards.filter(board => 
      searchTerm === '' || 
      board.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.creator.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [creatorLeaderboards, searchTerm]);

  const selectedCreatorBoard = useMemo(() => {
    if (selectedCreator === 'all') return null;
    return creatorLeaderboards.find(board => board.creator.user_id === selectedCreator);
  }, [creatorLeaderboards, selectedCreator]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Leaderboards
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time fan rankings across all creators and categories
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Current User Stats */}
        {user && currentUserStats && (
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Your Current Rank</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">#{currentUserStats.rank}</span>
                  </div>
                  <p className="text-sm text-primary font-semibold">
                    {currentUserStats.totalEarnedXP.toLocaleString()} XP Total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creator Search */}
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {creators.map((creator) => (
                    <SelectItem key={creator.user_id} value={creator.user_id}>
                      <div className="flex items-center gap-2">
                        {creator.avatar_url && (
                          <img 
                            src={creator.avatar_url} 
                            alt={creator.display_name || creator.username} 
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span>{creator.display_name || creator.username}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="global">Global Rankings</TabsTrigger>
            <TabsTrigger value="creators">By Creator</TabsTrigger>
          </TabsList>
          
          {/* Global Leaderboard */}
          <TabsContent value="global" className="mt-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Global Leaderboard - {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading leaderboards...
                  </div>
                ) : (
                  <div className="space-y-0">
                    {globalLeaderboard.slice(0, 20).map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                          index < globalLeaderboard.length - 1 ? 'border-b border-border/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8">
                            {getRankIcon(entry.rank)}
                          </div>
                          
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={entry.user.avatar} />
                            <AvatarFallback>{entry.user.name[0]}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{entry.user.name}</span>
                              {entry.user.verified && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  ✓
                                </Badge>
                              )}
                              <span className={`text-sm ${getTierColor(entry.tier)}`}>
                                {getTierIcon(entry.tier)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {entry.value.toLocaleString()} XP
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {entry.badges.map((badge, badgeIndex) => (
                            <span key={badgeIndex} className="text-lg">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Creator Leaderboards */}
          <TabsContent value="creators" className="mt-6">
            {selectedCreatorBoard ? (
              <div className="space-y-6">
                {/* Creator Header */}
                <Card className="card-modern">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedCreatorBoard.creator.avatar} />
                          <AvatarFallback>{selectedCreatorBoard.creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {selectedCreatorBoard.creator.name}
                            {selectedCreatorBoard.creator.verified && (
                              <Badge variant="secondary" className="text-xs">
                                ✓
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {selectedCreatorBoard.totalFans.toLocaleString()} fans
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {selectedCreatorBoard.totalXPDistributed.toLocaleString()} XP distributed
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedCreator('all')}
                      >
                        View All Creators
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Category Tabs */}
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="merchMonster" className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Merch Monster
                    </TabsTrigger>
                    <TabsTrigger value="replayAddict" className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Replay Addict
                    </TabsTrigger>
                    <TabsTrigger value="streetTeam" className="flex items-center gap-2">
                      <Share className="h-4 w-4" />
                      Street Team
                    </TabsTrigger>
                    <TabsTrigger value="bigSpender" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Big Spender
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries(selectedCreatorBoard.categories).map(([category, entries]) => (
                    <TabsContent key={category} value={category} className="mt-6">
                      <Card className="card-modern">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {getCategoryTitle(category)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {getCategoryDescription(category)}
                          </p>
                        </CardHeader>
                        <CardContent className="p-0">
                          {entries.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                              No fans in this category yet
                            </div>
                          ) : (
                            <div className="space-y-0">
                              {entries.slice(0, 10).map((fan, index) => (
                                <div
                                  key={fan.id}
                                  className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                                    index < entries.length - 1 ? 'border-b border-border/50' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-6">
                                      {fan.rank <= 3 ? (
                                        getRankIcon(fan.rank)
                                      ) : (
                                        <span className="text-sm font-bold text-muted-foreground">
                                          #{fan.rank}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={fan.user.avatar} />
                                      <AvatarFallback className="text-xs">{fan.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{fan.user.name}</span>
                                        <span className={`text-xs ${getTierColor(fan.tier)}`}>
                                          {getTierIcon(fan.tier)}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {category === 'replayAddict' && `${fan.details?.streams || 0} streams`}
                                        {category === 'streetTeam' && `${fan.details?.shares || 0} shares`}
                                        {category === 'merchMonster' && `${fan.details?.purchases || 0} purchases`}
                                        {category === 'bigSpender' && `$${((fan.details?.cashSpent || 0) / 100).toFixed(2)} spent`}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="font-semibold text-primary">
                                      {fan.value.toLocaleString()} XP
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCreators.map((creatorBoard) => (
                  <Card key={creatorBoard.id} className="card-modern hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCreator(creatorBoard.creator.user_id)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={creatorBoard.creator.avatar} />
                            <AvatarFallback>{creatorBoard.creator.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {creatorBoard.creator.name}
                              {creatorBoard.creator.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  ✓
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {creatorBoard.totalFans.toLocaleString()} fans
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {creatorBoard.totalXPDistributed.toLocaleString()} XP
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Categories
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboards;