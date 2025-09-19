import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Handshake,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface BrandDeal {
  id: string;
  deal_name: string;
  offer_details: string | null;
  amount_cents: number;
  streamcentives_fee_cents: number;
  creator_net_cents: number;
  status: string;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
  creator_id: string;
  sponsor_id: string;
  offer_id: string | null;
}

interface SponsorOffer {
  id: string;
  offer_title: string;
  offer_description: string;
  offer_amount_cents: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  sponsor_id: string;
  creator_id: string;
}

const PaymentForm: React.FC<{ 
  dealId: string; 
  clientSecret: string; 
  onSuccess: () => void 
}> = ({ dealId, clientSecret, onSuccess }) => {
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

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
    } else {
      // Confirm payment on backend
      const { error: confirmError } = await supabase.functions.invoke('brand-deal-payment', {
        body: {
          action: 'confirm_payment',
          deal_id: dealId,
          payment_intent_id: paymentIntent.id,
        }
      });

      if (confirmError) {
        toast.error('Payment confirmation failed');
      } else {
        toast.success('Payment successful! Deal completed.');
        onSuccess();
      }
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
        {processing ? 'Processing Payment...' : 'Complete Payment'}
      </Button>
    </form>
  );
};

export const BrandDealsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [brandDeals, setBrandDeals] = useState<BrandDeal[]>([]);
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDeal, setPaymentDeal] = useState<{ dealId: string; clientSecret: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, role]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch brand deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('brand_deals')
        .select('*')
        .or(`creator_id.eq.${user.id},sponsor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;
      setBrandDeals(dealsData || []);

      // Fetch offers for creators
      if (role === 'creator') {
        const { data: offersData, error: offersError } = await supabase
          .from('sponsor_offers')
          .select('*')
          .eq('creator_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (offersError) throw offersError;
        setOffers(offersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (offerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('brand-deal-payment', {
        body: {
          action: 'create_deal',
          offer_id: offerId,
        }
      });

      if (error) throw error;

      toast.success('Brand deal created successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
    }
  };

  const handleInitiatePayment = async (dealId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('brand-deal-payment', {
        body: {
          action: 'create_payment_intent',
          deal_id: dealId,
        }
      });

      if (error) throw error;

      setPaymentDeal({
        dealId,
        clientSecret: data.client_secret,
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentDeal(null);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, icon: Clock },
      pending_payment: { variant: 'secondary' as const, icon: CreditCard },
      paid: { variant: 'default' as const, icon: CheckCircle },
      completed: { variant: 'default' as const, icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (paymentDeal) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            <PaymentForm 
              dealId={paymentDeal.dealId} 
              clientSecret={paymentDeal.clientSecret} 
              onSuccess={handlePaymentSuccess} 
            />
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
            <Handshake className="h-5 w-5" />
            Brand Deals Dashboard
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue={role === 'creator' ? 'available-offers' : 'my-deals'}>
        <TabsList className="grid w-full grid-cols-2">
          {role === 'creator' && <TabsTrigger value="available-offers">Available Offers</TabsTrigger>}
          <TabsTrigger value="my-deals">
            {role === 'creator' ? 'My Deals' : 'Sponsored Deals'}
          </TabsTrigger>
        </TabsList>

        {role === 'creator' && (
          <TabsContent value="available-offers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Accepted Offers Ready for Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {offers.length === 0 ? (
                  <p className="text-muted-foreground">No accepted offers available for deals.</p>
                ) : (
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <div key={offer.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{offer.offer_title}</h3>
                          <Badge>${(offer.offer_amount_cents / 100).toFixed(2)}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                          {offer.offer_description}
                        </p>
                        <Button 
                          onClick={() => handleCreateDeal(offer.id)}
                          className="w-full"
                        >
                          Create Brand Deal
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="my-deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {role === 'creator' ? 'My Brand Deals' : 'Sponsored Deals'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {brandDeals.length === 0 ? (
                <p className="text-muted-foreground">No brand deals found.</p>
              ) : (
                <div className="space-y-4">
                  {brandDeals.map((deal) => (
                    <div key={deal.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{deal.deal_name}</h3>
                        {getStatusBadge(deal.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-semibold">${(deal.amount_cents / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Platform Fee (2%)</p>
                          <p className="font-semibold">${(deal.streamcentives_fee_cents / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Creator Net</p>
                          <p className="font-semibold text-primary">${(deal.creator_net_cents / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p>{new Date(deal.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {deal.offer_details && (
                        <p className="text-muted-foreground text-sm mb-4">{deal.offer_details}</p>
                      )}

                      {role === 'sponsor' && deal.status === 'pending_payment' && (
                        <Button 
                          onClick={() => handleInitiatePayment(deal.id)}
                          className="w-full"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pay ${(deal.amount_cents / 100).toFixed(2)}
                        </Button>
                      )}

                      {deal.paid_at && (
                        <div className="text-sm text-muted-foreground">
                          Paid on: {new Date(deal.paid_at).toLocaleDateString()}
                        </div>
                      )}
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