import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Star, Gift, Target, Music, Users, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FanDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with real data from your API
  const xpBalance = 1250;
  const nextTierXP = 2000;
  const currentRank = 47;
  const totalFans = 1234;
  const completedCampaigns = 12;
  const activeQuests = 3;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Fan Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/universal-profile')}>
              Profile
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-2xl font-bold text-primary">{xpBalance.toLocaleString()}</p>
                </div>
                <div className="xp-orb"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Global Rank</p>
                  <p className="text-2xl font-bold">#{currentRank}</p>
                </div>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{completedCampaigns}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Quests</p>
                  <p className="text-2xl font-bold">{activeQuests}</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress to Next Tier */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress to Silver Tier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{xpBalance} XP</span>
                    <span>{nextTierXP} XP</span>
                  </div>
                  <Progress value={(xpBalance / nextTierXP) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {nextTierXP - xpBalance} XP until Silver Tier
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active Campaigns */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample Campaign */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder-artist.jpg" />
                        <AvatarFallback>AR</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Stream "New Song" 10 times</p>
                        <p className="text-sm text-muted-foreground">By Artist Name</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary/20 text-primary">+500 XP</Badge>
                      <p className="text-sm text-muted-foreground mt-1">7/10 streams</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder-artist2.jpg" />
                        <AvatarFallback>MU</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Share album on social media</p>
                        <p className="text-sm text-muted-foreground">By Music Artist</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary/20 text-primary">+250 XP</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Pending</p>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-primary hover:opacity-90">
                    View All Campaigns
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Earned 100 XP from streaming</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm">Completed "Daily Listener" quest</span>
                    </div>
                    <span className="text-xs text-muted-foreground">1 hour ago</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-accent rounded-full"></div>
                      <span className="text-sm">Joined new campaign</span>
                    </div>
                    <span className="text-xs text-muted-foreground">3 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/campaigns')}>
                  <Target className="h-4 w-4 mr-2" />
                  Browse Campaigns
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate('/marketplace')}>
                  <Gift className="h-4 w-4 mr-2" />
                  Redeem Rewards
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate('/leaderboards')}>
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboards
                </Button>
              </CardContent>
            </Card>

            {/* Top Artists */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Top Supported Artists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AR</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">Artist Name</span>
                    </div>
                    <span className="text-sm text-primary">450 XP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>MU</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">Music Artist</span>
                    </div>
                    <span className="text-sm text-primary">320 XP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>SO</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">Singer One</span>
                    </div>
                    <span className="text-sm text-primary">280 XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-success/20 text-success">
                      <Star className="h-3 w-3 mr-1" />
                      First Campaign
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-brand-accent/20 text-brand-accent">
                      <Music className="h-3 w-3 mr-1" />
                      Stream Master
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-brand-secondary/20 text-brand-secondary">
                      <Users className="h-3 w-3 mr-1" />
                      Social Butterfly
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FanDashboard;