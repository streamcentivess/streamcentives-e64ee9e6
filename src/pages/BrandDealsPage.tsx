import React from 'react';
import { BrandDealsDashboard } from '@/components/BrandDealsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrandDealsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/creator-dashboard')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creator Dashboard
      </Button>
      <BrandDealsDashboard />
    </div>
  );
};

export default BrandDealsPage;