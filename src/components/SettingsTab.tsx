import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Receipt, Settings, Bell, Lock, Shield, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PurchaseHistory {
  id: string;
  stripe_session_id: string;
  amount_paid_cents: number;
  xp_amount: number;
  currency: string;
  stripe_price_id: string;
  purchase_date: string;
  created_at: string;
}

interface XPBalance {
  current_xp: number;
  total_earned_xp: number;
  total_spent_xp: number;
}

export default function SettingsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [xpBalance, setXpBalance] = useState<XPBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchPurchaseHistory = async () => {
    if (!user) return;
    
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('xp_purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });

    if (purchaseError) {
      console.error('Error fetching purchases:', purchaseError);
    } else {
      setPurchases(purchaseData || []);
    }
  };

  const fetchXPBalance = async () => {
    if (!user) return;
    
    const { data: xpData, error: xpError } = await supabase
      .from('user_xp_balances')
      .select('current_xp, total_earned_xp, total_spent_xp')
      .eq('user_id', user.id)
      .maybeSingle();

    if (xpError && xpError.code !== 'PGRST116') {
      console.error('Error fetching XP balance:', xpError);
    } else {
      setXpBalance(xpData || { current_xp: 0, total_earned_xp: 0, total_spent_xp: 0 });
    }
  };

  // Set up real-time updates for XP balance and purchases
  useEffect(() => {
    if (!user?.id) return;
    
    // XP balance real-time updates
    const xpChannel = supabase
      .channel('xp-balance-updates-settings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_xp_balances',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        console.log('Settings XP balance updated:', payload);
        if (payload.new) {
          setXpBalance({
            current_xp: payload.new.current_xp || 0,
            total_earned_xp: payload.new.total_earned_xp || 0,
            total_spent_xp: payload.new.total_spent_xp || 0
          });
        }
      })
      .subscribe();

    // Purchase history real-time updates
    const purchaseChannel = supabase
      .channel('purchase-updates-settings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'xp_purchases',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        console.log('Settings purchase history updated:', payload);
        // Refresh purchase data when new purchases are made
        fetchPurchaseHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(xpChannel);
      supabase.removeChannel(purchaseChannel);
    };
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchPurchaseHistory(),
        fetchXPBalance()
      ]);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getTotalSpent = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.amount_paid_cents, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Purchase History
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          {/* XP Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                XP Balance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{xpBalance?.current_xp?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Current XP</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{xpBalance?.total_earned_xp?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{xpBalance?.total_spent_xp?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalSpent())}</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 hover:bg-blue-100"
                      onClick={() => {
                        fetchUserData();
                        toast({
                          title: "Refreshed",
                          description: "Purchase data updated",
                        });
                      }}
                    >
                      <Receipt className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Purchased</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>
                  View all your XP purchases and transactions
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/purchase-xp')}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Buy More XP
              </Button>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Purchases Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't made any XP purchases yet. Start by purchasing your first XP package!
                  </p>
                  <Button onClick={() => navigate('/purchase-xp')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase XP
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">XP Purchase</p>
                            <Badge variant="outline" className="text-xs">
                              {purchase.xp_amount.toLocaleString()} XP
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(purchase.purchase_date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Session: {purchase.stripe_session_id.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(purchase.amount_paid_cents, purchase.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(purchase.amount_paid_cents / 100 / purchase.xp_amount * 100).toFixed(2)}¢/XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/billing-payments')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Billing & Payments
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/profile/edit')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Configure your notification preferences
                </p>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Settings (Coming Soon)
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Security</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your account security and privacy
                </p>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Lock className="h-4 w-4 mr-2" />
                  Two-Factor Authentication (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control your privacy settings and data usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your data including purchases and activity
                </p>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export My Data (Coming Soon)
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Legal Documents</h4>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => navigate('/terms-conditions')}
                  >
                    Terms & Conditions
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => navigate('/privacy-policy')}
                  >
                    Privacy Policy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}