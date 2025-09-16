import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Download, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Earning {
  id: string;
  earnings_type: string;
  amount_cents: number;
  net_amount_cents: number;
  payout_status: string;
  created_at: string;
  updated_at: string;
  fee_breakdown: any;
  transaction_reference?: string;
}

interface PayoutRequest {
  id: string;
  amount_cents: number;
  net_amount_cents: number;
  fee_cents: number;
  status: string;
  payout_method: string;
  requested_at: string;
  processed_at?: string;
}

const CreatorEarningsTracker = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableForPayout, setAvailableForPayout] = useState(0);
  const [processingPayout, setProcessingPayout] = useState(false);

  const fetchEarnings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch creator earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (earningsError) throw earningsError;
      setEarnings(earningsData || []);

      // Calculate totals
      const total = (earningsData || []).reduce((sum, earning) => 
        sum + (earning.net_amount_cents || 0), 0
      );
      setTotalEarnings(total);

      // Fetch payout requests
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('creator_payout_requests')
        .select('*')
        .eq('creator_id', user.id)
        .order('requested_at', { ascending: false });

      if (payoutsError) throw payoutsError;
      setPayoutRequests(payoutsData || []);

      // Calculate available for payout (total earnings - pending/completed payouts)
      const totalPayouts = (payoutsData || [])
        .filter(p => p.status === 'completed' || p.status === 'pending')
        .reduce((sum, payout) => sum + (payout.net_amount_cents || 0), 0);
      
      setAvailableForPayout(Math.max(0, total - totalPayouts));
      
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  const requestPayout = async () => {
    if (!user || availableForPayout < 1000) { // Minimum $10
      toast.error('Minimum payout amount is $10.00');
      return;
    }

    try {
      setProcessingPayout(true);
      
      const { data, error } = await supabase.functions.invoke('creator-payout-request', {
        body: {
          amount_cents: availableForPayout,
          payout_method: 'bank_transfer'
        }
      });

      if (error) throw error;
      
      toast.success('Payout request submitted successfully');
      fetchEarnings(); // Refresh data
      
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getEarningTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'xp_sales': 'XP Sales',
      'reward_sale': 'Reward Sales',
      'marketplace_sale': 'Marketplace Sales',
      'marketplace_royalty': 'Marketplace Royalties',
      'message_fee': 'Message Fees',
      'campaign_reward': 'Campaign Rewards'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const thisMonthEarnings = earnings.filter(earning => {
    const earningDate = new Date(earning.created_at);
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    return earningDate >= monthStart && earningDate <= monthEnd;
  }).reduce((sum, earning) => sum + (earning.net_amount_cents || 0), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse w-20 mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your creator earnings</p>
        </div>
        <Button 
          onClick={requestPayout}
          disabled={availableForPayout < 1000 || processingPayout}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Request Payout
        </Button>
      </div>

      {/* Earnings Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(availableForPayout)}
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum {formatCurrency(1000)} required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Progress */}
      {availableForPayout > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payout Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Available: {formatCurrency(availableForPayout)}</span>
                <span>Minimum: {formatCurrency(1000)}</span>
              </div>
              <Progress value={(availableForPayout / 1000) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {availableForPayout >= 1000 
                  ? 'You can request a payout now!' 
                  : `Earn ${formatCurrency(1000 - availableForPayout)} more to unlock payouts`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed View */}
      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earnings">Earnings History</TabsTrigger>
          <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No earnings yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start creating campaigns and engaging with fans to earn revenue!
                    </p>
                  </div>
                ) : (
                  earnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getEarningTypeLabel(earning.earnings_type)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {earning.payout_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(earning.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {earning.fee_breakdown && (
                          <p className="text-xs text-muted-foreground">
                            Platform fee: {formatCurrency(earning.fee_breakdown.streamcentives_fee || 0)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-green-600">
                            {formatCurrency(earning.net_amount_cents)}
                          </span>
                        </div>
                        {earning.amount_cents !== earning.net_amount_cents && (
                          <p className="text-xs text-muted-foreground">
                            Gross: {formatCurrency(earning.amount_cents)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No payout requests yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Request your first payout when you reach the minimum threshold
                    </p>
                  </div>
                ) : (
                  payoutRequests.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {payout.payout_method.replace('_', ' ')}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(payout.status)}`}></div>
                          <Badge variant="outline" className="text-xs">
                            {payout.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Requested: {format(new Date(payout.requested_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {payout.processed_at && (
                          <p className="text-sm text-muted-foreground">
                            Processed: {format(new Date(payout.processed_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <ArrowDownRight className="h-4 w-4 text-blue-600" />
                          <span className="font-bold">
                            {formatCurrency(payout.net_amount_cents)}
                          </span>
                        </div>
                        {payout.fee_cents > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Fee: {formatCurrency(payout.fee_cents)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorEarningsTracker;