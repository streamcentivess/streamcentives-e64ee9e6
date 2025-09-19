import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, CreditCard, DollarSign, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StripeConnectOnboardingProps {
  onComplete?: () => void;
}

export const StripeConnectOnboarding = ({ onComplete }: StripeConnectOnboardingProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccountStatus();
    }
  }, [user]);

  useEffect(() => {
    // Check URL params for setup completion
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('setup') === 'stripe' && urlParams.get('success') === 'true') {
      toast({
        title: "Setup Complete!",
        description: "Your Stripe Connect account has been successfully configured."
      });
      fetchAccountStatus();
    }
  }, []);

  const fetchAccountStatus = async () => {
    try {
      // First get the user's Stripe account ID from their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('user_id', user?.id)
        .single();

      if (profile?.stripe_connect_account_id) {
        setStripeAccountId(profile.stripe_connect_account_id);
        
        // Get account status from Stripe
        const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
          body: { 
            action: 'get_account_status',
            accountId: profile.stripe_connect_account_id
          }
        });

        if (error) throw error;
        if (data.success) {
          setAccountStatus(data);
        }
      }
    } catch (error) {
      console.error('Error fetching account status:', error);
    }
  };

  const createStripeAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: { action: 'create_account' }
      });

      if (error) throw error;

      if (data.success) {
        setStripeAccountId(data.account_id);
        setAccountStatus(data);
        toast({
          title: "Account Created",
          description: "Your Stripe Connect account has been created. Complete the onboarding to receive payouts."
        });
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      toast({
        title: "Error",
        description: "Failed to create Stripe account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    if (!stripeAccountId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: { 
          action: 'create_onboarding_link',
          accountId: stripeAccountId
        }
      });

      if (error) throw error;

      if (data.success) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboarding_url;
      }
    } catch (error) {
      console.error('Error starting onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to start onboarding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!accountStatus) return <CreditCard className="h-6 w-6 text-muted-foreground" />;
    
    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    return <AlertCircle className="h-6 w-6 text-orange-500" />;
  };

  const getStatusText = () => {
    if (!accountStatus) return "Not set up";
    
    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return "Fully enabled - Ready to receive payouts";
    }
    
    if (accountStatus.details_submitted) {
      return "Under review - Processing may take 1-2 business days";
    }
    
    return "Setup required - Complete onboarding to receive payouts";
  };

  const isFullyEnabled = accountStatus?.charges_enabled && accountStatus?.payouts_enabled;

  return (
    <Card className="card-modern">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <CardTitle className="text-xl">Payout Setup</CardTitle>
            <CardDescription>
              Set up Stripe Connect to receive payments from brand deals and marketplace sales
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className={isFullyEnabled ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <AlertDescription className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </AlertDescription>
        </Alert>

        {!isFullyEnabled && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <h4 className="font-medium mb-2">What you'll need:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Government-issued ID (driver's license, passport)</li>
                <li>Bank account information</li>
                <li>Tax ID or SSN</li>
                <li>Business information (if applicable)</li>
              </ul>
            </div>

            {!stripeAccountId ? (
              <Button 
                onClick={createStripeAccount} 
                disabled={loading}
                className="w-full"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {loading ? "Creating Account..." : "Create Payout Account"}
              </Button>
            ) : (
              <Button 
                onClick={startOnboarding} 
                disabled={loading}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {loading ? "Starting Setup..." : "Complete Payout Setup"}
              </Button>
            )}
          </div>
        )}

        {isFullyEnabled && onComplete && (
          <Button 
            onClick={onComplete} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue
          </Button>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p className="mb-1">🔒 <strong>Secure & Protected</strong></p>
          <p>Your information is encrypted and handled by Stripe, a PCI-compliant payment processor trusted by millions of businesses worldwide.</p>
        </div>
      </CardContent>
    </Card>
  );
};