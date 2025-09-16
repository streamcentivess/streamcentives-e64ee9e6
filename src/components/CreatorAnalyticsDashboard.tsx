import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, Users, DollarSign, MessageSquare, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AnalyticsData {
  totalFans: number;
  newFans: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalXpAwarded: number;
  totalCashAwarded: number;
  totalMessagesReceived: number;
  totalMessageRevenue: number;
  engagementRate: number;
}

interface RevenueTransaction {
  id: string;
  transaction_type: string;
  amount_total_cents?: number;
  currency: string;
  net_amount_cents: number;
  created_at: string;
  status: string;
  streamcentives_fee_cents?: number;
  stripe_session_id?: string;
  user_id: string;
  creator_id?: string;
  updated_at: string;
}

const CreatorAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date())
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch creator analytics summary
      const { data: analytics, error: analyticsError } = await supabase
        .from('creator_analytics')
        .select('*')
        .eq('creator_id', user.id)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Calculate aggregated metrics
      const aggregated = analytics?.reduce((acc, curr) => ({
        totalFans: Math.max(acc.totalFans, curr.total_fans || 0),
        newFans: acc.newFans + (curr.new_fans || 0),
        totalCampaigns: Math.max(acc.totalCampaigns, curr.total_campaigns || 0),
        activeCampaigns: Math.max(acc.activeCampaigns, curr.active_campaigns || 0),
        totalXpAwarded: acc.totalXpAwarded + (curr.total_xp_awarded || 0),
        totalCashAwarded: acc.totalCashAwarded + (curr.total_cash_awarded || 0),
        totalMessagesReceived: acc.totalMessagesReceived + (curr.total_messages_received || 0),
        totalMessageRevenue: acc.totalMessageRevenue + (curr.total_message_revenue_cents || 0),
        engagementRate: acc.engagementRate + (curr.engagement_rate || 0)
      }), {
        totalFans: 0,
        newFans: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalXpAwarded: 0,
        totalCashAwarded: 0,
        totalMessagesReceived: 0,
        totalMessageRevenue: 0,
        engagementRate: 0
      }) || {
        totalFans: 0,
        newFans: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalXpAwarded: 0,
        totalCashAwarded: 0,
        totalMessagesReceived: 0,
        totalMessageRevenue: 0,
        engagementRate: 0
      };

      // Calculate average engagement rate
      if (analytics && analytics.length > 0) {
        aggregated.engagementRate = aggregated.engagementRate / analytics.length;
      }

      setAnalyticsData(aggregated);

      // Fetch revenue transactions
      const { data: revenue, error: revenueError } = await supabase
        .from('revenue_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (revenueError) throw revenueError;
      setRevenueData(revenue || []);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyAnalytics = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase.rpc('calculate_creator_daily_analytics', {
        creator_user_id: user.id,
        target_date: format(new Date(), 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      toast.success('Analytics updated successfully');
      fetchAnalyticsData();
    } catch (error) {
      console.error('Error calculating analytics:', error);
      toast.error('Failed to update analytics');
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, dateRange]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const setQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'today':
        setDateRange({ from: now, to: now });
        break;
      case 'week':
        setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case '30days':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and earnings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={calculateDailyAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Analytics
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2">
          {['today', 'week', 'month', '30days'].map((range) => (
            <Button
              key={range}
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(range)}
              className="capitalize"
            >
              {range === '30days' ? '30 Days' : range}
            </Button>
          ))}
        </div>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fans</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.totalFans || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData?.newFans || 0} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Message Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData?.totalMessageRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {analyticsData?.totalMessagesReceived || 0} messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Distributed</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData?.totalXpAwarded || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across campaigns & activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.activeCampaigns || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {analyticsData?.totalCampaigns || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Message Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analyticsData?.totalMessageRevenue || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Campaign Rewards</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency((analyticsData?.totalCashAwarded || 0) * 100)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      (analyticsData?.totalMessageRevenue || 0) + 
                      ((analyticsData?.totalCashAwarded || 0) * 100)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions found for this period
                  </p>
                ) : (
                  revenueData.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium capitalize">
                          {transaction.transaction_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {formatCurrency(transaction.net_amount_cents)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {transaction.currency.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Messages Received</span>
                    <span className="font-bold">{analyticsData?.totalMessagesReceived || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">XP Distributed</span>
                    <span className="font-bold">{formatNumber(analyticsData?.totalXpAwarded || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="font-bold">{(analyticsData?.engagementRate || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Fans</span>
                    <span className="font-bold">{formatNumber(analyticsData?.totalFans || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New Fans</span>
                    <span className="font-bold text-green-600">+{analyticsData?.newFans || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Campaigns</span>
                    <span className="font-bold">{analyticsData?.activeCampaigns || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorAnalyticsDashboard;