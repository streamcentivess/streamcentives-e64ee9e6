import React, { useRef, useEffect } from 'react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { ImpactStyle } from '@capacitor/haptics';

interface SwipeGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  enableHaptics?: boolean;
}

const SwipeGestures = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className = '',
  enableHaptics = true
}: SwipeGesturesProps) => {
  const { hapticImpact, isNative } = useMobileCapabilities();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const minSwipeDistance = 50;
      const maxVerticalDistance = 100;

      // Horizontal swipes
      if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
        if (enableHaptics && isNative) {
          await hapticImpact(ImpactStyle.Light);
        }

        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      // Vertical swipes
      const maxHorizontalDistance = 100;
      if (Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaX) < maxHorizontalDistance) {
        if (enableHaptics && isNative) {
          await hapticImpact(ImpactStyle.Light);
        }

        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, enableHaptics, hapticImpact, isNative]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

export default SwipeGestures;