import { Trophy, Medal, Award } from 'lucide-react';
import { useLeaderboardPosition } from '@/hooks/useLeaderboardPosition';
import { Badge } from '@/components/ui/badge';

interface LeaderboardPositionProps {
  creatorId: string;
  className?: string;
}

export const LeaderboardPosition = ({ creatorId, className = '' }: LeaderboardPositionProps) => {
  const { position, totalXP, loading } = useLeaderboardPosition(creatorId);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>
      </div>
    );
  }

  if (!position) {
    return null;
  }

  const getPositionIcon = () => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (position === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return <Trophy className="h-4 w-4 text-muted-foreground" />;
  };

  const getPositionBadge = () => {
    if (position <= 3) return 'default';
    if (position <= 10) return 'secondary';
    return 'outline';
  };

  const getPositionText = () => {
    if (position === 1) return '1st';
    if (position === 2) return '2nd';
    if (position === 3) return '3rd';
    return `${position}th`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getPositionIcon()}
      <Badge variant={getPositionBadge()} className="text-xs">
        {getPositionText()} • {totalXP} XP
      </Badge>
    </div>
  );
};