import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, CreditCard, Banknote, Download, Calendar } from 'lucide-react';

interface Earning {
  id: string;
  earnings_type: string;
  amount_cents: number;
  net_amount_cents?: number;
  payout_status: string;
  created_at: string;
  transaction_reference?: string;
  fee_breakdown?: any;
}

interface PayoutRequest {
  id: string;
  amount_cents: number;
  fee_cents: number;
  net_amount_cents: number;
  payout_method: string;
  status: string;
  requested_at: string;
  processed_at?: string;
}

export function CreatorEarningsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<string>('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEarningsData();
    }
  }, [user]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      // Fetch earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (earningsError) throw earningsError;
      setEarnings(earningsData || []);

      // Fetch payout requests
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('creator_payout_requests')
        .select('*')
        .eq('creator_id', user?.id)
        .order('requested_at', { ascending: false });

      if (payoutsError) throw payoutsError;
      setPayoutRequests(payoutsData || []);

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableBalance = () => {
    return earnings
      .filter(e => e.payout_status === 'pending')
      .reduce((sum, earning) => sum + (earning.net_amount_cents || earning.amount_cents), 0);
  };

  const getTotalEarnings = () => {
    return earnings.reduce((sum, earning) => sum + (earning.net_amount_cents || earning.amount_cents), 0);
  };

  const getPendingPayouts = () => {
    return payoutRequests
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, payout) => sum + payout.amount_cents, 0);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEarningsTypeLabel = (type: string) => {
    const labels = {
      'xp_sales': 'XP Sales',
      'reward_sale': 'Reward Sales',
      'marketplace_sale': 'Marketplace Sales',
      'marketplace_royalty': 'Marketplace Royalty',
      'campaign_rewards': 'Campaign Rewards'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handlePayout = async () => {
    const amountCents = Math.round(parseFloat(payoutAmount) * 100);
    const availableBalance = getAvailableBalance();

    if (amountCents > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You can only withdraw up to ${formatPrice(availableBalance)}`,
        variant: "destructive"
      });
      return;
    }

    if (!payoutMethod) {
      toast({
        title: "Payout Method Required",
        description: "Please select a payout method",
        variant: "destructive"
      });
      return;
    }

    setPayoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('creator-payout-request', {
        body: {
          amountCents,
          payoutMethod,
          payoutDetails: {
            // Add payout method specific details here
            method: payoutMethod
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Payout Requested",
        description: `Your payout request for ${formatPrice(amountCents)} has been submitted`,
      });

      setPayoutDialogOpen(false);
      setPayoutAmount('');
      setPayoutMethod('');
      fetchEarningsData(); // Refresh data

    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: "Payout Failed",
        description: error instanceof Error ? error.message : "Failed to request payout",
        variant: "destructive"
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Creator Earnings</h1>
          <p className="text-muted-foreground">Manage your earnings and payouts</p>
        </div>
        
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Available balance: {formatPrice(getAvailableBalance())}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={getAvailableBalance() / 100}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe Connect</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handlePayout} 
                disabled={payoutLoading || !payoutAmount || !payoutMethod}
                className="w-full"
              >
                {payoutLoading ? 'Processing...' : 'Request Payout'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(getAvailableBalance())}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for withdrawal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(getTotalEarnings())}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatPrice(getPendingPayouts())}
            </div>
            <p className="text-xs text-muted-foreground">
              In processing
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earnings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earnings">Earnings History</TabsTrigger>
          <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No earnings history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {earnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Badge variant="outline">
                            {getEarningsTypeLabel(earning.earnings_type)}
                          </Badge>
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatPrice(earning.net_amount_cents || earning.amount_cents)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(earning.created_at)}
                          </div>
                          {earning.fee_breakdown && (
                            <div className="text-xs text-muted-foreground">
                              Fees: {JSON.stringify(earning.fee_breakdown)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(earning.payout_status)}>
                          {earning.payout_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payout requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payoutRequests.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Banknote className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatPrice(payout.amount_cents)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Requested: {formatDate(payout.requested_at)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Method: {payout.payout_method} • 
                            Fee: {formatPrice(payout.fee_cents)} • 
                            Net: {formatPrice(payout.net_amount_cents)}
                          </div>
                          {payout.processed_at && (
                            <div className="text-xs text-muted-foreground">
                              Processed: {formatDate(payout.processed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}