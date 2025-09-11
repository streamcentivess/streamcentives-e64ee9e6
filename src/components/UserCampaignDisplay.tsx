import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Calendar, Users, Zap, ExternalLink, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  xp_reward: number;
  cash_reward: number | null;
  end_date: string | null;
  image_url: string | null;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface CampaignParticipant {
  campaign_id: string;
  status: string;
  progress: number | null;
  joined_at: string;
  campaigns: Campaign;
}

interface UserCampaignDisplayProps {
  campaigns: CampaignParticipant[];
  userId: string;
  isOwnProfile: boolean;
}

export const UserCampaignDisplay = ({ campaigns, userId, isOwnProfile }: UserCampaignDisplayProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isOwnProfile ? "You haven't joined any campaigns yet" : "This user hasn't joined any campaigns yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  const handleJoinCampaign = async (campaignId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join campaigns",
        variant: "destructive"
      });
      return;
    }

    setJoinLoading(campaignId);
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've joined the campaign!"
      });

      // Navigate to fan campaigns to see the campaign
      navigate('/fan-campaigns');
    } catch (error: any) {
      console.error('Error joining campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join campaign",
        variant: "destructive"
      });
    } finally {
      setJoinLoading(null);
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'streaming':
        return '🎵';
      case 'merchandise':
        return '🛍️';
      case 'vote':
        return '🗳️';
      case 'share':
        return '📤';
      case 'upload':
        return '📤';
      default:
        return '🎯';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };

  return (
    <div className="space-y-6">
      {completedCampaigns.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Completed Campaigns ({completedCampaigns.length})
          </h3>
          <div className="grid gap-3">
            {completedCampaigns.map((participation) => (
              <Card key={participation.campaign_id} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{getCampaignTypeIcon(participation.campaigns.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{participation.campaigns.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {participation.campaigns.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(participation.status)}>
                            ✓ Completed
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {participation.campaigns.xp_reward} XP earned
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isOwnProfile && user && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinCampaign(participation.campaign_id)}
                        disabled={!!joinLoading}
                        className="ml-2"
                      >
                        {joinLoading === participation.campaign_id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Join
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeCampaigns.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-400" />
            Active Campaigns ({activeCampaigns.length})
          </h3>
          <div className="grid gap-3">
            {activeCampaigns.map((participation) => (
              <Card key={participation.campaign_id} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{getCampaignTypeIcon(participation.campaigns.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{participation.campaigns.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {participation.campaigns.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(participation.status)}>
                            In Progress
                          </Badge>
                          {participation.progress !== null && (
                            <span className="text-xs text-muted-foreground">
                              {participation.progress}% complete
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {participation.campaigns.xp_reward} XP
                          </span>
                          {participation.campaigns.end_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Ends {new Date(participation.campaigns.end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isOwnProfile && user && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinCampaign(participation.campaign_id)}
                        disabled={!!joinLoading}
                        className="ml-2"
                      >
                        {joinLoading === participation.campaign_id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Join
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};