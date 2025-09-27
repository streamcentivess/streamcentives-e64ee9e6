import React from 'react';
import StreamseekerArtistOnboarding from '@/components/StreamseekerArtistOnboarding';
import AppNavigation from '@/components/AppNavigation';

const StreamseekerOnboardingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <main className="py-6">
        <StreamseekerArtistOnboarding />
      </main>
    </div>
  );
};

export default StreamseekerOnboardingPage;