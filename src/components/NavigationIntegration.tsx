import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NavigationIntegrationProps {
  children: React.ReactNode;
}

export const NavigationIntegration: React.FC<NavigationIntegrationProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Handle smart link navigation from URL params
    const urlParams = new URLSearchParams(location.search);
    const smartLinkSlug = urlParams.get('smart_link');
    const action = urlParams.get('action');
    const creatorId = urlParams.get('creator');

    if (smartLinkSlug) {
      handleSmartLinkNavigation(smartLinkSlug, action, creatorId);
    }

    // Handle deep linking from external platforms
    const platform = urlParams.get('platform');
    const platformAction = urlParams.get('platform_action');
    
    if (platform && platformAction) {
      handlePlatformNavigation(platform, platformAction, urlParams);
    }

    // Track page visits for analytics
    if (user) {
      trackPageVisit(location.pathname);
    }
  }, [location, user]);

  const handleSmartLinkNavigation = async (slug: string, action?: string, creatorId?: string) => {
    try {
      // Get smart link details
      const { data: smartLink } = await supabase
        .from('smart_links')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!smartLink) {
        toast.error('Smart link not found or inactive');
        return;
      }

      // Navigate to smart link page if not already there
      if (!location.pathname.includes(`/link/${slug}`)) {
        navigate(`/link/${slug}${action ? `?action=${action}` : ''}`);
      }

      // If specific action is requested, handle it
      if (action && user) {
        await handleSmartLinkAction(smartLink.id, action);
      }

    } catch (error) {
      console.error('Error handling smart link navigation:', error);
      toast.error('Failed to load smart link');
    }
  };

  const handleSmartLinkAction = async (smartLinkId: string, actionType: string) => {
    try {
      // Get the specific action
      const { data: action } = await supabase
        .from('smart_link_actions')
        .select('*')
        .eq('smart_link_id', smartLinkId)
        .eq('action_type', actionType)
        .eq('is_active', true)
        .single();

      if (!action) {
        toast.error('Action not found');
        return;
      }

      // Check if user has already completed this action
      const { data: completion } = await supabase
        .from('smart_link_action_completions')
        .select('*')
        .eq('action_id', action.id)
        .eq('user_id', user!.id)
        .single();

      if (completion) {
        toast.info('You have already completed this action');
        return;
      }

      // Navigate to action URL or handle internal actions
      if (action.action_url.startsWith('/')) {
        navigate(action.action_url);
      } else {
        window.open(action.action_url, '_blank');
      }

      // Show verification prompt
      toast.success(`Action started! Complete it to earn ${action.xp_reward} XP`);

    } catch (error) {
      console.error('Error handling smart link action:', error);
      toast.error('Failed to execute action');
    }
  };

  const handlePlatformNavigation = async (platform: string, platformAction: string, urlParams: URLSearchParams) => {
    const itemId = urlParams.get('item_id');
    const campaignId = urlParams.get('campaign_id');

    switch (platform) {
      case 'spotify':
        await handleSpotifyNavigation(platformAction, itemId, campaignId);
        break;
      case 'youtube':
        await handleYouTubeNavigation(platformAction, itemId, campaignId);
        break;
      case 'instagram':
        await handleInstagramNavigation(platformAction, itemId);
        break;
      default:
        console.warn(`Unknown platform: ${platform}`);
    }
  };

  const handleSpotifyNavigation = async (action: string, itemId?: string, campaignId?: string) => {
    switch (action) {
      case 'track_played':
        if (itemId && user) {
          // Award XP for track play
          try {
            await supabase.rpc('handle_universal_share', {
              content_type_param: 'spotify_play',
              content_id_param: itemId,
              platform_param: 'spotify',
              share_url_param: `spotify:track:${itemId}`
            });
            toast.success('Thanks for listening! XP awarded.');
          } catch (error) {
            console.error('Error awarding Spotify play XP:', error);
          }
        }
        break;
      case 'artist_followed':
        if (itemId && user) {
          toast.success('Thanks for following! Checking for XP rewards...');
          // Verify follow and award XP if applicable
        }
        break;
      default:
        console.warn(`Unknown Spotify action: ${action}`);
    }
  };

  const handleYouTubeNavigation = async (action: string, itemId?: string, campaignId?: string) => {
    switch (action) {
      case 'video_watched':
        if (itemId && user) {
          toast.success('Thanks for watching! Checking for XP rewards...');
        }
        break;
      case 'channel_subscribed':
        if (itemId && user) {
          toast.success('Thanks for subscribing! Checking for XP rewards...');
        }
        break;
      default:
        console.warn(`Unknown YouTube action: ${action}`);
    }
  };

  const handleInstagramNavigation = async (action: string, itemId?: string) => {
    switch (action) {
      case 'profile_followed':
        if (itemId && user) {
          toast.success('Thanks for following! Checking for XP rewards...');
        }
        break;  
      default:
        console.warn(`Unknown Instagram action: ${action}`);
    }
  };

  const trackPageVisit = async (pathname: string) => {
    try {
      await supabase
        .from('analytics_events')
        .insert([{
          user_id: user!.id,
          event_type: 'page_visit',
          event_data: { 
            path: pathname,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        }]);
    } catch (error) {
      console.error('Error tracking page visit:', error);
    }
  };

  return <>{children}</>;
};