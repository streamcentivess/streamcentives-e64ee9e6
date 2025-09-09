import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [tokenInput, setTokenInput] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');

  // Check for token in URL params on mount
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'signup') {
      handleTokenConfirmation(token);
    }
  }, [searchParams]);

  const handleTokenConfirmation = async (token: string) => {
    setConfirmationStatus('loading');
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) {
        console.error('Email confirmation error:', error);
        setConfirmationStatus('error');
        toast({
          title: "Confirmation Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        setConfirmationStatus('success');
        toast({
          title: "Email Confirmed!",
          description: "Your email has been successfully verified. Welcome to Streamcentives!",
        });
        
        // Redirect to role selection or profile setup after a short delay
        setTimeout(() => {
          navigate('/role-selection');
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected confirmation error:', error);
      setConfirmationStatus('error');
      toast({
        title: "Confirmation Failed",
        description: "An unexpected error occurred while confirming your email.",
        variant: "destructive"
      });
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token: tokenInput.trim(),
        type: 'signup',
        email: email
      });

      if (error) {
        toast({
          title: "Invalid Token",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        setConfirmationStatus('success');
        toast({
          title: "Email Confirmed!",
          description: "Your email has been successfully verified.",
        });
        
        setTimeout(() => {
          navigate('/role-selection');
        }, 2000);
      }
    } catch (error) {
      console.error('Manual token confirmation error:', error);
      toast({
        title: "Confirmation Failed",
        description: "Please check your token and try again.",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend the confirmation.",
        variant: "destructive"
      });
      return;
    }

    setResendLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      });

      if (error) {
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email Sent",
          description: "We've sent you a new confirmation email.",
        });
      }
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast({
        title: "Resend Failed",
        description: "Failed to resend confirmation email.",
        variant: "destructive"
      });
    }
    
    setResendLoading(false);
  };

  const getStatusIcon = () => {
    switch (confirmationStatus) {
      case 'loading':
        return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-destructive mx-auto" />;
      default:
        return <Mail className="h-12 w-12 text-primary mx-auto" />;
    }
  };

  const getStatusTitle = () => {
    switch (confirmationStatus) {
      case 'loading':
        return 'Confirming your email...';
      case 'success':
        return 'Email Confirmed!';
      case 'error':
        return 'Confirmation Failed';
      default:
        return 'Confirm Your Email';
    }
  };

  const getStatusDescription = () => {
    switch (confirmationStatus) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        return 'Your email has been successfully verified. You\'ll be redirected shortly.';
      case 'error':
        return 'We couldn\'t confirm your email. Please try using the manual confirmation method below.';
      default:
        return 'We\'ve sent you a confirmation email. Click the link in the email or enter the confirmation code below.';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-modern">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/fc5c3f3a-25a8-47b8-a886-bbbfd21758e9.png" 
              alt="Streamcentives" 
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          
          <div className="space-y-4">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {getStatusTitle()}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {getStatusDescription()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {confirmationStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  Welcome to Streamcentives! You're being redirected to complete your profile setup.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/role-selection')}
                className="w-full"
                size="lg"
              >
                Continue to Setup
              </Button>
            </div>
          )}

          {(confirmationStatus === 'idle' || confirmationStatus === 'error') && (
            <div className="space-y-6">
              {/* Manual Token Entry */}
              <form onSubmit={handleManualTokenSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="token">Confirmation Code</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Enter 6-digit code from email"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Check your email for a 6-digit confirmation code
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={loading || !tokenInput.trim() || !email.trim()}
                >
                  {loading ? 'Confirming...' : 'Confirm Email'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Resend Email */}
              <div className="space-y-4">
                <Button
                  onClick={handleResendConfirmation}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={resendLoading || !email.trim()}
                >
                  {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
                </Button>
                
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Didn't receive the email?</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Check your spam/junk folder</li>
                        <li>• Make sure you entered the correct email address</li>
                        <li>• Wait a few minutes and try resending</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Need help? </span>
            <a 
              href="mailto:meco@streamcentives.com" 
              className="text-primary hover:underline font-medium"
            >
              Contact support
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;