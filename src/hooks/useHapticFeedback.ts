import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // Check if device supports haptic feedback
    if ('vibrate' in navigator) {
      let pattern: number | number[];
      
      switch (type) {
        case 'light':
          pattern = 10;
          break;
        case 'medium':
          pattern = 20;
          break;
        case 'heavy':
          pattern = 50;
          break;
        case 'success':
          pattern = [10, 30, 10];
          break;
        case 'warning':
          pattern = [20, 50];
          break;
        case 'error':
          pattern = [50, 100, 50];
          break;
        default:
          pattern = 10;
      }
      
      navigator.vibrate(pattern);
    }

    // iOS Safari haptic feedback (if supported)
    if ('hapticFeedback' in window) {
      try {
        switch (type) {
          case 'light':
            // @ts-ignore
            window.hapticFeedback.impact({ style: 'light' });
            break;
          case 'medium':
            // @ts-ignore
            window.hapticFeedback.impact({ style: 'medium' });
            break;
          case 'heavy':
            // @ts-ignore
            window.hapticFeedback.impact({ style: 'heavy' });
            break;
          case 'success':
            // @ts-ignore
            window.hapticFeedback.notification({ type: 'success' });
            break;
          case 'warning':
            // @ts-ignore
            window.hapticFeedback.notification({ type: 'warning' });
            break;
          case 'error':
            // @ts-ignore
            window.hapticFeedback.notification({ type: 'error' });
            break;
        }
      } catch (error) {
        // Fallback to vibration if haptic feedback fails
        navigator.vibrate?.(10);
      }
    }
  }, []);

  return { triggerHaptic };
}