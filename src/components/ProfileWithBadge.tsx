import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreatorTypeBadge } from './CreatorTypeBadge';
import { VerificationBadge } from './VerificationBadge';

interface ProfileWithBadgeProps {
  profile: {
    avatar_url?: string;
    display_name?: string;
    username?: string;
    creator_type?: string;
    bio?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showBio?: boolean;
  className?: string;
  followerCount?: number;
  isVerified?: boolean;
}

export const ProfileWithBadge: React.FC<ProfileWithBadgeProps> = ({
  profile,
  size = 'md',
  showBio = false,
  className = '',
  followerCount = 0,
  isVerified = false
}) => {
  const avatarSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Avatar className={avatarSizes[size]}>
        <AvatarImage src={profile.avatar_url} />
        <AvatarFallback>
          {(profile.display_name || profile.username || 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`${textSizes[size]} font-semibold truncate`}>
            {profile.display_name || profile.username}
          </h3>
          <div className="flex items-center gap-1">
            {profile.creator_type && (
              <CreatorTypeBadge 
                creatorType={profile.creator_type} 
                size={size === 'lg' ? 'default' : 'sm'}
              />
            )}
            <VerificationBadge 
              isVerified={isVerified}
              followerCount={followerCount}
              size={size}
            />
          </div>
        </div>
        
        {profile.username && profile.display_name && (
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        )}
        
        {showBio && profile.bio && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
};