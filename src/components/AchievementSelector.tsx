import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Music, Share2, Calendar, Star, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Achievement {
  id: string;
  type: 'campaign_completion' | 'xp_milestone' | 'listening_streak' | 'social_share' | 'ranking' | 'engagement';
  title: string;
  description: string;
  icon: React.ReactNode;
  timestamp: string;
  value?: number;
  metadata?: any;
}

interface AchievementSelectorProps {
  selectedFan: { user_id: string; display_name: string; username: string } | null;
  selectedAchievements: Achievement[];
  onAchievementsChange: (achievements: Achievement[]) => void;
}

export function AchievementSelector({ selectedFan, selectedAchievements, onAchievementsChange }: AchievementSelectorProps) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFan && user) {
      loadFanAchievements();
    } else {
      setAchievements([]);
    }
  }, [selectedFan, user]);

  const loadFanAchievements = async () => {
    if (!selectedFan || !user) return;
    
    setLoading(true);
    const achievements: Achievement[] = [];

    try {
      // Get campaign completions
      const { data: campaigns } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          campaigns (
            title,
            type,
            xp_reward,
            cash_reward
          )
        `)
        .eq('user_id', selectedFan.user_id)
        .eq('status', 'completed')
        .order('completion_date', { ascending: false })
        .limit(10);

      campaigns?.forEach((campaign, index) => {
        achievements.push({
          id: `campaign_${campaign.id}`,
          type: 'campaign_completion',
          title: `Completed "${campaign.campaigns?.title}"`,
          description: `Earned ${campaign.xp_earned || 0} XP${campaign.cash_earned ? ` + $${campaign.cash_earned}` : ''}`,
          icon: <Target className="h-4 w-4" />,
          timestamp: campaign.completion_date || campaign.updated_at,
          value: campaign.xp_earned,
          metadata: { campaignTitle: campaign.campaigns?.title, progress: campaign.progress }
        });
      });

      // Get leaderboard position achievements
      const { data: leaderboard } = await supabase
        .from('creator_fan_leaderboards')
        .select('*')
        .eq('creator_user_id', user.id)
        .eq('fan_user_id', selectedFan.user_id)
        .single();

      if (leaderboard && leaderboard.rank_position && leaderboard.rank_position <= 10) {
        achievements.push({
          id: `ranking_${leaderboard.id}`,
          type: 'ranking',
          title: `Top ${leaderboard.rank_position} Fan`,
          description: `Ranked #${leaderboard.rank_position} with ${leaderboard.total_xp_earned.toLocaleString()} XP`,
          icon: <Trophy className="h-4 w-4" />,
          timestamp: leaderboard.last_activity_at || leaderboard.updated_at,
          value: leaderboard.rank_position,
          metadata: { totalXP: leaderboard.total_xp_earned, totalListens: leaderboard.total_listens }
        });
      }

      // Get recent shares
      const { data: shares } = await supabase
        .from('post_shares')
        .select('*')
        .eq('fan_id', selectedFan.user_id)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (shares && shares.length > 0) {
        const totalXPFromShares = shares.reduce((sum, share) => sum + share.xp_earned, 0);
        achievements.push({
          id: `shares_total`,
          type: 'social_share',
          title: `Active Content Sharer`,
          description: `Shared ${shares.length} posts, earned ${totalXPFromShares} XP`,
          icon: <Share2 className="h-4 w-4" />,
          timestamp: shares[0].created_at,
          value: shares.length,
          metadata: { totalShares: shares.length, totalXP: totalXPFromShares }
        });
      }

      // Get listening milestones
      if (leaderboard && leaderboard.total_listens > 0) {
        const milestones = [100, 500, 1000, 5000];
        const highestMilestone = milestones.filter(m => leaderboard.total_listens >= m).pop();
        
        if (highestMilestone) {
          achievements.push({
            id: `listening_${highestMilestone}`,
            type: 'listening_streak',
            title: `${highestMilestone}+ Listens Milestone`,
            description: `Reached ${leaderboard.total_listens.toLocaleString()} total listens`,
            icon: <Music className="h-4 w-4" />,
            timestamp: leaderboard.last_activity_at || leaderboard.updated_at,
            value: leaderboard.total_listens,
            metadata: { milestone: highestMilestone, totalListens: leaderboard.total_listens }
          });
        }
      }

      // XP milestones
      if (leaderboard && leaderboard.total_xp_earned > 0) {
        const xpMilestones = [100, 500, 1000, 2500, 5000, 10000];
        const highestXPMilestone = xpMilestones.filter(m => leaderboard.total_xp_earned >= m).pop();
        
        if (highestXPMilestone) {
          achievements.push({
            id: `xp_${highestXPMilestone}`,
            type: 'xp_milestone',
            title: `${highestXPMilestone}+ XP Milestone`,
            description: `Earned ${leaderboard.total_xp_earned.toLocaleString()} total XP`,
            icon: <Star className="h-4 w-4" />,
            timestamp: leaderboard.last_activity_at || leaderboard.updated_at,
            value: leaderboard.total_xp_earned,
            metadata: { milestone: highestXPMilestone, totalXP: leaderboard.total_xp_earned }
          });
        }
      }

      // Sort by timestamp (most recent first)
      achievements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAchievements(achievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAchievement = (achievement: Achievement) => {
    const isSelected = selectedAchievements.some(a => a.id === achievement.id);
    if (isSelected) {
      onAchievementsChange(selectedAchievements.filter(a => a.id !== achievement.id));
    } else {
      onAchievementsChange([...selectedAchievements, achievement]);
    }
  };

  const getAchievementColor = (type: Achievement['type']) => {
    switch (type) {
      case 'campaign_completion': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ranking': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'social_share': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'listening_streak': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'xp_milestone': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (!selectedFan) {
    return (
      <Card className="card-modern">
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Select a fan to view their achievements</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {selectedFan.display_name}'s Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No achievements found for this fan yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {achievements.map((achievement) => {
              const isSelected = selectedAchievements.some(a => a.id === achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-surface ${
                    isSelected ? 'bg-primary/5 border-primary/30' : 'border-border'
                  }`}
                  onClick={() => toggleAchievement(achievement)}
                >
                  <Checkbox checked={isSelected} onChange={() => {}} />
                  <div className={`p-2 rounded-lg border ${getAchievementColor(achievement.type)}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {formatDistanceToNow(new Date(achievement.timestamp), { addSuffix: true })}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {selectedAchievements.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Selected achievements ({selectedAchievements.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedAchievements.map((achievement) => (
                <Badge key={achievement.id} variant="secondary" className="text-xs">
                  {achievement.title}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}