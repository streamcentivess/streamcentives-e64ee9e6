import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Plus, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NODE_ENV === 'production' 
  ? 'pk_live_...' // Replace with your live publishable key
  : 'pk_test_51QazO5Gxmhiuuc5EibWEWd3GOhzB9OqOH9gOJ5C2aeQ2T1C6C7IlGJDDjlBiwtizdICrJ5BRXG97GNiJSJXTRj2e00qN5lAE93' // Test key
);

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name: string | null;
  };
}

export const PaymentMethodManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-payment-methods', {
        body: { action: 'list_payment_methods' }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentMethods(data.payment_methods);
        setCustomerId(data.customer_id);
        setDefaultPaymentMethod(data.default_payment_method);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    setAddingCard(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      // Create setup intent
      const { data, error } = await supabase.functions.invoke('manage-payment-methods', {
        body: { 
          action: 'create_setup_intent',
          customerId 
        }
      });

      if (error) throw error;

      // Confirm setup intent with Stripe Elements
      const { error: stripeError } = await stripe.confirmCardSetup(data.client_secret, {
        payment_method: {
          card: {
            // This would typically be a Stripe Elements card element
            // For now, we'll show a message to implement full Stripe Elements
          }
        }
      });

      if (stripeError) throw stripeError;

      toast({
        title: "Card Added",
        description: "Your payment method has been saved successfully."
      });
      
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAddingCard(false);
    }
  };

  const deletePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-payment-methods', {
        body: { 
          action: 'delete_payment_method',
          paymentMethodId 
        }
      });

      if (error) throw error;

      toast({
        title: "Card Removed",
        description: "Payment method has been removed successfully."
      });
      
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Error",
        description: "Failed to remove payment method.",
        variant: "destructive"
      });
    }
  };

  const setAsDefault = async (paymentMethodId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-payment-methods', {
        body: { 
          action: 'set_default_payment_method',
          paymentMethodId 
        }
      });

      if (error) throw error;

      toast({
        title: "Default Updated",
        description: "Default payment method has been updated."
      });
      
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update default payment method.",
        variant: "destructive"
      });
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // Return appropriate icon based on card brand
    return <CreditCard className="h-4 w-4" />;
  };

  const maskCardNumber = (last4: string) => {
    return showDetails ? `**** **** **** ${last4}` : `****${last4}`;
  };

  if (loading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Payment Methods */}
        {paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getCardBrandIcon(method.card?.brand || '')}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {method.card?.brand} {maskCardNumber(method.card?.last4 || '')}
                      </span>
                      {method.id === defaultPaymentMethod && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {showDetails && `Expires ${method.card?.exp_month}/${method.card?.exp_year}`}
                      {method.billing_details?.name && ` • ${method.billing_details.name}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.id !== defaultPaymentMethod && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAsDefault(method.id)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePaymentMethod(method.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Payment Methods</p>
            <p className="text-sm">Add a payment method to make purchases and subscriptions easier</p>
          </div>
        )}

        <Separator />

        {/* Add Payment Method */}
        <div className="space-y-3">
          <Button
            onClick={() => {
              // For full implementation, you'd open a modal with Stripe Elements
              toast({
                title: "Feature Coming Soon",
                description: "Full Stripe Elements integration is being implemented. This will allow secure card entry."
              });
            }}
            disabled={addingCard}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            {addingCard ? "Adding Card..." : "Add New Card"}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>🔒 All payment information is securely processed by Stripe</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
