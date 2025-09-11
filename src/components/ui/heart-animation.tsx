import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeartAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  className?: string;
}

export function HeartAnimation({ isVisible, onComplete, className }: HeartAnimationProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center pointer-events-none z-50",
      className
    )}>
      {/* Multiple hearts for burst effect */}
      {[...Array(6)].map((_, i) => (
        <Heart
          key={i}
          className={cn(
            "absolute text-red-500 fill-red-500 animate-ping",
            "w-8 h-8 opacity-90",
            // Stagger the animations
            i === 0 && "animate-[ping_0.6s_ease-out_forwards]",
            i === 1 && "animate-[ping_0.6s_ease-out_0.1s_forwards] -translate-x-3 -translate-y-2",
            i === 2 && "animate-[ping_0.6s_ease-out_0.2s_forwards] translate-x-3 -translate-y-2",
            i === 3 && "animate-[ping_0.6s_ease-out_0.1s_forwards] -translate-x-4 translate-y-1",
            i === 4 && "animate-[ping_0.6s_ease-out_0.2s_forwards] translate-x-4 translate-y-1",
            i === 5 && "animate-[ping_0.6s_ease-out_0.3s_forwards] scale-125"
          )}
        />
      ))}
      
      {/* Central burst effect */}
      <div className="absolute inset-0 rounded-full bg-red-500/20 animate-[ping_0.4s_ease-out_forwards] scale-150" />
    </div>
  );
}