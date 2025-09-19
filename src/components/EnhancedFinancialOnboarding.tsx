import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Wallet,
  Building
} from 'lucide-react';
import { StripeConnectOnboarding } from './StripeConnectOnboarding';
import { PaymentMethodManager } from './PaymentMethodManager';
import { useUserRole } from '@/hooks/useUserRole';

interface EnhancedFinancialOnboardingProps {
  onComplete?: () => void;
  isOptional?: boolean;
}

export const EnhancedFinancialOnboarding = ({ 
  onComplete, 
  isOptional = true 
}: EnhancedFinancialOnboardingProps) => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [currentStep, setCurrentStep] = useState<'overview' | 'payment-methods' | 'payouts'>('overview');
  const [completedSteps, setCompletedSteps] = useState({
    paymentMethods: false,
    payouts: false
  });

  const isCreator = role === 'creator';
  const isSponsor = role === 'sponsor';

  const handleStepComplete = (step: string) => {
    setCompletedSteps(prev => ({ ...prev, [step]: true }));
  };

  const handleSkip = () => {
    if (onComplete) onComplete();
  };

  const handleContinue = () => {
    if (onComplete) onComplete();
  };

  const getProgressPercentage = () => {
    const requiredSteps = isCreator ? 2 : 1; // Creators need both payment methods and payouts
    const completed = Object.values(completedSteps).filter(Boolean).length;
    return (completed / requiredSteps) * 100;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-gradient-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Setup</h1>
          <p className="text-muted-foreground text-lg">
            {isOptional 
              ? "Optional: Set up your payment methods and payout preferences"
              : "Complete your financial setup to unlock all features"
            }
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}% complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {currentStep === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Payment Methods Setup */}
          <Card className="card-modern">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>
                      Add cards for XP purchases and subscriptions
                    </CardDescription>
                  </div>
                </div>
                {completedSteps.paymentMethods && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Secure one-click purchases</li>
                    <li>Automatic subscription billing</li>
                    <li>Manage multiple payment methods</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => setCurrentStep('payment-methods')}
                  className="w-full"
                  variant={completedSteps.paymentMethods ? "outline" : "default"}
                >
                  {completedSteps.paymentMethods ? "Manage Cards" : "Add Payment Method"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout Setup (Creators only) */}
          {isCreator && (
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Payout Setup</CardTitle>
                      <CardDescription>
                        Receive payments from brand deals and sales
                      </CardDescription>
                    </div>
                  </div>
                  {completedSteps.payouts && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Direct bank transfers</li>
                      <li>Secure identity verification</li>
                      <li>Tax documentation support</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => setCurrentStep('payouts')}
                    className="w-full"
                    variant={completedSteps.payouts ? "outline" : "default"}
                  >
                    {completedSteps.payouts ? "Manage Payouts" : "Setup Payouts"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sponsors get different content */}
          {isSponsor && (
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Brand Deals & Payments</CardTitle>
                    <CardDescription>
                      Streamlined payments for creator partnerships
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Secure partnership payments</li>
                      <li>Automatic invoicing</li>
                      <li>Campaign budget management</li>
                    </ul>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Payment methods handle all transactions
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {currentStep === 'payment-methods' && (
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep('overview')}
            className="mb-4"
          >
            ← Back to Overview
          </Button>
          <PaymentMethodManager />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('overview')}>
              Back
            </Button>
            <Button onClick={() => handleStepComplete('paymentMethods')}>
              Mark Complete
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'payouts' && isCreator && (
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep('overview')}
            className="mb-4"
          >
            ← Back to Overview
          </Button>
          <StripeConnectOnboarding 
            onComplete={() => handleStepComplete('payouts')}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('overview')}>
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Bank-Level Security</p>
              <p className="text-muted-foreground">
                All financial data is encrypted and processed by Stripe, a PCI DSS Level 1 certified provider. 
                Your information is never stored on our servers and meets the highest security standards in the industry.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        {isOptional && (
          <Button variant="ghost" onClick={handleSkip}>
            Skip for Now
          </Button>
        )}
        
        <div className="flex gap-3 ml-auto">
          <Button 
            onClick={handleContinue}
            className="px-8"
          >
            {getProgressPercentage() === 100 ? "Complete Setup" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};