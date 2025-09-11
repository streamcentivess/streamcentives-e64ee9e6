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
  creator_id: string;
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
          {!isOwnProfile && (
            <Button
              onClick={() => navigate('/fan-campaigns')}
              className="mt-4 bg-gradient-primary hover:opacity-90"
            >
              Discover Campaigns
            </Button>
          )}
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

    // Check if user has already joined this campaign
    const { data: existingParticipation } = await supabase
      .from('campaign_participants')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingParticipation) {
      toast({
        title: "Already joined",
        description: "You're already participating in this campaign!",
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
    <div className="space-y-3 -mx-4 px-4 md:mx-0 md:px-0 md:space-y-6">
      {activeCampaigns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400" />
            <h3 className="text-sm md:text-base font-semibold">Active ({activeCampaigns.length})</h3>
          </div>
          <div className="space-y-1.5 md:space-y-2">
            {activeCampaigns.map((participation) => (
              <div 
                key={participation.campaign_id} 
                className="bg-card/30 border border-border/30 rounded-lg md:rounded-xl p-2.5 md:p-4 hover:bg-card/50 transition-colors"
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="text-lg md:text-xl flex-shrink-0 mt-0.5">
                    {getCampaignTypeIcon(participation.campaigns.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 md:gap-2 mb-1">
                      <h4 className="font-medium text-xs md:text-sm truncate">
                        {participation.campaigns.title}
                      </h4>
                      {!isOwnProfile && user && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoinCampaign(participation.campaign_id)}
                          disabled={!!joinLoading}
                          className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 h-6 md:h-7 flex-shrink-0"
                        >
                          {joinLoading === participation.campaign_id ? (
                            <div className="h-2.5 w-2.5 md:h-3 md:w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                          ) : (
                            "Join"
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-1.5 md:mb-2 line-clamp-2">
                      {participation.campaigns.description}
                    </p>
                    
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0 md:py-0.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
                        In Progress
                      </Badge>
                      
                      {participation.progress !== null && (
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          {participation.progress}% complete
                        </span>
                      )}
                      
                      <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-muted-foreground">
                        <Zap className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        <span>+{participation.campaigns.xp_reward} XP</span>
                      </div>
                      
                      {participation.campaigns.end_date && (
                        <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          <span>Ends {new Date(participation.campaigns.end_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Section - Instagram Style */}
      {activeCampaigns.length > 0 && (
        <div className="bg-card/20 border border-border/20 rounded-lg md:rounded-xl p-3 md:p-4 -mx-4 md:mx-0">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-1.5 md:gap-2">
              <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
              <h3 className="font-semibold text-xs md:text-sm">Share Campaigns & Earn XP</h3>
            </div>
            <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          
          <div className="space-y-2 md:space-y-3">
            <div>
              <p className="font-medium text-xs md:text-sm mb-0.5 md:mb-1">Share on Streamcentives</p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                Repost campaigns to your feed and earn XP when others engage
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm font-medium text-primary">+10 XP per share</span>
              <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {completedCampaigns.length > 0 && (
        <div className="pt-1 md:pt-2">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-400" />
            <h3 className="text-sm md:text-base font-semibold">Completed ({completedCampaigns.length})</h3>
          </div>
          <div className="space-y-1.5 md:space-y-2">
            {completedCampaigns.map((participation) => (
              <div 
                key={participation.campaign_id} 
                className="bg-card/20 border border-border/20 rounded-lg md:rounded-xl p-2.5 md:p-4 opacity-75"
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="text-lg md:text-xl flex-shrink-0 mt-0.5 grayscale">
                    {getCampaignTypeIcon(participation.campaigns.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 md:gap-2 mb-1">
                      <h4 className="font-medium text-xs md:text-sm truncate">
                        {participation.campaigns.title}
                      </h4>
                      {!isOwnProfile && user && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoinCampaign(participation.campaign_id)}
                          disabled={!!joinLoading}
                          className="text-xs px-2 py-1 h-7 flex-shrink-0"
                        >
                          {joinLoading === participation.campaign_id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                          ) : (
                            "Join"
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-[10px] md:text-xs text-muted-foreground mb-1.5 md:mb-2 line-clamp-2">
                      {participation.campaigns.description}
                    </p>
                    
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0 md:py-0.5 bg-green-500/10 text-green-400 border-green-500/20">
                        ✓ Completed
                      </Badge>
                      
                      <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-muted-foreground">
                        <Zap className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        <span>+{participation.campaigns.xp_reward} XP earned</span>
                      </div>
                      
                      {participation.campaigns.cash_reward && (
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          ${participation.campaigns.cash_reward} earned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};