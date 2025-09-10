import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('useUnreadMessages: No user found');
      setUnreadCount(0);
      return;
    }

    console.log('useUnreadMessages: Setting up for user:', user.id);

    const fetchUnreadCount = async () => {
      try {
        console.log('useUnreadMessages: Fetching unread count...');
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('status', 'pending');

        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }

        console.log('useUnreadMessages: Unread count:', count);
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error in fetchUnreadCount:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('useUnreadMessages: Real-time update received:', payload);
          
          // Handle different events more efficiently
          if (payload.eventType === 'INSERT') {
            // New message received - check if it's pending
            if (payload.new && payload.new.status === 'pending') {
              console.log('useUnreadMessages: New pending message, incrementing count');
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Message status changed
            const oldStatus = payload.old?.status;
            const newStatus = payload.new?.status;
            
            if (oldStatus === 'pending' && newStatus !== 'pending') {
              console.log('useUnreadMessages: Message approved/denied, decrementing count');
              setUnreadCount(prev => Math.max(0, prev - 1));
            } else if (oldStatus !== 'pending' && newStatus === 'pending') {
              console.log('useUnreadMessages: Message set to pending, incrementing count');
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'DELETE') {
            // Message deleted - refetch to be safe
            console.log('useUnreadMessages: Message deleted, refetching count');
            fetchUnreadCount();
          } else {
            // For other events, refetch to be safe
            console.log('useUnreadMessages: Other event, refetching count');
            fetchUnreadCount();
          }
        }
      )
      .subscribe((status) => {
        console.log('useUnreadMessages: Subscription status:', status);
      });

    return () => {
      console.log('useUnreadMessages: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
};