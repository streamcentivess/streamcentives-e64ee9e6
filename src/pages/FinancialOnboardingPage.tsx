import { EnhancedFinancialOnboarding } from '@/components/EnhancedFinancialOnboarding';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

const FinancialOnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole();

  const handleComplete = () => {
    // Redirect based on user role
    switch (role) {
      case 'creator':
        navigate('/creator-dashboard');
        break;
      case 'sponsor':
        navigate('/sponsor-dashboard');
        break;
      case 'fan':
        navigate('/fan-dashboard');
        break;
      default:
        navigate('/universal-profile');
    }
  };

  if (!user) {
    navigate('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <EnhancedFinancialOnboarding onComplete={handleComplete} />
    </div>
  );
};

export default FinancialOnboardingPage;