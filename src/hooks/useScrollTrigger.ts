import { useEffect, useRef } from 'react';

interface UseScrollTriggerOptions {
  onTrigger: () => void;
  threshold?: number; // How much to scroll before triggering (in pixels)
  cooldown?: number; // Minimum time between triggers (in ms)
  enabled?: boolean;
}

export const useScrollTrigger = ({
  onTrigger,
  threshold = 1000,
  cooldown = 30000, // 30 seconds default
  enabled = true
}: UseScrollTriggerOptions) => {
  const lastTriggerTime = useRef<number>(0);
  const scrollDistance = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const now = Date.now();
      
      // Check cooldown
      if (now - lastTriggerTime.current < cooldown) {
        return;
      }

      // Track scroll distance
      scrollDistance.current += Math.abs(window.pageYOffset - (scrollDistance.current || 0));

      // Trigger if threshold reached
      if (scrollDistance.current >= threshold) {
        onTrigger();
        lastTriggerTime.current = now;
        scrollDistance.current = 0;
      }
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [onTrigger, threshold, cooldown, enabled]);
};