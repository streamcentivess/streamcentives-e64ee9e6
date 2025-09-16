import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { toast } from 'sonner';

interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export const useMobileCapabilities = () => {
  const [isNative, setIsNative] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'unknown'
  });
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    if (Capacitor.isNativePlatform()) {
      initializeCapabilities();
    }
  }, []);

  const initializeCapabilities = async () => {
    try {
      // Initialize Status Bar
      await StatusBar.setStyle({ style: Style.Dark });
      
      // Initialize Network monitoring
      const status = await Network.getStatus();
      setNetworkStatus({
        connected: status.connected,
        connectionType: status.connectionType
      });

      // Listen for network changes
      Network.addListener('networkStatusChange', (status) => {
        setNetworkStatus({
          connected: status.connected,
          connectionType: status.connectionType
        });
        
        if (!status.connected) {
          toast.error('You are now offline');
        } else {
          toast.success('Connection restored');
        }
      });

      // Initialize Keyboard listeners
      Keyboard.addListener('keyboardWillShow', () => {
        setKeyboardOpen(true);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardOpen(false);
      });

      // Initialize Push Notifications
      await initializePushNotifications();
      
    } catch (error) {
      console.error('Error initializing mobile capabilities:', error);
    }
  };

  const initializePushNotifications = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Request permission
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        await PushNotifications.register();
        
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          // TODO: Send token to backend
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ' + JSON.stringify(notification));
          
          // Show local notification when app is in foreground
          LocalNotifications.schedule({
            notifications: [
              {
                title: notification.title || 'StreamCentives',
                body: notification.body || 'You have a new notification',
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 1000) },
                sound: 'default',
                attachments: notification.data?.imageUrl ? [
                  { id: 'image', url: notification.data.imageUrl }
                ] : undefined,
                actionTypeId: 'OPEN_APP',
                extra: notification.data
              }
            ]
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
          // Handle notification tap
          if (notification.notification.data?.url) {
            // Navigate to specific screen
            window.location.href = notification.notification.data.url;
          }
        });
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  };

  // Haptic feedback functions
  const hapticImpact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Haptic feedback failed:', error);
      }
    }
  }, []);

  const hapticVibrate = useCallback(async (duration: number = 300) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.vibrate({ duration });
      } catch (error) {
        console.error('Haptic vibrate failed:', error);
      }
    }
  }, []);

  // Local notifications
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduledAt?: Date,
    data?: any
  ) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, data });
      }
      return;
    }

    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              schedule: scheduledAt ? { at: scheduledAt } : { at: new Date(Date.now() + 1000) },
              sound: 'default',
              extra: data
            }
          ]
        });
      }
    } catch (error) {
      console.error('Local notification failed:', error);
    }
  }, []);

  // Status bar utilities
  const setStatusBarStyle = useCallback(async (style: Style) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style });
      } catch (error) {
        console.error('Status bar style failed:', error);
      }
    }
  }, []);

  const hideStatusBar = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.hide();
      } catch (error) {
        console.error('Hide status bar failed:', error);
      }
    }
  }, []);

  const showStatusBar = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.show();
      } catch (error) {
        console.error('Show status bar failed:', error);
      }
    }
  }, []);

  // Keyboard utilities
  const hideKeyboard = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.hide();
      } catch (error) {
        console.error('Hide keyboard failed:', error);
      }
    }
  }, []);

  return {
    isNative,
    networkStatus,
    keyboardOpen,
    
    // Haptic functions
    hapticImpact,
    hapticVibrate,
    
    // Notification functions
    scheduleNotification,
    
    // Status bar functions
    setStatusBarStyle,
    hideStatusBar,
    showStatusBar,
    
    // Keyboard functions
    hideKeyboard,
    
    // Platform info
    platform: Capacitor.getPlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios'
  };
};