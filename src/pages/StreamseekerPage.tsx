import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import StreamseekerDashboard from '@/components/StreamseekerDashboard';
import StreamseekerArtistOnboarding from '@/components/StreamseekerArtistOnboarding';
import AppNavigation from '@/components/AppNavigation';

const StreamseekerPage = () => {
  const { role } = useUserRole();

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <main className="py-6">
        <StreamseekerDashboard />
      </main>
    </div>
  );
};

export default StreamseekerPage;