import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import StreamseekerDashboard from '@/components/StreamseekerDashboard';
import StreamseekerArtistOnboarding from '@/components/StreamseekerArtistOnboarding';
import AppNavigation from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';

const StreamseekerPage = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user || role !== 'creator') {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('streamseeker_artists')
          .select('eligibility_status')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking verification status:', error);
        }

        setIsVerified(data?.eligibility_status === 'approved');
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [user, role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <main className="py-6">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <main className="py-6">
        {role === 'creator' && !isVerified ? (
          <StreamseekerArtistOnboarding />
        ) : (
          <StreamseekerDashboard />
        )}
      </main>
    </div>
  );
};

export default StreamseekerPage;