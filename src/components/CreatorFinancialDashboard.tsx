import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, TrendingUp, DollarSign, CreditCard, Clock, AlertCircle } from 'lucide-react';

interface XPBalance {
  current_xp: number;
  total_earned_xp: number;
  total_spent_xp: number;
}

interface Transaction {
  id: string;
  amount_value: number;
  currency_type: string;
  type: string;
  status: string;
  created_at: string;
  metadata: any;
}

interface PayoutRequest {
  id: string;
  xp_amount: number;
  fiat_amount_cents: number;
  fee_amount_cents: number;
  net_amount_cents: number;
  conversion_rate?: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
}

const CreatorFinancialDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [xpBalance, setXpBalance] = useState<XPBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [conversionRate, setConversionRate] = useState(100); // 100 XP = $1.00
  
  // Payout form state
  const [payoutXpAmount, setPayoutXpAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch XP balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_xp_balances')
        .select('current_xp, total_earned_xp, total_spent_xp')
        .eq('user_id', user.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Error fetching XP balance:', balanceError);
      } else {
        setXpBalance(balanceData || { current_xp: 0, total_earned_xp: 0, total_spent_xp: 0 });
      }

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .or(`user_id.eq.${user.id},related_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        setTransactions(transactionsData || []);
      }

      // Fetch payout requests
      const { data: payoutData, error: payoutError } = await supabase
        .from('creator_payouts')
        .select('*')
        .eq('creator_id', user.id)
        .order('requested_at', { ascending: false });

      if (payoutError) {
        console.error('Error fetching payout requests:', payoutError);
      } else {
        setPayoutRequests(payoutData || []);
      }

      // Fetch current conversion rate
      const { data: rateData, error: rateError } = await supabase
        .from('xp_conversion_rates')
        .select('xp_per_dollar_cents')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (rateError) {
        console.error('Error fetching conversion rate:', rateError);
      } else {
        setConversionRate(rateData?.xp_per_dollar_cents || 100);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (!user || !payoutXpAmount) return;

    const xpAmount = parseInt(payoutXpAmount);
    if (isNaN(xpAmount) || xpAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid XP amount",
        variant: "destructive",
      });
      return;
    }

    if (xpBalance && xpAmount > xpBalance.current_xp) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough XP for this payout",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayout(true);
    try {
      const { data, error } = await supabase.functions.invoke('creator-cashout-request', {
        body: {
          xpAmount,
          bankAccountDetails: bankDetails ? JSON.parse(bankDetails) : {}
        }
      });

      if (error) throw error;

      toast({
        title: "Payout Request Submitted",
        description: `Request for ${xpAmount} XP submitted successfully`,
      });

      setPayoutXpAmount('');
      setBankDetails('');
      fetchFinancialData(); // Refresh data
    } catch (error: any) {
      console.error('Payout request error:', error);
      toast({
        title: "Payout Request Failed",
        description: error.message || "Failed to submit payout request",
        variant: "destructive",
      });
    } finally {
      setProcessingPayout(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatXP = (xp: number) => {
    return new Intl.NumberFormat('en-US').format(xp);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const calculateFiatValue = (xpAmount: number) => {
    const fiatCents = Math.floor((xpAmount / conversionRate) * 100);
    return fiatCents;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">Manage your earnings and payouts</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current XP Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatXP(xpBalance?.current_xp || 0)} XP</div>
            <p className="text-xs text-muted-foreground">
              ≈ {formatCurrency(calculateFiatValue(xpBalance?.current_xp || 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatXP(xpBalance?.total_earned_xp || 0)} XP</div>
            <p className="text-xs text-muted-foreground">
              ≈ {formatCurrency(calculateFiatValue(xpBalance?.total_earned_xp || 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate} XP</div>
            <p className="text-xs text-muted-foreground">= $1.00 USD</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payout">Request Payout</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="payout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Request XP Cash-Out
              </CardTitle>
              <CardDescription>
                Convert your XP to cash. Minimum payout: $5.00 USD (500 XP). 2% processing fee applies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xp-amount">XP Amount</Label>
                  <Input
                    id="xp-amount"
                    type="number"
                    placeholder="Enter XP amount"
                    value={payoutXpAmount}
                    onChange={(e) => setPayoutXpAmount(e.target.value)}
                    min="500"
                    max={xpBalance?.current_xp || 0}
                  />
                  {payoutXpAmount && (
                    <p className="text-sm text-muted-foreground">
                      ≈ {formatCurrency(calculateFiatValue(parseInt(payoutXpAmount) || 0))} 
                      (After 2% fee: {formatCurrency(calculateFiatValue(parseInt(payoutXpAmount) || 0) * 0.98)})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-details">Bank Account Details (Optional)</Label>
                  <Textarea
                    id="bank-details"
                    placeholder='{"routing": "123456789", "account": "987654321"}'
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON format for bank details (optional - can be provided later)
                  </p>
                </div>
              </div>
              <Button 
                onClick={handlePayoutRequest}
                disabled={processingPayout || !payoutXpAmount}
                className="w-full md:w-auto"
              >
                {processingPayout ? 'Processing...' : 'Request Payout'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Payout History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payout requests yet</p>
              ) : (
                <div className="space-y-4">
                  {payoutRequests.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatXP(payout.xp_amount)} XP</span>
                          <Badge className={getStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Net: {formatCurrency(payout.net_amount_cents)} 
                          (Fee: {formatCurrency(payout.fee_amount_cents)})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(payout.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payout.net_amount_cents)}</p>
                        {payout.conversion_rate && (
                          <p className="text-xs text-muted-foreground">
                            Rate: {payout.conversion_rate} XP/$1
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {transaction.type.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.currency_type === 'XP' 
                            ? `${formatXP(transaction.amount_value)} XP`
                            : formatCurrency(transaction.amount_value)
                          }
                        </p>
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
};

export default CreatorFinancialDashboard;