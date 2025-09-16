import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  priority: string;
  action_url?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification change:', payload);
          
          // Handle real-time updates
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast for new notifications
            if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
              toast({
                title: newNotification.title,
                description: newNotification.message,
                duration: 5000
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
            
            // Update unread count
            if (payload.old?.is_read === false && payload.new?.is_read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            setNotifications(prev => prev.filter(n => n.id !== deletedId));
            
            // Update unread count if deleted notification was unread
            if (payload.old?.is_read === false) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, toast]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;

    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: notificationIds
      });

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      
      const unreadNotifications = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.is_read
      );
      setUnreadCount(prev => Math.max(0, prev - unreadNotifications.length));

      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, notifications, toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      return await markAsRead(unreadIds);
    }
    return true;
  }, [notifications, markAsRead]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, notifications, toast]);

  // Create a new notification (admin function)
  const createNotification = useCallback(async (
    userId: string,
    type: string,
    title: string,
    message: string,
    data = {},
    actionUrl?: string,
    priority = 'normal'
  ) => {
    try {
      const { data: notification, error } = await supabase.rpc('create_notification', {
        user_id_param: userId,
        type_param: type,
        title_param: title,
        message_param: message,
        data_param: data,
        action_url_param: actionUrl,
        priority_param: priority
      });

      if (error) throw error;

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification.",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  };
};