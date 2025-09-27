import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  isVerified: boolean;
  followerCount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  followerCount,
  size = 'md',
  className = ''
}) => {
  if (!isVerified) return null;

  const getBadgeColor = () => {
    if (followerCount >= 100000) return 'text-yellow-500'; // Gold for 100k+
    if (followerCount >= 10000) return 'text-blue-500'; // Blue for 10k+
    return 'text-green-500'; // Green for verified
  };

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <CheckCircle 
      className={cn(
        sizeClasses[size],
        getBadgeColor(),
        'fill-current',
        className
      )}
      aria-label={
        followerCount >= 100000 
          ? 'Gold verified creator (100k+ followers)'
          : followerCount >= 10000 
          ? 'Blue verified creator (10k+ followers)'
          : 'Verified creator'
      }
    />
  );
};