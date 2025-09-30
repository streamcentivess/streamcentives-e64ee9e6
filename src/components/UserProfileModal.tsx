import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      // Fetch username and navigate to profile
      const fetchAndNavigate = async () => {
        const { data } = await supabase.from('profiles').select('username').eq('user_id', userId).maybeSingle();
        if (data?.username) {
          navigate(`/${data.username}`);
        } else {
          navigate(`/universal-profile?userId=${userId}`); // Fallback
        }
        onClose();
      };
      fetchAndNavigate();
    }
  }, [isOpen, userId, navigate, onClose]);

  // Return null since we're redirecting instead of showing a modal
  return null;
}