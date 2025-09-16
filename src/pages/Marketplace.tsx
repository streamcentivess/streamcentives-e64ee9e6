import React from 'react';
import EnhancedMarketplaceV3 from '@/components/EnhancedMarketplaceV3';
import AppNavigation from '@/components/AppNavigation';

const Marketplace = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <EnhancedMarketplaceV3 />
    </div>
  );
};

export default Marketplace;