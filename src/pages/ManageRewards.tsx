import React from 'react';
import EnhancedManageRewards from '@/components/EnhancedManageRewards';
import AppNavigation from '@/components/AppNavigation';

const ManageRewards = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <EnhancedManageRewards />
    </div>
  );
};

export default ManageRewards;