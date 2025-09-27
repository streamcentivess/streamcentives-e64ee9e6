import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Website from "./Website";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to their profile
    if (user) {
      return;
    }

    // Check if user has previously created an account
    const hasCreatedAccount = localStorage.getItem('streamcentives_returning_user');
    const hasVisitedBefore = localStorage.getItem('streamcentives_visited');
    
    // If user has created an account before or has visited multiple times, go to sign in
    if (hasCreatedAccount === 'true') {
      navigate('/auth/signin');
      return;
    }

    // Track that user has visited (for future visits)
    if (!hasVisitedBefore) {
      localStorage.setItem('streamcentives_visited', 'true');
    }
  }, [user, loading, navigate]);

  // If user is authenticated, don't render the landing page
  if (user) {
    return null;
  }

  return <Website />;
};

export default Index;