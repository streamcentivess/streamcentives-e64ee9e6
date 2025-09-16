import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Star, 
  Music, 
  Youtube, 
  Heart, 
  CheckCircle2, 
  ExternalLink,
  Coins,
  Trophy,
  Zap,
  Gift
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QuestStep {
  id: string;
  step_number: number;
  step_title: string;
  step_description: string;
  action_type: string;
  action_data: any;
  xp_reward: number;
  is_required: boolean;
  completed?: boolean;
}

interface QuestData {
  id: string;
  creator_id: string;
  quest_name: string;
  description: string;
  total_xp_reward: number;
  bonus_xp_reward: number;
  steps: QuestStep[];
  creator_profile: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface ArtistInitiationQuestProps {
  creatorId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const ArtistInitiationQuest: React.FC<ArtistInitiationQuestProps> = ({
  creatorId,
  isOpen,
  onClose,
  onComplete
}) => {
  const { user } = useAuth();
  const [questData, setQuestData] = useState<QuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [questCompleted, setQuestCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && creatorId) {
      loadQuest();
    }
  }, [isOpen, creatorId]);

  const loadQuest = async () => {
    try {
      // Get or create quest for this creator
      let { data: quest, error } = await supabase
        .from('artist_initiation_quests')
        .select(`
          *,
          profiles!creator_id(username, display_name, avatar_url),
          quest_steps(*)
        `)
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .single();

      if (error && error.code === 'PGRST116') {
        // No quest exists, create default one
        quest = await createDefaultQuest();
      } else if (error) {
        throw error;
      }

      // Get user's progress if logged in
      let userProgress = [];
      if (user) {
        const { data: progress } = await supabase
          .from('user_quest_progress')
          .select('step_id, xp_earned')
          .eq('quest_id', quest.id)
          .eq('user_id', user.id);
        
        userProgress = progress || [];
      }

      // Mark completed steps
      const steps = quest.quest_steps || [];
      const stepsWithCompletion = steps.map((step: any) => ({
        ...step,
        completed: userProgress.some((p: any) => p.step_id === step.id)
      }));

      const completedStepIds = userProgress.map((p: any) => p.step_id);
      setCompletedSteps(completedStepIds);

      const allRequiredComplete = stepsWithCompletion
        .filter((s: QuestStep) => s.is_required)
        .every((s: QuestStep) => s.completed);
      
      setQuestCompleted(allRequiredComplete);

      setQuestData({
        ...quest,
        creator_profile: {
          username: 'unknown',
          display_name: 'Unknown Creator',
          avatar_url: ''
        },
        steps: stepsWithCompletion.sort((a: any, b: any) => a.step_number - b.step_number)
      });

    } catch (error) {
      console.error('Error loading quest:', error);
      toast.error('Failed to load initiation quest');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultQuest = async () => {
    // Create a default quest for new creators
    const { data: newQuest, error: questError } = await supabase
      .from('artist_initiation_quests')
      .insert([{
        creator_id: creatorId,
        quest_name: 'Become a Superfan',
        description: 'Complete these steps to become a true fan and earn bonus rewards!',
        total_xp_reward: 100,
        bonus_xp_reward: 50,
        is_active: true
      }])
      .select(`
        *,
        profiles!creator_id(username, display_name, avatar_url)
      `)
      .single();

    if (questError) throw questError;

    // Create default steps
    const defaultSteps = [
      {
        quest_id: newQuest.id,
        step_number: 1,
        step_title: '🎵 Stream Top 3 Songs',
        step_description: 'Listen to this artist\'s most popular tracks',
        action_type: 'stream_songs',
        action_data: { count: 3, platform: 'spotify' },
        xp_reward: 30,
        is_required: true
      },
      {
        quest_id: newQuest.id,
        step_number: 2,
        step_title: '❤️ Follow on Streaming',
        step_description: 'Follow the artist on your favorite music platform',
        action_type: 'follow_artist',
        action_data: { platforms: ['spotify', 'apple_music'] },
        xp_reward: 25,
        is_required: true
      },
      {
        quest_id: newQuest.id,
        step_number: 3,
        step_title: '📺 Watch Latest Video',
        step_description: 'Watch the artist\'s latest music video or content',
        action_type: 'watch_video',
        action_data: { platform: 'youtube' },
        xp_reward: 20,
        is_required: true
      },
      {
        quest_id: newQuest.id,
        step_number: 4,
        step_title: '🎨 Save to Playlist',
        step_description: 'Add your favorite song to a personal playlist',
        action_type: 'save_playlist',
        action_data: { platform: 'spotify' },
        xp_reward: 25,
        is_required: false
      }
    ];

    await supabase.from('quest_steps').insert(defaultSteps);

    // Refetch with steps
    const { data: completeQuest } = await supabase
      .from('artist_initiation_quests')
      .select(`
        *,
        profiles!creator_id(username, display_name, avatar_url),
        quest_steps(*)
      `)
      .eq('id', newQuest.id)
      .single();

    return completeQuest;
  };

  const handleStepClick = async (step: QuestStep) => {
    if (!user) {
      toast.error('Sign in to complete quest steps!');
      return;
    }

    if (step.completed) {
      toast.error('You\'ve already completed this step!');
      return;
    }

    setProcessingStep(step.id);

    try {
      // For demo purposes, we'll simulate the action completion
      // In a real implementation, you'd integrate with Spotify/YouTube APIs
      
      // Show action guidance
      const actionMessages = {
        stream_songs: 'Open Spotify and stream the artist\'s top songs!',
        follow_artist: 'Follow this artist on your favorite music platform!',
        watch_video: 'Watch the artist\'s latest video on YouTube!',
        save_playlist: 'Save your favorite song to a playlist!'
      };

      toast.success(actionMessages[step.action_type as keyof typeof actionMessages] || 'Complete this action!');

      // Simulate completion after delay
      setTimeout(async () => {
        try {
          // Record quest progress
          await supabase
            .from('user_quest_progress')
            .insert({
              quest_id: questData!.id,
              user_id: user.id,
              step_id: step.id,
              xp_earned: step.xp_reward
            });

          // Update user XP
          const { data: currentXP } = await supabase
            .from('user_xp_balances')
            .select('current_xp, total_earned_xp')
            .eq('user_id', user.id)
            .single();

          const newXP = (currentXP?.current_xp || 0) + step.xp_reward;
          const newTotalXP = (currentXP?.total_earned_xp || 0) + step.xp_reward;

          await supabase
            .from('user_xp_balances')
            .upsert({
              user_id: user.id,
              current_xp: newXP,
              total_earned_xp: newTotalXP
            }, {
              onConflict: 'user_id'
            });

          // Update local state
          setCompletedSteps(prev => [...prev, step.id]);
          
          // Check if quest is now complete
          const newCompletedSteps = [...completedSteps, step.id];
          const allRequiredComplete = questData!.steps
            .filter(s => s.is_required)
            .every(s => newCompletedSteps.includes(s.id));

          if (allRequiredComplete && !questCompleted) {
            // Award bonus XP for completing quest
            const bonusXP = questData!.bonus_xp_reward;
            await supabase
              .from('user_xp_balances')
              .update({
                current_xp: newXP + bonusXP,
                total_earned_xp: newTotalXP + bonusXP
              })
              .eq('user_id', user.id);

            setQuestCompleted(true);
            toast.success(`🎉 Quest Complete! Earned ${step.xp_reward + bonusXP} XP total!`);
            
            // Track fan conversion
            await supabase
              .from('discovery_funnel_analytics')
              .insert({
                creator_id: questData!.creator_id,
                user_id: user.id,
                funnel_stage: 'fan_convert',
                content_type: 'quest',
                content_id: questData!.id,
                metadata: { total_xp_earned: step.xp_reward + bonusXP }
              });

            if (onComplete) {
              setTimeout(() => onComplete(), 2000);
            }
          } else {
            toast.success(`🎯 Step Complete! Earned ${step.xp_reward} XP!`);
          }

          // Refresh quest data
          await loadQuest();

        } catch (error) {
          console.error('Error completing step:', error);
          toast.error('Step completed but XP award failed');
        } finally {
          setProcessingStep(null);
        }
      }, 2000);

    } catch (error) {
      console.error('Error processing step:', error);
      toast.error('Failed to process step');
      setProcessingStep(null);
    }
  };

  const getStepIcon = (actionType: string, completed: boolean) => {
    if (completed) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    
    switch (actionType) {
      case 'stream_songs':
        return <Music className="h-5 w-5 text-primary" />;
      case 'follow_artist':
        return <Heart className="h-5 w-5 text-primary" />;
      case 'watch_video':
        return <Youtube className="h-5 w-5 text-primary" />;
      case 'save_playlist':
        return <Star className="h-5 w-5 text-primary" />;
      default:
        return <ExternalLink className="h-5 w-5 text-primary" />;
    }
  };

  const getCompletionPercentage = () => {
    if (!questData?.steps.length) return 0;
    return (completedSteps.length / questData.steps.length) * 100;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading quest...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!questData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚫</div>
            <p>Quest not available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Crown className="h-8 w-8 text-yellow-500" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {questData.quest_name}
            </span>
            {questCompleted && <Trophy className="h-8 w-8 text-yellow-500" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quest Header */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{questData.description}</p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge className="bg-primary text-primary-foreground">
                <Coins className="h-3 w-3 mr-1" />
                {questData.total_xp_reward} Base XP
              </Badge>
              <Badge className="bg-yellow-500 text-white">
                <Gift className="h-3 w-3 mr-1" />
                +{questData.bonus_xp_reward} Bonus XP
              </Badge>
            </div>
            
            <div className="max-w-sm mx-auto">
              <Progress value={getCompletionPercentage()} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {completedSteps.length} / {questData.steps.length} steps completed
              </p>
            </div>
          </div>

          {/* Quest Steps */}
          <div className="space-y-4">
            {questData.steps.map((step, index) => (
              <div 
                key={step.id}
                className={`p-4 border rounded-lg transition-all ${
                  step.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    
                    {getStepIcon(step.action_type, step.completed)}
                    
                    <div>
                      <h4 className="font-semibold">{step.step_title}</h4>
                      <p className="text-sm text-muted-foreground">{step.step_description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          <Coins className="h-3 w-3 mr-1" />
                          {step.xp_reward} XP
                        </Badge>
                        {step.is_required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleStepClick(step)}
                    disabled={step.completed || processingStep === step.id}
                    size="sm"
                    className={step.completed 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gradient-primary'
                    }
                  >
                    {processingStep === step.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : step.completed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-2" />
                        Done
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-2" />
                        Complete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Completion Bonus */}
          {questCompleted && (
            <div className="text-center p-6 bg-gradient-primary text-white rounded-lg">
              <Trophy className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">🎉 Quest Complete!</h3>
              <p className="mb-4">
                You're now officially a superfan! You earned {questData.total_xp_reward + questData.bonus_xp_reward} total XP.
              </p>
              <Badge className="bg-white text-primary">
                <Crown className="h-3 w-3 mr-1" />
                Superfan Status Unlocked
              </Badge>
            </div>
          )}

          {!user && (
            <div className="text-center p-6 bg-muted rounded-lg">
              <Star className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Sign In to Start Quest</h3>
              <p className="text-sm text-muted-foreground">
                Create your free account to complete this quest and earn XP rewards
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};