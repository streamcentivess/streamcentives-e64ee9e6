import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Mic, 
  Video, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Users, 
  Palette, 
  Star,
  BookOpen,
  Dumbbell,
  ChefHat,
  GraduationCap,
  Heart,
  Laptop,
  Plane,
  Smile
} from 'lucide-react';

interface CreatorTypeBadgeProps {
  creatorType: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const CreatorTypeBadge: React.FC<CreatorTypeBadgeProps> = ({ 
  creatorType, 
  showIcon = true, 
  size = 'default' 
}) => {
  const getCreatorTypeInfo = (type: string) => {
    const types = {
      'musician': { 
        label: 'Musician', 
        icon: Music, 
        emoji: '🎵', 
        color: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-700'
      },
      'podcaster': { 
        label: 'Podcaster', 
        icon: Mic, 
        emoji: '🎙️', 
        color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700'
      },
      'video_creator': { 
        label: 'Video Creator', 
        icon: Video, 
        emoji: '🎥', 
        color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700'
      },
      'comedian': { 
        label: 'Comedian', 
        icon: Sparkles, 
        emoji: '😄', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700'
      },
      'author': { 
        label: 'Author', 
        icon: BookOpen, 
        emoji: '📚', 
        color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
      },
      'artist': { 
        label: 'Visual Artist', 
        icon: Palette, 
        emoji: '🎨', 
        color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700'
      },
      'dancer': { 
        label: 'Dancer', 
        icon: Heart, 
        emoji: '💃', 
        color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700'
      },
      'gamer': { 
        label: 'Gamer', 
        icon: Target, 
        emoji: '🎮', 
        color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700'
      },
      'fitness_trainer': { 
        label: 'Fitness Trainer', 
        icon: Dumbbell, 
        emoji: '💪', 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
      },
      'chef': { 
        label: 'Chef', 
        icon: ChefHat, 
        emoji: '👨‍🍳', 
        color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
      },
      'educator': { 
        label: 'Educator', 
        icon: GraduationCap, 
        emoji: '🎓', 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700'
      },
      'lifestyle_influencer': { 
        label: 'Lifestyle Influencer', 
        icon: Heart, 
        emoji: '✨', 
        color: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-700'
      },
      'tech_creator': { 
        label: 'Tech Creator', 
        icon: Laptop, 
        emoji: '💻', 
        color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600'
      },
      'beauty_creator': { 
        label: 'Beauty Creator', 
        icon: Sparkles, 
        emoji: '💄', 
        color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 dark:border-fuchsia-700'
      },
      'travel_creator': { 
        label: 'Travel Creator', 
        icon: Plane, 
        emoji: '✈️', 
        color: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700'
      },
      'other': { 
        label: 'Creator', 
        icon: Star, 
        emoji: '🌟', 
        color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
      }
    };

    return types[type as keyof typeof types] || types.other;
  };

  const typeInfo = getCreatorTypeInfo(creatorType);
  const Icon = typeInfo.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant="outline" 
      className={`
        ${typeInfo.color} 
        ${sizeClasses[size]} 
        inline-flex items-center gap-1.5 font-medium border
      `}
    >
      {showIcon && (
        <span className="text-sm">{typeInfo.emoji}</span>
      )}
      {typeInfo.label}
    </Badge>
  );
};