import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link2, Music, Youtube, Instagram, Twitter, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SmartLinkButtonProps {
  userId: string;
  displayName: string;
  isOwnProfile: boolean;
}

interface SmartLink {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_active: boolean;
  total_clicks: number;
  created_at: string;
}

interface Action {
  id: string;
  action_type: string;
  action_label: string;
  action_url: string;
  xp_reward: number;
  is_active: boolean;
}

export const SmartLinkButton: React.FC<SmartLinkButtonProps> = ({
  userId,
  displayName,
  isOwnProfile
}) => {
  const { user } = useAuth();
  const [smartLink, setSmartLink] = useState<SmartLink | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    loadSmartLink();
  }, [userId]);

  const loadSmartLink = async () => {
    try {
      // Load the primary smart link for this user
      const { data: linkData, error: linkError } = await supabase
        .from('smart_links')
        .select('*')
        .eq('creator_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (linkError && linkError.code !== 'PGRST116') {
        throw linkError;
      }

      if (linkData) {
        setSmartLink(linkData);
        
        // Load actions for this smart link
        const { data: actionsData, error: actionsError } = await supabase
          .from('smart_link_actions')
          .select('*')
          .eq('smart_link_id', linkData.id)
          .eq('is_active', true)
          .order('order_index');

        if (actionsError) throw actionsError;
        setActions(actionsData || []);
      }
    } catch (error) {
      console.error('Error loading smart link:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSmartLink = async () => {
    if (!user || user.id !== userId) return;

    try {
      const defaultSlug = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-links`;
      
      // Create smart link
      const { data: linkData, error: linkError } = await supabase
        .from('smart_links')
        .insert([{
          creator_id: userId,
          title: `${displayName}'s Links`,
          description: `Connect with ${displayName} across all platforms`,
          slug: defaultSlug,
          is_active: true
        }])
        .select()
        .single();

      if (linkError) throw linkError;

      // Create default actions with platform integrations
      const defaultActions = [
        {
          smart_link_id: linkData.id,
          action_type: 'spotify_follow',
          action_label: '🎵 Follow on Spotify',
          action_url: 'https://open.spotify.com/artist/your-artist-id',
          xp_reward: 25,
          order_index: 1
        },
        {
          smart_link_id: linkData.id,
          action_type: 'youtube_subscribe',
          action_label: '📺 Subscribe on YouTube',
          action_url: 'https://youtube.com/@your-channel',
          xp_reward: 20,
          order_index: 2
        },
        {
          smart_link_id: linkData.id,
          action_type: 'instagram_follow',
          action_label: '📸 Follow on Instagram',
          action_url: 'https://instagram.com/your-handle',
          xp_reward: 15,
          order_index: 3
        },
        {
          smart_link_id: linkData.id,
          action_type: 'join_campaigns',
          action_label: '🎯 Join My Campaigns',
          action_url: `/fan-campaigns?creator=${userId}`,
          xp_reward: 10,
          order_index: 4
        }
      ];

      await supabase.from('smart_link_actions').insert(defaultActions);

      toast.success('Smart link created! Customize it in your dashboard.');
      loadSmartLink();
    } catch (error) {
      console.error('Error creating smart link:', error);
      toast.error('Failed to create smart link');
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'spotify_follow':
      case 'spotify_save':
        return <Music className="h-4 w-4" />;
      case 'youtube_subscribe':
      case 'youtube_watch':
        return <Youtube className="h-4 w-4" />;
      case 'instagram_follow':
        return <Instagram className="h-4 w-4" />;
      case 'twitter_follow':
        return <Twitter className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const handleActionClick = async (action: Action) => {
    // Track the click
    if (smartLink) {
      await supabase
        .from('smart_links')
        .update({ total_clicks: smartLink.total_clicks + 1 })
        .eq('id', smartLink.id);
    }

    // Open the action URL
    if (action.action_url.startsWith('/')) {
      // Internal route
      window.location.href = action.action_url;
    } else {
      // External URL
      window.open(action.action_url, '_blank');
    }

    // Award XP if user is authenticated and it's not their own link
    if (user && user.id !== userId) {
      try {
        await supabase.rpc('handle_universal_share', {
          content_type_param: 'smart_link_action',
          content_id_param: action.id,
          platform_param: 'streamcentives',
          share_url_param: action.action_url
        });
      } catch (error) {
        console.error('Error awarding XP:', error);
      }
    }
  };

  if (loading) {
    return (
      <Button disabled className="w-full" variant="outline">
        <Link2 className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!smartLink && isOwnProfile) {
    return (
      <Button onClick={createDefaultSmartLink} className="w-full bg-gradient-primary">
        <Plus className="h-4 w-4 mr-2" />
        Create Smart Link
      </Button>
    );
  }

  if (!smartLink) {
    return null; // Don't show anything if no smart link exists for other users
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-primary">
          <Link2 className="h-4 w-4 mr-2" />
          {smartLink.title}
          <Badge variant="secondary" className="ml-2 text-xs">
            {smartLink.total_clicks}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {smartLink.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {smartLink.description && (
            <p className="text-sm text-muted-foreground">
              {smartLink.description}
            </p>
          )}
          
          <div className="space-y-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-center gap-3">
                  {getActionIcon(action.action_type)}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{action.action_label}</div>
                    <div className="text-xs text-muted-foreground">
                      +{action.xp_reward} XP
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          {isOwnProfile && (
            <div className="pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setShowDialog(false);
                  window.location.href = '/universal-profile?tab=smart-links';
                }}
              >
                Manage Smart Links
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};