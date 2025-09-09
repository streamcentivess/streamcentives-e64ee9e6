import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type ConfirmationStatus = 'idle' | 'loading' | 'success' | 'error';

export const useEmailConfirmation = () => {
  const [status, setStatus] = useState<ConfirmationStatus>('idle');
  
  const confirmWithToken = async (token: string, type: 'signup' | 'recovery' | 'invite' = 'signup') => {
    setStatus('loading');
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type
      });

      if (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        toast({
          title: "Confirmation Failed",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      if (data.user) {
        setStatus('success');
        toast({
          title: "Email Confirmed!",
          description: "Your email has been successfully verified.",
        });
        return { success: true, user: data.user };
      }

      return { success: false, error: new Error('Unknown error') };
    } catch (error) {
      console.error('Unexpected confirmation error:', error);
      setStatus('error');
      toast({
        title: "Confirmation Failed",
        description: "An unexpected error occurred while confirming your email.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  const confirmWithOtp = async (token: string, email: string, type: 'signup' | 'recovery' | 'invite' = 'signup') => {
    setStatus('loading');
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token: token.trim(),
        type,
        email: email.trim()
      });

      if (error) {
        setStatus('error');
        toast({
          title: "Invalid Token",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      if (data.user) {
        setStatus('success');
        toast({
          title: "Email Confirmed!",
          description: "Your email has been successfully verified.",
        });
        return { success: true, user: data.user };
      }

      return { success: false, error: new Error('Unknown error') };
    } catch (error) {
      console.error('Manual token confirmation error:', error);
      setStatus('error');
      toast({
        title: "Confirmation Failed",
        description: "Please check your token and try again.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  const resendConfirmation = async (email: string, type: 'signup' = 'signup') => {
    try {
      const { error } = await supabase.auth.resend({
        type,
        email: email.trim()
      });

      if (error) {
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      toast({
        title: "Email Sent",
        description: "We've sent you a new confirmation email.",
      });
      return { success: true };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast({
        title: "Resend Failed",
        description: "Failed to resend confirmation email.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return {
    status,
    confirmWithToken,
    confirmWithOtp,
    resendConfirmation,
    setStatus
  };
};