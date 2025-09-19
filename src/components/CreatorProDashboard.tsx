import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, TrendingUp, Shield, Star } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface SubscriptionData {
  subscription_status: string | null;
  subscription_tier: string;
  subscription_started_at: string | null;
}

const CreatorProFeatures = [
  { icon: Zap, title: 'AI Content Generator', description: 'Generate viral posts with advanced AI' },
  { icon: TrendingUp, title: 'Advanced Analytics', description: 'Deep insights into your audience and content performance' },
  { icon: Shield, title: 'Priority Support', description: '24/7 priority customer support' },
  { icon: Crown, title: 'Campaign Boost Tools', description: 'Boost your campaigns for maximum visibility' },
  { icon: Star, title: 'Custom Branding', description: 'White-label your creator profile' },
];

const CheckoutForm: React.FC<{ clientSecret: string; onSuccess: () => void }> = ({ 
  clientSecret, 
  onSuccess 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      toast.error('Card element not found');
      setProcessing(false);
      return;
    }

    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
    } else {
      toast.success('Successfully upgraded to Creator Pro!');
      onSuccess();
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: 'hsl(var(--foreground))',
                '::placeholder': {
                  color: 'hsl(var(--muted-foreground))',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
      >
        {processing ? 'Processing...' : 'Subscribe to Creator Pro - $29.99/month'}
      </Button>
    </form>
  );
};

export const CreatorProDashboard: React.FC = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-creator-subscription', {
        body: { action: 'get_status' }
      });

      if (error) throw error;

      setSubscriptionData(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast.error('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;

    setUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-creator-subscription', {
        body: { action: 'create_subscription' }
      });

      if (error) throw error;

      setClientSecret(data.client_secret);
      setShowCheckout(true);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-creator-subscription', {
        body: { action: 'cancel_subscription' }
      });

      if (error) throw error;

      toast.success(data.message);
      await fetchSubscriptionStatus();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    setClientSecret(null);
    fetchSubscriptionStatus();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const isPro = subscriptionData?.subscription_status === 'active';

  if (showCheckout && clientSecret) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade to Creator Pro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            <CheckoutForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Creator Pro Subscription
            {isPro && <Badge variant="default">Active</Badge>}
            {!isPro && <Badge variant="outline">Free Tier</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You have access to all Creator Pro features!
              </p>
              {subscriptionData.subscription_started_at && (
                <p className="text-sm text-muted-foreground">
                  Started: {new Date(subscriptionData.subscription_started_at).toLocaleDateString()}
                </p>
              )}
              <Button variant="outline" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Unlock premium features with Creator Pro - $29.99/month
              </p>
              <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
                {upgrading ? 'Creating Subscription...' : 'Upgrade to Creator Pro'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creator Pro Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CreatorProFeatures.map((feature, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${isPro ? 'bg-primary/5 border-primary' : 'bg-muted/50'}`}
              >
                <feature.icon className={`h-8 w-8 mb-2 ${isPro ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                {isPro && <Badge className="mt-2">Active</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};