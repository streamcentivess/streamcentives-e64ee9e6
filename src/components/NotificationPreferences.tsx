import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Bell, Heart, MessageCircle, AtSign, Trophy, TrendingUp, Users, Gift } from 'lucide-react';

interface NotificationPrefs {
  follow_notifications: boolean;
  message_notifications: boolean;
  like_notifications: boolean;
  comment_notifications: boolean;
  share_notifications: boolean;
  repost_notifications: boolean;
  tag_notifications: boolean;
  milestone_notifications: boolean;
  reward_notifications: boolean;
  offer_notifications: boolean;
  reward_purchase_notifications: boolean;
  campaign_join_notifications: boolean;
}

const defaultPrefs: NotificationPrefs = {
  follow_notifications: true,
  message_notifications: true,
  like_notifications: true,
  comment_notifications: true,
  share_notifications: true,
  repost_notifications: true,
  tag_notifications: true,
  milestone_notifications: true,
  reward_notifications: true,
  offer_notifications: true,
  reward_purchase_notifications: true,
  campaign_join_notifications: true,
};

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          follow_notifications: data.follow_notifications ?? true,
          message_notifications: data.message_notifications ?? true,
          like_notifications: data.like_notifications ?? true,
          comment_notifications: data.comment_notifications ?? true,
          share_notifications: data.share_notifications ?? true,
          repost_notifications: data.repost_notifications ?? true,
          tag_notifications: data.tag_notifications ?? true,
          milestone_notifications: data.milestone_notifications ?? true,
          reward_notifications: data.reward_notifications ?? true,
          offer_notifications: data.offer_notifications ?? true,
          reward_purchase_notifications: data.reward_purchase_notifications ?? true,
          campaign_join_notifications: data.campaign_join_notifications ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return;

    setSaving(true);
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          [key]: value,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Preferences updated',
        description: 'Your notification settings have been saved.',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social Interactions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Social Interactions
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="follow">New Followers</Label>
              <p className="text-sm text-muted-foreground">
                When someone follows you
              </p>
            </div>
            <Switch
              id="follow"
              checked={preferences.follow_notifications}
              onCheckedChange={(checked) => updatePreference('follow_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="like">
                <Heart className="h-3 w-3 inline mr-1" />
                Likes
              </Label>
              <p className="text-sm text-muted-foreground">
                When someone likes your post
              </p>
            </div>
            <Switch
              id="like"
              checked={preferences.like_notifications}
              onCheckedChange={(checked) => updatePreference('like_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="comment">Comments</Label>
              <p className="text-sm text-muted-foreground">
                When someone comments on your post
              </p>
            </div>
            <Switch
              id="comment"
              checked={preferences.comment_notifications}
              onCheckedChange={(checked) => updatePreference('comment_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share">Shares</Label>
              <p className="text-sm text-muted-foreground">
                When someone shares your content
              </p>
            </div>
            <Switch
              id="share"
              checked={preferences.share_notifications}
              onCheckedChange={(checked) => updatePreference('share_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="repost">Reposts</Label>
              <p className="text-sm text-muted-foreground">
                When someone reposts your content
              </p>
            </div>
            <Switch
              id="repost"
              checked={preferences.repost_notifications}
              onCheckedChange={(checked) => updatePreference('repost_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tag">
                <AtSign className="h-3 w-3 inline mr-1" />
                Tags & Mentions
              </Label>
              <p className="text-sm text-muted-foreground">
                When someone tags you in a post
              </p>
            </div>
            <Switch
              id="tag"
              checked={preferences.tag_notifications}
              onCheckedChange={(checked) => updatePreference('tag_notifications', checked)}
              disabled={saving}
            />
          </div>
        </div>

        <Separator />

        {/* Messages */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="messages">New Messages</Label>
              <p className="text-sm text-muted-foreground">
                When you receive a new message
              </p>
            </div>
            <Switch
              id="messages"
              checked={preferences.message_notifications}
              onCheckedChange={(checked) => updatePreference('message_notifications', checked)}
              disabled={saving}
            />
          </div>
        </div>

        <Separator />

        {/* Achievements & Milestones */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements & Milestones
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="milestones">Personal Milestones</Label>
              <p className="text-sm text-muted-foreground">
                Follower, XP, and post count milestones
              </p>
            </div>
            <Switch
              id="milestones"
              checked={preferences.milestone_notifications}
              onCheckedChange={(checked) => updatePreference('milestone_notifications', checked)}
              disabled={saving}
            />
          </div>

        </div>

        <Separator />

        {/* Campaigns & Rewards */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Campaigns & Rewards
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="campaign-joins">Campaign Joins</Label>
              <p className="text-sm text-muted-foreground">
                When fans join your campaigns
              </p>
            </div>
            <Switch
              id="campaign-joins"
              checked={preferences.campaign_join_notifications}
              onCheckedChange={(checked) => updatePreference('campaign_join_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rewards">Rewards & Shoutouts</Label>
              <p className="text-sm text-muted-foreground">
                When you receive rewards or shoutouts
              </p>
            </div>
            <Switch
              id="rewards"
              checked={preferences.reward_notifications}
              onCheckedChange={(checked) => updatePreference('reward_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reward-purchases">Reward Purchases</Label>
              <p className="text-sm text-muted-foreground">
                When fans redeem your rewards
              </p>
            </div>
            <Switch
              id="reward-purchases"
              checked={preferences.reward_purchase_notifications}
              onCheckedChange={(checked) => updatePreference('reward_purchase_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="offers">Sponsor Offers</Label>
              <p className="text-sm text-muted-foreground">
                When sponsors send you offers
              </p>
            </div>
            <Switch
              id="offers"
              checked={preferences.offer_notifications}
              onCheckedChange={(checked) => updatePreference('offer_notifications', checked)}
              disabled={saving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
