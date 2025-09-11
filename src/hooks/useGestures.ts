import { useRef, useCallback } from 'react';

interface GestureHandlers {
  onDoubleTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onPinchZoom?: (scale: number) => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useGestures({
  onDoubleTap,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onPinchZoom,
}: GestureHandlers) {
  const lastTouchRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    // Handle pinch gesture
    if (e.touches.length === 2 && onPinchZoom) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      initialPinchDistanceRef.current = distance;
      return;
    }

    // Single touch handling
    if (e.touches.length === 1) {
      const touchPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
      };

      // Check for double tap
      if (lastTouchRef.current && onDoubleTap) {
        const timeDiff = now - lastTouchRef.current.time;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - lastTouchRef.current.x, 2) + 
          Math.pow(touch.clientY - lastTouchRef.current.y, 2)
        );
        
        if (timeDiff < 300 && distance < 50) {
          onDoubleTap();
          lastTouchRef.current = null;
          return;
        }
      }

      lastTouchRef.current = touchPoint;

      // Start long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress();
        }, 500);
      }
    }
  }, [onDoubleTap, onLongPress, onPinchZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Handle pinch zoom
    if (e.touches.length === 2 && onPinchZoom && initialPinchDistanceRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scale = distance / initialPinchDistanceRef.current;
      onPinchZoom(scale);
      return;
    }

    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [onPinchZoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle swipe gesture
    if (lastTouchRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - lastTouchRef.current.x;
      const deltaY = touch.clientY - lastTouchRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDiff = Date.now() - lastTouchRef.current.time;

      // Swipe detection (minimum distance and speed)
      if (distance > 50 && timeDiff < 300) {
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        
        if (isHorizontalSwipe) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }
    }

    // Reset pinch
    initialPinchDistanceRef.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}