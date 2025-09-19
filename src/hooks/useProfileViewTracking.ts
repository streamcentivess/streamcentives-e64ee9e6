import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UseProfileViewTrackingProps {
  profileUserId: string | null;
  isOwnProfile: boolean;
  enabled?: boolean;
}

export const useProfileViewTracking = ({ 
  profileUserId, 
  isOwnProfile, 
  enabled = true 
}: UseProfileViewTrackingProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user || !profileUserId || isOwnProfile) {
      return;
    }

    const trackProfileView = async () => {
      try {
        // Check if this user has already viewed this profile today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingView } = await supabase
          .from('profile_views')
          .select('id')
          .eq('viewer_id', user.id)
          .eq('viewed_user_id', profileUserId)
          .gte('viewed_at', `${today}T00:00:00.000Z`)
          .lt('viewed_at', `${today}T23:59:59.999Z`)
          .maybeSingle();

        if (existingView) {
          return; // Already viewed today
        }

        // Record the profile view
        const { error: viewError } = await supabase
          .from('profile_views')
          .insert({
            viewer_id: user.id,
            viewed_user_id: profileUserId,
            source: 'profile_page'
          });

        if (viewError) {
          console.error('Error recording profile view:', viewError);
          return;
        }

        // Get viewer's profile info for notification
        const { data: viewerProfile } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url')
          .eq('user_id', user.id)
          .single();

        const viewerName = viewerProfile?.display_name || viewerProfile?.username || 'Someone';

        // Create notification for profile owner
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: profileUserId,
            type: 'profile_view',
            title: 'Profile View',
            message: `${viewerName} viewed your profile`,
            data: {
              viewer_id: user.id,
              viewer_name: viewerName,
              viewer_avatar: viewerProfile?.avatar_url,
              source: 'profile_page'
            },
            priority: 'low'
          });

        if (notificationError) {
          console.error('Error creating profile view notification:', notificationError);
        }
      } catch (error) {
        console.error('Error in profile view tracking:', error);
      }
    };

    // Track the view after a short delay to ensure the user actually viewed the profile
    const timer = setTimeout(trackProfileView, 2000);

    return () => clearTimeout(timer);
  }, [user, profileUserId, isOwnProfile, enabled]);
};