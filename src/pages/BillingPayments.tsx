import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Banknote, DollarSign, ExternalLink, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PaymentMethod {
  id: string;
  type: 'bank' | 'paypal' | 'card';
  name: string;
  details: string;
  is_default: boolean;
}

const BillingPayments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [streamCentsBalance, setStreamCentsBalance] = useState(0);
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);
  
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'checking'
  });

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user]);

  const fetchPaymentData = async () => {
    try {
      // Mock data - you'd integrate with actual payment processor
      setPaymentMethods([
        {
          id: '1',
          type: 'bank',
          name: 'Chase Bank',
          details: '****1234',
          is_default: true
        }
      ]);
      setStreamCentsBalance(1247.89);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      toast({
        title: "Error",
        description: "Account numbers don't match",
        variant: "destructive"
      });
      return;
    }

    // Mock bank account addition - integrate with Stripe/Plaid
    toast({
      title: "Success",
      description: "Bank account added successfully"
    });
    
    setShowAddBankForm(false);
    setBankForm({
      accountHolderName: '',
      routingNumber: '',
      accountNumber: '',
      confirmAccountNumber: '',
      accountType: 'checking'
    });
    fetchPaymentData();
  };

  const handleConnectPayPal = () => {
    // Mock PayPal connection - integrate with PayPal API
    toast({
      title: "Redirecting to PayPal",
      description: "You'll be redirected to PayPal to connect your account"
    });
    // window.open('https://paypal.com/connect', '_blank');
  };

  const handleCashOut = () => {
    toast({
      title: "Cash Out",
      description: "Cash out feature coming soon! You'll be able to transfer your StreamCents to your bank account."
    });
  };

  const maskAccountNumber = (accountNumber: string) => {
    return showAccountNumbers ? accountNumber : `****${accountNumber.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile/edit')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Billing & Payments</h1>
        </div>

        {/* StreamCents Balance */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              StreamCents Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">
                  ${streamCentsBalance.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Earned from collectibles sales, data rev share, and campaign rewards
                </p>
              </div>
              <Button 
                onClick={handleCashOut}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Banknote className="h-4 w-4 mr-2" />
                Cash Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAccountNumbers(!showAccountNumbers)}
            >
              {showAccountNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAccountNumbers ? 'Hide' : 'Show'} Details
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Payment Methods */}
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {method.type === 'bank' && <Banknote className="h-5 w-5 text-primary" />}
                  {method.type === 'paypal' && <div className="h-5 w-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">PP</div>}
                  {method.type === 'card' && <CreditCard className="h-5 w-5 text-primary" />}
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {maskAccountNumber(method.details)}
                    </div>
                  </div>
                  {method.is_default && (
                    <Badge variant="secondary" className="ml-2">Default</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Separator />

            {/* Add Payment Methods */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddBankForm(!showAddBankForm)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
                <Button
                  variant="outline"
                  onClick={handleConnectPayPal}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect PayPal
                </Button>
              </div>

              {/* Add Bank Account Form */}
              {showAddBankForm && (
                <Card className="border-dashed">
                  <CardContent className="p-6">
                    <form onSubmit={handleAddBankAccount} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountHolderName">Account Holder Name</Label>
                          <Input
                            id="accountHolderName"
                            value={bankForm.accountHolderName}
                            onChange={(e) => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                            placeholder="Full name on account"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="routingNumber">Routing Number</Label>
                          <Input
                            id="routingNumber"
                            value={bankForm.routingNumber}
                            onChange={(e) => setBankForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                            placeholder="9-digit routing number"
                            maxLength={9}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            type={showAccountNumbers ? 'text' : 'password'}
                            value={bankForm.accountNumber}
                            onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                            placeholder="Account number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
                          <Input
                            id="confirmAccountNumber"
                            type={showAccountNumbers ? 'text' : 'password'}
                            value={bankForm.confirmAccountNumber}
                            onChange={(e) => setBankForm(prev => ({ ...prev, confirmAccountNumber: e.target.value }))}
                            placeholder="Confirm account number"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                          Add Bank Account
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddBankForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'credit', amount: 89.99, description: 'Collectible Sale - Rare Music NFT', date: '2024-01-15' },
                { type: 'credit', amount: 25.00, description: 'Data Rev Share - December 2023', date: '2024-01-01' },
                { type: 'debit', amount: 19.99, description: 'Merch Purchase - Limited Edition T-Shirt', date: '2023-12-28' },
                { type: 'credit', amount: 150.00, description: 'Campaign Completion Bonus', date: '2023-12-25' }
              ].map((transaction, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">{transaction.date}</div>
                  </div>
                  <div className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm">
                <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">Security Notice</p>
                <p className="text-orange-700 dark:text-orange-300">
                  Your payment information is encrypted and secure. We use industry-standard security measures 
                  to protect your financial data. StreamCents uses bank-level security for all transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingPayments;
