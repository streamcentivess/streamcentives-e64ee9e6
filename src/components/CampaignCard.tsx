import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Trophy, DollarSign, Target, Edit, Trash2, Play, Pause, Eye } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_reward: number;
  cash_reward: number | null;
  target_metric: string | null;
  target_value: number | null;
  current_progress: number;
  start_date: string;
  end_date: string | null;
  status: string;
  max_participants: number | null;
  image_url: string | null;
  tags: string[] | null;
  created_at: string;
  participant_count?: number;
  completed_count?: number;
  total_xp_distributed?: number;
  total_cash_distributed?: number;
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaignId: string) => void;
  onToggleStatus: (campaignId: string, currentStatus: string) => void;
  onViewDetails: (campaign: Campaign) => void;
}

const CampaignCard = React.memo(({ 
  campaign, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onViewDetails 
}: CampaignCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{campaign.title}</CardTitle>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="mb-2">
              {campaign.status}
            </Badge>
          </div>
          {campaign.image_url && (
            <div className="w-16 h-16 rounded-lg overflow-hidden ml-3 flex-shrink-0">
              <img 
                src={campaign.image_url} 
                alt={campaign.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
            {campaign.end_date && (
              <>
                <span>-</span>
                <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{campaign.participant_count || 0} participants</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span>{campaign.completed_count || 0} completed</span>
            </div>
          </div>

          {(campaign.xp_reward > 0 || (campaign.cash_reward && campaign.cash_reward > 0)) && (
            <div className="flex gap-4 text-sm">
              {campaign.xp_reward > 0 && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>{campaign.xp_reward} XP</span>
                </div>
              )}
              {campaign.cash_reward && campaign.cash_reward > 0 && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>${campaign.cash_reward}</span>
                </div>
              )}
            </div>
          )}

          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {campaign.description}
            </p>
          )}

          {campaign.target_value && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>Target: {campaign.target_value}</span>
              <span className="text-muted-foreground">
                ({campaign.current_progress || 0} completed)
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(campaign)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(campaign)}
              className="flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(campaign.id, campaign.status)}
              className="flex items-center gap-1"
            >
              {campaign.status === 'active' ? (
                <>
                  <Pause className="h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Resume
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(campaign.id)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CampaignCard.displayName = 'CampaignCard';

export { CampaignCard };