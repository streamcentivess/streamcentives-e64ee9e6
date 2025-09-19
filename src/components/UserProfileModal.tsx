import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      // Navigate to the universal profile page instead of showing modal
      navigate(`/universal-profile?user=${userId}`);
      onClose(); // Close the modal immediately
    }
  }, [isOpen, userId, navigate, onClose]);

  // Return null since we're redirecting instead of showing a modal
  return null;
}