import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, Users, Zap, TrendingUp } from 'lucide-react';

interface XPBalance {
  id: string;
  xp_type: 'platform' | 'creator_specific' | 'transferable';
  creator_id?: string;
  current_xp: number;
  total_earned_xp: number;
  total_spent_xp: number;
  creator_name?: string;
  creator_avatar?: string;
}

interface XPTransaction {
  id: string;
  xp_amount: number;
  payment_amount_cents: number;
  streamcentives_fee_cents: number;
  creator_share_cents?: number;
  xp_type: string;
  creator_id?: string;
  creator_name?: string;
  created_at: string;
}

export function EnhancedXPBalance() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<XPBalance[]>([]);
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [legacyBalance, setLegacyBalance] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchXPData();
    }
  }, [user]);

  const fetchXPData = async () => {
    try {
      setLoading(true);
      
      // Fetch detailed XP balances
      const { data: detailedBalances, error: balanceError } = await supabase
        .from('user_xp_detailed_balances')
        .select(`
          id,
          xp_type,
          creator_id,
          current_xp,
          total_earned_xp,
          total_spent_xp
        `)
        .eq('user_id', user?.id);

      if (balanceError) throw balanceError;

      // Fetch creator profiles for creator-specific XP
      const creatorIds = detailedBalances
        ?.filter(balance => balance.creator_id)
        .map(balance => balance.creator_id) || [];

      let creatorProfiles: any[] = [];
      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', creatorIds);
        
        creatorProfiles = profilesData || [];
      }

      // Format balances with creator info
      const formattedBalances = detailedBalances?.map(balance => {
        const creatorProfile = creatorProfiles.find(p => p.user_id === balance.creator_id);
        return {
          ...balance,
          creator_name: creatorProfile?.display_name || creatorProfile?.username,
          creator_avatar: creatorProfile?.avatar_url
        };
      }) || [];

      setBalances(formattedBalances);

      // Fetch legacy balance for backwards compatibility
      const { data: legacyData } = await supabase
        .from('user_xp_balances')
        .select('current_xp')
        .eq('user_id', user?.id)
        .single();

      setLegacyBalance(legacyData?.current_xp || 0);

      // Fetch transaction history
      const { data: transactionData, error: transactionError } = await supabase
        .from('xp_purchase_transactions')
        .select(`
          id,
          xp_amount,
          payment_amount_cents,
          streamcentives_fee_cents,
          creator_share_cents,
          xp_type,
          creator_id,
          created_at
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionError) throw transactionError;

      // Fetch creator profiles for transactions
      const txCreatorIds = transactionData
        ?.filter(tx => tx.creator_id)
        .map(tx => tx.creator_id) || [];

      let txCreatorProfiles: any[] = [];
      if (txCreatorIds.length > 0) {
        const { data: txProfilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username')
          .in('user_id', txCreatorIds);
        
        txCreatorProfiles = txProfilesData || [];
      }

      const formattedTransactions = transactionData?.map(tx => {
        const creatorProfile = txCreatorProfiles.find(p => p.user_id === tx.creator_id);
        return {
          ...tx,
          creator_name: creatorProfile?.display_name || creatorProfile?.username
        };
      }) || [];

      setTransactions(formattedTransactions);

    } catch (error) {
      console.error('Error fetching XP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalXP = () => {
    const detailedTotal = balances.reduce((sum, balance) => sum + balance.current_xp, 0);
    return Math.max(detailedTotal, legacyBalance);
  };

  const getPlatformXP = () => {
    const platformBalance = balances.find(b => b.xp_type === 'platform');
    return platformBalance?.current_xp || legacyBalance;
  };

  const getCreatorXP = () => {
    return balances
      .filter(b => b.xp_type === 'creator_specific')
      .reduce((sum, balance) => sum + balance.current_xp, 0);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">XP Balance</h1>
        <p className="text-muted-foreground">
          Track your different XP types and transaction history
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalXP().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All XP types combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform XP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPlatformXP().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Universal usage XP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creator XP</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCreatorXP().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Creator-specific XP
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="balances">XP Balances</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed XP Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {balances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No detailed XP balances found</p>
                  <p className="text-sm">Legacy balance: {legacyBalance.toLocaleString()} XP</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {balances.map((balance) => (
                    <Card key={balance.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {balance.xp_type === 'creator_specific' && balance.creator_avatar && (
                              <img 
                                src={balance.creator_avatar} 
                                alt={balance.creator_name || 'Creator'} 
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={balance.xp_type === 'platform' ? 'default' : 'secondary'}>
                                  {balance.xp_type === 'platform' ? 'Platform' : 'Creator-Specific'}
                                </Badge>
                                {balance.creator_name && (
                                  <span className="text-sm font-medium">{balance.creator_name}</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Earned: {balance.total_earned_xp.toLocaleString()} • 
                                Spent: {balance.total_spent_xp.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{balance.current_xp.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">XP</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent XP Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No XP purchase history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Badge variant={tx.xp_type === 'platform' ? 'default' : 'secondary'}>
                            {tx.xp_type === 'platform' ? 'Platform' : 'Creator'}
                          </Badge>
                        </div>
                        <div>
                          <div className="font-medium">
                            {tx.xp_amount.toLocaleString()} XP
                            {tx.creator_name && ` for ${tx.creator_name}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(tx.created_at)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total: {formatPrice(tx.payment_amount_cents)} • 
                            Platform Fee: {formatPrice(tx.streamcentives_fee_cents)}
                            {tx.creator_share_cents && ` • Creator: ${formatPrice(tx.creator_share_cents)}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +{tx.xp_amount.toLocaleString()} XP
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(tx.payment_amount_cents)}
                        </div>
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