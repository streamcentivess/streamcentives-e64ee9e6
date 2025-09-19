import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSocialNotifications = () => {
  const { user } = useAuth();

  const createSocialNotification = useCallback(async (
    targetUserId: string,
    interactionType: 'like' | 'comment' | 'repost' | 'share' | 'follow' | 'tag',
    contentType?: string,
    contentId?: string,
    additionalData?: any
  ) => {
    if (!user || user.id === targetUserId) {
      return; // Don't notify yourself
    }

    try {
      // Get actor's profile info
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('user_id', user.id)
        .single();

      const actorName = actorProfile?.display_name || actorProfile?.username || 'Someone';

      // Create notification message based on interaction type
      let title = '';
      let message = '';
      let priority = 'normal';

      switch (interactionType) {
        case 'like':
          title = '❤️ New Like';
          message = `${actorName} liked your ${contentType || 'post'}`;
          priority = 'normal';
          break;
        case 'comment':
          title = '💬 New Comment';
          message = `${actorName} commented on your ${contentType || 'post'}`;
          priority = 'high';
          break;
        case 'repost':
          title = '🔄 Content Reposted';
          message = `${actorName} reposted your ${contentType || 'post'}`;
          priority = 'high';
          break;
        case 'share':
          title = '📤 Content Shared';
          message = `${actorName} shared your ${contentType || 'post'}`;
          priority = 'high';
          break;
        case 'follow':
          title = '👥 New Follower';
          message = `${actorName} started following you`;
          priority = 'high';
          break;
        case 'tag':
          title = '🏷️ You were tagged';
          message = `${actorName} tagged you in a ${contentType || 'post'}`;
          priority = 'high';
          break;
        default:
          title = '🔔 New Interaction';
          message = `${actorName} interacted with your content`;
      }

      // Create the notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'social_interaction',
          title,
          message,
          data: {
            interaction_type: interactionType,
            content_type: contentType,
            content_id: contentId,
            actor_id: user.id,
            actor_name: actorName,
            actor_avatar: actorProfile?.avatar_url,
            ...additionalData
          },
          priority
        });

      if (error) {
        console.error('Error creating social notification:', error);
      }
    } catch (error) {
      console.error('Error in social notification creation:', error);
    }
  }, [user]);

  return { createSocialNotification };
};