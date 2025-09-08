import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Music, Users, DollarSign, TrendingUp, Plus, BarChart3, Settings, Target, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreatorDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with real data from your API
  const totalFans = 2847;
  const totalXPDistributed = 45650;
  const activeCampaigns = 8;
  const totalRevenue = 1234.56;
  const conversionRate = 12.5;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your campaigns and engage with fans</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/campaigns')} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
            <Button variant="outline" onClick={() => navigate('/universal-profile')}>
              Profile
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fans</p>
                  <p className="text-2xl font-bold">{totalFans.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">XP Distributed</p>
                  <p className="text-2xl font-bold">{totalXPDistributed.toLocaleString()}</p>
                </div>
                <div className="xp-orb"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold">{activeCampaigns}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-2xl font-bold">{conversionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Campaigns */}
            <Card className="card-modern">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Active Campaigns
                  </CardTitle>
                  <Button size="sm" onClick={() => navigate('/campaigns')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample Campaign */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Music className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Stream "New Album" Campaign</p>
                        <p className="text-sm text-muted-foreground">647 participants • 4 days left</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-success/20 text-success">Active</Badge>
                      <p className="text-sm text-muted-foreground mt-1">12.4k XP distributed</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Social Media Share Challenge</p>
                        <p className="text-sm text-muted-foreground">234 participants • 7 days left</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-success/20 text-success">Active</Badge>
                      <p className="text-sm text-muted-foreground mt-1">5.8k XP distributed</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Merchandise Promotion</p>
                        <p className="text-sm text-muted-foreground">0 participants • Draft</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Draft</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Not started</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Overview */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">847</div>
                    <p className="text-sm text-muted-foreground">New Fans This Week</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">23.4k</div>
                    <p className="text-sm text-muted-foreground">Streams Generated</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface">
                    <div className="stat-number">156</div>
                    <p className="text-sm text-muted-foreground">Social Shares</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Contributors This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['SuperFan23', 'MusicLover99', 'StreamKing', 'FanGirl47', 'MelodyMaster'].map((fan, index) => (
                    <div key={fan} className="leaderboard-item">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{fan.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{fan}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{(2500 - index * 300)} XP</p>
                        <p className="text-xs text-muted-foreground">{15 - index * 2} campaigns</p>
                      </div>
                    </div>
                  ))}
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
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
                <Button className="w-full" variant="outline">
                  <Gift className="h-4 w-4 mr-2" />
                  Manage Rewards
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate('/campaigns')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View All Campaigns
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </CardContent>
            </Card>

            {/* AI Tools */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-primary"></div>
                  AI Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  🤖 AI Campaign Builder
                </Button>
                <Button className="w-full" variant="outline">
                  ✨ Content Assistant
                </Button>
                <Button className="w-full" variant="outline">
                  🎤 Shoutout Generator
                </Button>
                <Button className="w-full" variant="outline">
                  📊 Sentiment Analysis
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>New fan joined campaign</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>1,250 XP distributed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-brand-accent rounded-full"></div>
                    <span>Campaign milestone reached</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span>Reward inventory low</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fan Growth</span>
                    <span className="text-sm font-medium text-success">+12.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Engagement</span>
                    <span className="text-sm font-medium text-success">+8.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">XP Efficiency</span>
                    <span className="text-sm font-medium text-primary">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium text-success">+15.7%</span>
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

export default CreatorDashboard;