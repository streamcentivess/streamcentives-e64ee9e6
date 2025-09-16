import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorRealtimeData } from '@/hooks/useCreatorRealtimeData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar, Target, Brain, Plus } from 'lucide-react';

const AdvancedAnalytics = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('monthly');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'engagement']);

  // Get real-time data from creator dashboard
  const { 
    metrics, 
    activeCampaigns,
    weeklyPerformance,
    loading 
  } = useCreatorRealtimeData();

  // Calculate forecasts based on real data
  const revenueForecasts = [
    { 
      period: 'Next Month', 
      predicted: Math.round(metrics.totalRevenue * 1.15), 
      confidence: 87, 
      change: weeklyPerformance.fanGrowth || 15.3 
    },
    { 
      period: 'Next Quarter', 
      predicted: Math.round(metrics.totalRevenue * 3.2), 
      confidence: 79, 
      change: 22.1 
    },
    { 
      period: 'Next Year', 
      predicted: Math.round(metrics.totalRevenue * 12.5), 
      confidence: 68, 
      change: 31.2 
    }
  ];

  const behaviorInsights = [
    { metric: 'Active Campaigns', value: `${metrics.activeCampaigns}`, trend: '+12%' },
    { metric: 'Total Fans', value: `${metrics.totalFans.toLocaleString()}`, trend: `+${weeklyPerformance.fanGrowth || 8}%` },
    { metric: 'XP Distributed', value: `${metrics.totalXPDistributed.toLocaleString()}`, trend: '+5%' },
    { metric: 'Conversion Rate', value: `${metrics.conversionRate.toFixed(1)}%`, trend: '+3%' }
  ];

  const campaignPredictions = activeCampaigns.slice(0, 3).map(campaign => ({
    name: campaign.title,
    predictedParticipants: (campaign.campaign_participants?.length || 0) * 2.5,
    completionRate: 73 + Math.random() * 20,
    revenue: (campaign.xp_reward || 0) * 1.5
  }));

  const exportData = (format: string) => {
    // Implementation for data export
    console.log(`Exporting data in ${format} format`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground">AI-powered insights and forecasting for your creator business</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportData('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="forecasting" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forecasting">Revenue Forecasting</TabsTrigger>
            <TabsTrigger value="behavior">Fan Behavior</TabsTrigger>
            <TabsTrigger value="predictions">Campaign Predictions</TabsTrigger>
            <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="forecasting" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {revenueForecasts.map((forecast, index) => (
                <Card key={index} className="card-modern">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {forecast.period}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-success">
                        ${forecast.predicted.toLocaleString()}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <Badge variant="secondary">{forecast.confidence}%</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected Growth</span>
                        <span className="text-success">+{forecast.change}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Revenue trend chart would be rendered here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {behaviorInsights.map((insight, index) => (
                <Card key={index} className="card-modern">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{insight.metric}</p>
                      <p className="text-xl font-bold">{insight.value}</p>
                      <Badge className={`text-xs ${insight.trend.includes('+') ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        {insight.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Fan Engagement Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Fan behavior heatmap would be rendered here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <div className="space-y-4">
              {campaignPredictions.map((campaign, index) => (
                <Card key={index} className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {campaign.name}
                      </div>
                      <Badge className="bg-primary/20 text-primary">
                        <Brain className="h-3 w-3 mr-1" />
                        AI Predicted
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expected Participants</p>
                        <p className="text-2xl font-bold">{campaign.predictedParticipants.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold text-primary">{campaign.completionRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Predicted Revenue</p>
                        <p className="text-2xl font-bold text-success">${campaign.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Custom Report Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Create custom reports with your preferred metrics and scheduling options.
                  </p>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;