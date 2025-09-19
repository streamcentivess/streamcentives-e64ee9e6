import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 
  'icloud.com', 'protonmail.com', 'mail.com', 'live.com', 'msn.com',
  'ymail.com', 'rocketmail.com', 'att.net', 'comcast.net', 'verizon.net'
];

const SponsorSignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const { signUpWithEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateCompanyEmail = (email: string): boolean => {
    if (!email) return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    // Check if it's a personal email domain
    if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
      setEmailError('Please use a company email address. Personal email providers like Gmail, Yahoo, etc. are not allowed.');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (newEmail && newEmail.includes('@')) {
      validateCompanyEmail(newEmail);
    }
  };

  const handleSponsorSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCompanyEmail(email)) {
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signUpWithEmail(email, password);
      
      if (!error) {
        // Store company name in session storage for onboarding
        sessionStorage.setItem('sponsor_company_name', companyName);
        
        toast({
          title: "Account Created!",
          description: "Welcome to StreamCentives! Please complete your sponsor profile setup.",
        });
        
        // Navigate to sponsor onboarding
        navigate('/sponsor-onboarding');
      }
    } catch (error) {
      console.error('Sponsor signup error:', error);
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-modern">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Sponsor Registration
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Create your sponsor account with a company email
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sponsors must use a company email address. Personal email providers are not permitted.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSponsorSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Company Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@yourcompany.com"
                value={email}
                onChange={handleEmailChange}
                required
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password (8+ characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300" 
              size="lg" 
              disabled={loading || password !== confirmPassword || !!emailError || !companyName.trim()}
            >
              {loading ? 'Creating account...' : 'Create Sponsor Account'}
            </Button>
          </form>

          <div className="text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              Already have a sponsor account?{' '}
              <Link to="/auth/signin" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
            <p className="text-muted-foreground">
              Looking to join as a creator or fan?{' '}
              <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                Regular signup
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SponsorSignUp;