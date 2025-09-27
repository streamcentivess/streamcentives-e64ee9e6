import React from 'react';
import { Check } from 'lucide-react';
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
    if (followerCount >= 100000) return 'bg-yellow-500'; // Gold for 100k+
    if (followerCount >= 10000) return 'bg-blue-500'; // Blue for 10k+
    return 'bg-green-500'; // Green for verified
  };

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const checkSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5'
  };

  return (
    <div 
      className={cn(
        sizeClasses[size],
        getBadgeColor(),
        'rounded-full flex items-center justify-center shadow-sm',
        className
      )}
      aria-label={
        followerCount >= 100000 
          ? 'Gold verified creator (100k+ followers)'
          : followerCount >= 10000 
          ? 'Blue verified creator (10k+ followers)'
          : 'Verified creator'
      }
    >
      <Check 
        className={cn(
          checkSizeClasses[size],
          'text-white stroke-[3]'
        )}
      />
    </div>
  );
};