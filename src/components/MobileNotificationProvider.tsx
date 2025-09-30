import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNotificationToast } from './MobileNotificationToast';
import { useOptimizedRealtime } from '@/hooks/useOptimizedRealtime';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  created_at: string;
  priority: string;
  is_read: boolean;
}

interface MobileNotificationContextType {
  showNotification: (notification: Notification) => void;
  dismissNotification: (id: string) => void;
}

const MobileNotificationContext = createContext<MobileNotificationContextType | undefined>(undefined);

export const useMobileNotifications = () => {
  const context = useContext(MobileNotificationContext);
  if (!context) {
    throw new Error('useMobileNotifications must be used within MobileNotificationProvider');
  }
  return context;
};

interface MobileNotificationProviderProps {
  children: ReactNode;
}

export function MobileNotificationProvider({ children }: MobileNotificationProviderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  // Set up real-time updates for new notifications
  useOptimizedRealtime({
    table: 'notifications',
    filter: `user_id=eq.${user?.id}`,
    onUpdate: handleNewNotification,
    enabled: !!user
  });

  async function handleNewNotification() {
    if (!user) return;

    try {
      // Fetch only new notifications since last fetch
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .gt('created_at', lastFetchTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        // Show new notifications as toasts
        data.forEach((notification) => {
          // Only show high priority or social/profile view notifications
          if (notification.priority === 'high' || 
              ['social_interaction', 'profile_view', 'follow'].includes(notification.type)) {
            showNotification(notification);
          }
        });
        
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching new notifications:', error);
    }
  }

  const showNotification = (notification: Notification) => {
    // Don't show duplicate notifications
    if (activeNotifications.some(n => n.id === notification.id)) {
      return;
    }

    setActiveNotifications(prev => [notification, ...prev.slice(0, 2)]); // Max 3 notifications
  };

  const dismissNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationTap = async (notification: Notification) => {
    // Mark as read
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'social_interaction':
        if (notification.data?.actor_username) {
          navigate(`/${notification.data.actor_username}`);
        } else if (notification.data?.actor_id) {
          const { data } = await supabase.from('profiles').select('username').eq('user_id', notification.data.actor_id).maybeSingle();
          if (data?.username) navigate(`/${data.username}`);
        }
        break;
      case 'profile_view':
        if (notification.data?.viewer_username) {
          navigate(`/${notification.data.viewer_username}`);
        } else if (notification.data?.viewer_id) {
          const { data } = await supabase.from('profiles').select('username').eq('user_id', notification.data.viewer_id).maybeSingle();
          if (data?.username) navigate(`/${data.username}`);
        }
        break;
      case 'follow':
        if (notification.data?.follower_username) {
          navigate(`/${notification.data.follower_username}`);
        } else if (notification.data?.follower_id) {
          const { data } = await supabase.from('profiles').select('username').eq('user_id', notification.data.follower_id).maybeSingle();
          if (data?.username) navigate(`/${data.username}`);
        }
        break;
    }
  };

  useEffect(() => {
    if (user) {
      setLastFetchTime(new Date());
    }
  }, [user]);

  return (
    <MobileNotificationContext.Provider value={{ showNotification, dismissNotification }}>
      {children}
      
      {/* Render active notification toasts */}
      {activeNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ 
            zIndex: 100 - index,
            transform: `translateY(${index * 20}px)` 
          }}
        >
          <MobileNotificationToast
            notification={notification}
            onDismiss={() => dismissNotification(notification.id)}
            onTap={() => handleNotificationTap(notification)}
          />
        </div>
      ))}
    </MobileNotificationContext.Provider>
  );
}