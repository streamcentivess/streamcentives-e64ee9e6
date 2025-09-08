import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Crown, Medal, Star, TrendingUp, ArrowLeft, Users, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  id: string;
  rank: number;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  xp: number;
  change: number; // Position change from previous period
  badges: string[];
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface CreatorLeaderboard {
  id: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  topFans: LeaderboardEntry[];
  totalXPDistributed: number;
  totalFans: number;
}

// Mock data - replace with real API calls
const globalLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    rank: 1,
    user: { name: 'SuperFan23', avatar: '/placeholder-user1.jpg', verified: true },
    xp: 125000,
    change: 0,
    badges: ['🏆', '🔥', '⭐'],
    tier: 'diamond'
  },
  {
    id: '2',
    rank: 2,
    user: { name: 'MusicLover99', avatar: '/placeholder-user2.jpg', verified: false },
    xp: 118500,
    change: 1,
    badges: ['🎵', '💎'],
    tier: 'diamond'
  },
  {
    id: '3',
    rank: 3,
    user: { name: 'StreamKing', avatar: '/placeholder-user3.jpg', verified: true },
    xp: 112300,
    change: -1,
    badges: ['👑', '🎧'],
    tier: 'platinum'
  },
  {
    id: '4',
    rank: 4,
    user: { name: 'BeatDropper', avatar: '/placeholder-user4.jpg', verified: false },
    xp: 97800,
    change: 2,
    badges: ['🎶', '🚀'],
    tier: 'platinum'
  },
  {
    id: '5',
    rank: 5,
    user: { name: 'VibeChaser', avatar: '/placeholder-user5.jpg', verified: false },
    xp: 89200,
    change: -1,
    badges: ['🌟'],
    tier: 'gold'
  }
];

const creatorLeaderboards: CreatorLeaderboard[] = [
  {
    id: '1',
    creator: { name: 'Luna Rodriguez', avatar: '/placeholder-artist.jpg', verified: true },
    totalXPDistributed: 456000,
    totalFans: 2847,
    topFans: [
      {
        id: '1',
        rank: 1,
        user: { name: 'LunaSuperfan', avatar: '/placeholder-fan1.jpg', verified: false },
        xp: 15600,
        change: 0,
        badges: ['🌙', '⭐'],
        tier: 'gold'
      },
      {
        id: '2',
        rank: 2,
        user: { name: 'MidnightDreamer', avatar: '/placeholder-fan2.jpg', verified: false },
        xp: 12800,
        change: 1,
        badges: ['🌙'],
        tier: 'silver'
      },
      {
        id: '3',
        rank: 3,
        user: { name: 'RodriguezFan4Life', avatar: '/placeholder-fan3.jpg', verified: false },
        xp: 11200,
        change: -1,
        badges: ['🎵'],
        tier: 'silver'
      }
    ]
  },
  {
    id: '2',
    creator: { name: 'DJ Cosmic', avatar: '/placeholder-dj.jpg', verified: true },
    totalXPDistributed: 298000,
    totalFans: 1923,
    topFans: [
      {
        id: '4',
        rank: 1,
        user: { name: 'CosmicVibes', avatar: '/placeholder-fan4.jpg', verified: false },
        xp: 18900,
        change: 0,
        badges: ['🌌', '🎧'],
        tier: 'gold'
      },
      {
        id: '5',
        rank: 2,
        user: { name: 'SpaceBeats', avatar: '/placeholder-fan5.jpg', verified: false },
        xp: 14300,
        change: 0,
        badges: ['🚀'],
        tier: 'silver'
      }
    ]
  }
];

const Leaderboards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedCreator, setSelectedCreator] = useState('all');
  
  // Mock current user position
  const currentUserRank = 47;
  const currentUserXP = 3500;

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

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return <span className="text-success text-xs">▲{change}</span>;
    } else if (change < 0) {
      return <span className="text-destructive text-xs">▼{Math.abs(change)}</span>;
    }
    return <span className="text-muted-foreground text-xs">-</span>;
  };

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
                  See how you rank against other fans and discover top supporters
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time Period" />
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
        {user && (
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
                    <span className="text-xl font-bold">#{currentUserRank}</span>
                  </div>
                  <p className="text-sm text-primary font-semibold">
                    {currentUserXP.toLocaleString()} XP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <div className="space-y-0">
                  {globalLeaderboard.map((entry, index) => (
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
                              {entry.xp.toLocaleString()} XP
                            </span>
                            {getChangeIndicator(entry.change)}
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
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Creator Leaderboards */}
          <TabsContent value="creators" className="mt-6">
            <div className="space-y-6">
              {creatorLeaderboards.map((creatorBoard) => (
                <Card key={creatorBoard.id} className="card-modern">
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
                              {creatorBoard.totalXPDistributed.toLocaleString()} XP distributed
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {creatorBoard.topFans.map((fan, index) => (
                        <div
                          key={fan.id}
                          className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                            index < creatorBoard.topFans.length - 1 ? 'border-b border-border/50' : ''
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
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {fan.xp.toLocaleString()} XP
                                </span>
                                {getChangeIndicator(fan.change)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {fan.badges.map((badge, badgeIndex) => (
                              <span key={badgeIndex} className="text-sm">
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboards;