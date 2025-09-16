import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Music, 
  Youtube, 
  Instagram, 
  Twitter, 
  ExternalLink, 
  Coins, 
  Star,
  Play,
  Heart,
  Share,
  Gift,
  Zap,
  Crown,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArtistInitiationQuest } from '@/components/ArtistInitiationQuest';

interface SmartLinkData {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  creator_profile: {
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
  };
  actions: Array<{
    id: string;
    action_type: string;
    action_label: string;
    action_url: string;
    xp_reward: number;
    bonus_multiplier: number;
    completed?: boolean;
  }>;
  total_xp_available: number;
  user_xp_earned: number;
}

export const SmartLinkLanding: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [smartLinkData, setSmartLinkData] = useState<SmartLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showQuest, setShowQuest] = useState(false);
  const [userXP, setUserXP] = useState(0);

  // Analytics tracking
  const sourceParam = searchParams.get('src'); // ?src=tiktok, ?src=instagram, etc.

  useEffect(() => {
    if (slug) {
      loadSmartLink();
      trackDiscovery();
    }
  }, [slug]);

  const loadSmartLink = async () => {
    try {
      // Get smart link data with creator profile and actions
      const { data: smartLink, error } = await supabase
        .from('smart_links')
        .select(`
          *,
          profiles!creator_id(username, display_name, avatar_url, bio),
          smart_link_actions(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Get user's completed actions if logged in
      let userInteractions = [];
      if (user) {
        const { data: interactions } = await supabase
          .from('smart_link_interactions')
          .select('action_id, xp_earned')
          .eq('smart_link_id', smartLink.id)
          .eq('user_id', user.id);
        
        userInteractions = interactions || [];

        // Get user's current XP
        const { data: xpData } = await supabase
          .from('user_xp_balances')
          .select('current_xp')
          .eq('user_id', user.id)
          .single();
        
        setUserXP(xpData?.current_xp || 0);
      }

      // Mark completed actions
      const actions = smartLink.smart_link_actions || [];
      const actionsWithCompletion = actions.map((action: any) => ({
        ...action,
        completed: userInteractions.some((i: any) => i.action_id === action.id)
      }));

      const totalXP = actionsWithCompletion.reduce((sum: number, action: any) => 
        sum + (action.xp_reward * action.bonus_multiplier), 0
      );
      
      const earnedXP = userInteractions.reduce((sum: any, interaction: any) => 
        sum + interaction.xp_earned, 0
      );

      setSmartLinkData({
        ...smartLink,
        creator_profile: {
          username: 'unknown',
          display_name: 'Unknown Creator', 
          avatar_url: '',
          bio: ''
        },
        actions: actionsWithCompletion,
        total_xp_available: totalXP,
        user_xp_earned: earnedXP
      });

      // Increment click count
      await supabase
        .from('smart_links')
        .update({ total_clicks: smartLink.total_clicks + 1 })
        .eq('id', smartLink.id);

    } catch (error) {
      console.error('Error loading smart link:', error);
      toast.error('Smart link not found or no longer active');
    } finally {
      setLoading(false);
    }
  };

  const trackDiscovery = async () => {
    if (!smartLinkData) return;
    
    // Track funnel analytics
    await supabase
      .from('discovery_funnel_analytics')
      .insert({
        creator_id: smartLinkData.creator_id,
        user_id: user?.id || null,
        funnel_stage: 'click',
        source_platform: sourceParam || 'direct',
        content_type: 'smart_link',
        content_id: smartLinkData.id
      });
  };

  const handleActionClick = async (action: any) => {
    if (!user) {
      toast.error('Sign in to earn XP rewards!');
      return;
    }

    if (action.completed) {
      toast.error('You\'ve already completed this action!');
      return;
    }

    setProcessingAction(action.id);

    try {
      // Open external link
      window.open(action.action_url, '_blank');

      // Award XP after a short delay (simulating action completion)
      setTimeout(async () => {
        try {
          const xpToAward = Math.floor(action.xp_reward * action.bonus_multiplier);

          // Record interaction
          await supabase
            .from('smart_link_interactions')
            .insert({
              smart_link_id: smartLinkData!.id,
              user_id: user.id,
              action_id: action.id,
              interaction_type: 'action_complete',
              xp_earned: xpToAward
            });

          // Update user XP
          await supabase
            .from('user_xp_balances')
            .upsert({
              user_id: user.id,
              current_xp: userXP + xpToAward,
              total_earned_xp: userXP + xpToAward
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            });

          // Track analytics
          await supabase
            .from('discovery_funnel_analytics')
            .insert({
              creator_id: smartLinkData!.creator_id,
              user_id: user.id,
              funnel_stage: 'action',
              source_platform: sourceParam || 'direct',
              content_type: 'smart_link',
              content_id: smartLinkData!.id,
              metadata: { action_type: action.action_type, xp_earned: xpToAward }
            });

          setUserXP(prev => prev + xpToAward);
          toast.success(`🎉 Earned ${xpToAward} XP!`);
          
          // Refresh data to show completion
          await loadSmartLink();

        } catch (error) {
          console.error('Error awarding XP:', error);
          toast.error('Action completed but XP award failed');
        } finally {
          setProcessingAction(null);
        }
      }, 3000); // 3 second delay

    } catch (error) {
      console.error('Error processing action:', error);
      toast.error('Failed to process action');
      setProcessingAction(null);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'spotify_save':
      case 'spotify_follow':
        return <Music className="h-5 w-5" />;
      case 'youtube_subscribe':
      case 'youtube_watch':
        return <Youtube className="h-5 w-5" />;
      case 'instagram_follow':
        return <Instagram className="h-5 w-5" />;
      case 'twitter_follow':
        return <Twitter className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  const getProgressPercentage = () => {
    if (!smartLinkData) return 0;
    return (smartLinkData.user_xp_earned / smartLinkData.total_xp_available) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading creator experience...</p>
        </div>
      </div>
    );
  }

  if (!smartLinkData) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-bold mb-2">Link Not Found</h2>
            <p className="text-muted-foreground">This smart link is no longer active or doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/20">
            <AvatarImage src={smartLinkData.creator_profile.avatar_url} />
            <AvatarFallback className="text-2xl bg-white/20">
              {smartLinkData.creator_profile.display_name?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-3xl font-bold mb-2">{smartLinkData.title}</h1>
          <p className="text-xl mb-2">by @{smartLinkData.creator_profile.username}</p>
          
          {smartLinkData.description && (
            <p className="text-white/80 max-w-md mx-auto">{smartLinkData.description}</p>
          )}

          {user && (
            <div className="mt-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-yellow-300" />
                <span className="font-semibold">{userXP.toLocaleString()} XP</span>
              </div>
              <div className="max-w-sm mx-auto">
                <Progress value={getProgressPercentage()} className="h-2" />
                <p className="text-sm text-white/70 mt-1">
                  {smartLinkData.user_xp_earned} / {smartLinkData.total_xp_available} XP earned
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Quest Prompt for New Users */}
        {user && smartLinkData.user_xp_earned === 0 && (
          <Card className="mb-6 border-2 border-primary bg-primary/5">
            <CardContent className="p-6 text-center">
              <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">🎯 New Fan Bonus Quest!</h3>
              <p className="text-muted-foreground mb-4">
                Complete the Artist Initiation Quest for bonus XP and exclusive rewards!
              </p>
              <Button 
                onClick={() => setShowQuest(true)}
                className="bg-gradient-primary"
              >
                <Star className="h-4 w-4 mr-2" />
                Start Quest (+50 Bonus XP)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions Grid */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">🚀 Earn XP Rewards</h2>
            <p className="text-muted-foreground">
              Complete actions to earn XP and become a superfan!
            </p>
          </div>

          {smartLinkData.actions.map((action) => (
            <Card 
              key={action.id} 
              className={`transition-all hover:shadow-glow ${
                action.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'hover:border-primary/50'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      action.completed ? 'bg-green-500' : 'bg-primary'
                    } text-white`}>
                      {action.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        getActionIcon(action.action_type)
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg">{action.action_label}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-primary">
                          <Coins className="h-3 w-3 mr-1" />
                          {Math.floor(action.xp_reward * action.bonus_multiplier)} XP
                        </Badge>
                        {action.bonus_multiplier > 1 && (
                          <Badge className="bg-yellow-500 text-white">
                            <Zap className="h-3 w-3 mr-1" />
                            {action.bonus_multiplier}x Bonus
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleActionClick(action)}
                    disabled={action.completed || processingAction === action.id}
                    className={action.completed 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gradient-primary'
                    }
                  >
                    {processingAction === action.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : action.completed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Complete Action
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sign In Prompt */}
        {!user && (
          <Card className="mt-8 border-2 border-primary bg-gradient-subtle">
            <CardContent className="p-6 text-center">
              <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">🎁 Sign In to Earn Rewards!</h3>
              <p className="text-muted-foreground mb-4">
                Create your free account to start earning XP and unlock exclusive rewards
              </p>
              <Button className="bg-gradient-primary" size="lg">
                <Star className="h-4 w-4 mr-2" />
                Sign In & Start Earning
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Share This Link */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <Share className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Love this artist?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with friends and help them discover amazing music!
            </p>
            <Button 
              variant="outline" 
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
              }}
            >
              <Share className="h-4 w-4 mr-2" />
              Share Link
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Artist Initiation Quest Modal */}
      {showQuest && (
        <ArtistInitiationQuest 
          creatorId={smartLinkData.creator_id}
          isOpen={showQuest}
          onClose={() => setShowQuest(false)}
          onComplete={() => {
            setShowQuest(false);
            loadSmartLink(); // Refresh to show updated XP
          }}
        />
      )}
    </div>
  );
};