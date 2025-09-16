import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnhancedXPPurchase } from '@/components/EnhancedXPPurchase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function EnhancedPurchaseXP() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');

    if (sessionId && success === 'true') {
      verifyPurchase(sessionId);
    }
  }, [searchParams]);

  const verifyPurchase = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-verify-xp-purchase', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Purchase Successful!",
          description: `You've received ${data.xpAwarded} XP!`,
        });

        // Clear URL params
        window.history.replaceState({}, document.title, '/enhanced-purchase-xp');
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
      toast({
        title: "Verification Error",
        description: "There was an issue verifying your purchase. Please contact support.",
        variant: "destructive"
      });
    }
  };

  return <EnhancedXPPurchase />;
}