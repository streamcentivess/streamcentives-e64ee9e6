import React from 'react';
import { EnhancedMarketplaceV2 } from '@/components/EnhancedMarketplaceV2';
import AppNavigation from '@/components/AppNavigation';

const Marketplace = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <EnhancedMarketplaceV2 />
    </div>
  );
};

export default Marketplace;