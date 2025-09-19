import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentMethodManager } from '@/components/PaymentMethodManager';
import { StripeConnectOnboarding } from '@/components/StripeConnectOnboarding';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  type: 'bank' | 'paypal' | 'card';
  name: string;
  details: string;
  is_default: boolean;
}

const BillingPayments = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [streamCentsBalance, setStreamCentsBalance] = useState(0);
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);

  const isCreator = role === 'creator';
  
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
            onClick={() => navigate('/edit-profile')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Financial Management</h1>
          </div>
        </div>

        {/* Payment Methods */}
        <PaymentMethodManager />

        {/* Payout Setup (Creators only) */}
        {isCreator && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Payout Settings</h2>
            <StripeConnectOnboarding />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPayments;
