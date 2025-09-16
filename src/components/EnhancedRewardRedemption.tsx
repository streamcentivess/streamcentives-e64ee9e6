import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Gift, 
  ShoppingCart, 
  DollarSign, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  UserPlus,
  Code,
  Package
} from 'lucide-react';

interface EnhancedReward {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_cost: number | null;
  cash_price: number | null;
  image_url: string | null;
  rarity: string;
  creator_id: string;
  delivery_type: string;
  instant_delivery: boolean;
  creator_xp_only: boolean;
  external_url: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface RedemptionResult {
  success: boolean;
  redemption_id: string;
  redemption_code?: string;
  instant_delivery: boolean;
  delivery_type: string;
  error?: string;
}

interface EnhancedRewardRedemptionProps {
  rewards: EnhancedReward[];
  userXP: number;
  onRedemptionSuccess: () => void;
}

export const EnhancedRewardRedemption: React.FC<EnhancedRewardRedemptionProps> = ({
  rewards,
  userXP,
  onRedemptionSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const redeemReward = async (reward: EnhancedReward, paymentMethod: 'xp' | 'cash') => {
    if (!user) return;

    setRedeeming(reward.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-reward-purchase', {
        body: {
          rewardId: reward.id,
          paymentMethod: paymentMethod,
          xpSpent: paymentMethod === 'xp' ? reward.xp_cost : null,
          amountPaid: paymentMethod === 'cash' ? reward.cash_price : null,
          xpType: reward.creator_xp_only ? 'creator_specific' : 'platform'
        }
      });

      if (error) throw error;

      const result = data as RedemptionResult;
      setRedemptionResult(result);
      setShowResultModal(true);

      // Handle instant fulfillment
      if (result.instant_delivery) {
        await handleInstantFulfillment(reward, result);
      }

      toast({
        title: "Redemption Successful!",
        description: `Successfully redeemed "${reward.title}"!`,
      });

      onRedemptionSuccess();
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem reward",
        variant: "destructive",
      });
    } finally {
      setRedeeming(null);
    }
  };

  const handleInstantFulfillment = async (reward: EnhancedReward, result: RedemptionResult) => {
    switch (result.delivery_type) {
      case 'follow':
        // Create follow relationship
        try {
          const { error } = await supabase
            .from('follows')
            .insert([{
              follower_id: reward.creator_id,
              following_id: user?.id
            }]);
          
          if (!error) {
            toast({
              title: "Instant Follow!",
              description: `${reward.profiles?.display_name || 'Creator'} is now following you!`,
            });
          }
        } catch (error) {
          console.error('Error creating follow:', error);
        }
        break;
        
      case 'external_redirect':
        if (reward.external_url) {
          window.open(reward.external_url, '_blank');
        }
        break;
        
      case 'code':
        // Code is handled in the result modal
        break;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getDeliveryIcon = (deliveryType: string) => {
    switch (deliveryType) {
      case 'follow': return <UserPlus className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'external_redirect': return <ExternalLink className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id} className="card-modern group hover:scale-105 transition-all duration-300">
            <CardHeader className="p-0">
              <div className="aspect-video bg-muted rounded-t-xl relative overflow-hidden">
                {reward.image_url ? (
                  <img 
                    src={reward.image_url} 
                    alt={reward.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge className={getRarityColor(reward.rarity)}>
                    {reward.rarity}
                  </Badge>
                  {reward.instant_delivery && (
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Instant
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-background/80 text-xs flex items-center gap-1">
                    {getDeliveryIcon(reward.delivery_type)}
                    {reward.delivery_type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                  {reward.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {reward.description || 'No description available'}
                </p>
                <p className="text-xs text-primary mt-1">
                  By {reward.profiles?.display_name || 'Creator'}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  {reward.xp_cost && (
                    <span className="text-sm font-bold text-primary">
                      {reward.xp_cost.toLocaleString()} XP
                      {reward.creator_xp_only && (
                        <span className="text-xs text-muted-foreground ml-1">(Creator XP)</span>
                      )}
                    </span>
                  )}
                  {reward.cash_price && (
                    <span className="text-sm font-bold text-success">
                      ${reward.cash_price}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {reward.xp_cost && (
                  <Button 
                    className="flex-1 text-xs h-8"
                    onClick={() => redeemReward(reward, 'xp')}
                    disabled={
                      redeeming === reward.id || 
                      userXP < reward.xp_cost
                    }
                  >
                    {redeeming === reward.id ? (
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-3 w-3 mr-1" />
                    )}
                    Redeem XP
                  </Button>
                )}
                {reward.cash_price && (
                  <Button 
                    className="flex-1 text-xs h-8"
                    variant="outline"
                    onClick={() => redeemReward(reward, 'cash')}
                    disabled={redeeming === reward.id}
                  >
                    {redeeming === reward.id ? (
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <DollarSign className="h-3 w-3 mr-1" />
                    )}
                    Buy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Redemption Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Redemption Successful!
            </DialogTitle>
            <DialogDescription>
              Your reward has been processed successfully.
            </DialogDescription>
          </DialogHeader>
          
          {redemptionResult && (
            <div className="space-y-4">
              {redemptionResult.instant_delivery ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                    <CheckCircle className="h-4 w-4" />
                    Instant Delivery Complete
                  </div>
                  <p className="text-sm text-green-700">
                    {redemptionResult.delivery_type === 'follow' && 
                      "The creator is now following you!"}
                    {redemptionResult.delivery_type === 'code' && 
                      "Your redemption code is ready to use."}
                    {redemptionResult.delivery_type === 'external_redirect' && 
                      "You've been redirected to complete your reward."}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                    <Clock className="h-4 w-4" />
                    Manual Processing Required
                  </div>
                  <p className="text-sm text-blue-700">
                    The creator will process your reward manually. You'll be notified when it's ready.
                  </p>
                </div>
              )}

              {redemptionResult.redemption_code && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="text-sm font-medium mb-2">Redemption Code:</div>
                  <div className="font-mono text-lg font-bold text-center p-2 bg-white rounded border">
                    {redemptionResult.redemption_code}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Save this code - you'll need it to claim your reward.
                  </p>
                </div>
              )}

              <Button 
                onClick={() => setShowResultModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedRewardRedemption;