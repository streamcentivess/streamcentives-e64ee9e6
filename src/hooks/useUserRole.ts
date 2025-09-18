import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'fan' | 'creator' | 'sponsor';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const checkUserRole = async () => {
      try {
        // Check if user is a sponsor
        const { data: sponsorProfile } = await supabase
          .from('sponsor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (sponsorProfile) {
          setRole('sponsor');
          setLoading(false);
          return;
        }

        // For now, default to fan if not a sponsor
        // Later we can add logic to detect creators
        setRole('fan');
      } catch (error) {
        console.error('Error checking user role:', error);
        setRole('fan'); // Default fallback
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  return { role, loading };
};