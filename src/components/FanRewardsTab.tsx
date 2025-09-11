import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Gift, ShoppingCart, Package, DollarSign, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useOptimizedRealtime } from '@/hooks/useOptimizedRealtime';

interface Reward {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_cost: number | null;
  cash_price: number | null;
  image_url: string | null;
  rarity: string;
  creator_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UserRedemption {
  id: string;
  reward: Reward;
  status: string;
  created_at: string;
  payment_method: string;
  amount_paid: number | null;
  xp_spent: number | null;
}

const FanRewardsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<UserRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userXP, setUserXP] = useState(0);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<UserRedemption | null>(null);
  const [askingPrice, setAskingPrice] = useState(''); // USD

  useEffect(() => {
    if (user) {
      fetchRewardsData();
    }
  }, [user]);

  // Realtime updates for XP and redemptions
  useOptimizedRealtime({
    table: 'user_xp_balances',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onUpdate: () => fetchRewardsData(),
    debounceMs: 200,
    enabled: !!user?.id,
  });

  useOptimizedRealtime({
    table: 'reward_redemptions',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onUpdate: () => fetchRewardsData(),
    debounceMs: 300,
    enabled: !!user?.id,
  });

  const fetchRewardsData = async () => {
    if (!user) return;
    
    try {
      // Fetch available rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select(`
          *,
          profiles!creator_id (
            display_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .gt('quantity_available', 0)
        .order('created_at', { ascending: false })
        .limit(6);

      if (rewardsError) throw rewardsError;
      setAvailableRewards((rewards as any) || []);

      // Fetch user redemptions
      const { data: redemptions, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards (
            *,
            profiles!creator_id (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (redemptionsError) throw redemptionsError;
      setUserRedemptions((redemptions?.map(r => ({ ...r, reward: r.rewards })) as any) || []);

      // Fetch user XP
      const { data: xpData } = await supabase
        .from('user_xp_balances')
        .select('current_xp')
        .eq('user_id', user.id)
        .maybeSingle();

      setUserXP(xpData?.current_xp || 0);
    } catch (error) {
      console.error('Error fetching rewards data:', error);
      toast({
        title: "Error",
        description: "Failed to load rewards data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (reward: Reward, paymentMethod: 'xp' | 'cash') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        reward_id_param: reward.id,
        payment_method_param: paymentMethod,
        xp_spent_param: paymentMethod === 'xp' ? reward.xp_cost : null,
        amount_paid_param: paymentMethod === 'cash' ? reward.cash_price : null,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Successfully redeemed "${reward.title}"!`,
      });

      fetchRewardsData(); // Refresh data
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem reward",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* XP Balance Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-primary rounded-lg text-white">
        <div>
          <h3 className="text-lg font-semibold">Your XP Balance</h3>
          <p className="text-sm opacity-90">Available for rewards</p>
        </div>
        <div className="text-2xl font-bold">{userXP.toLocaleString()} XP</div>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Rewards</TabsTrigger>
          <TabsTrigger value="owned">My Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableRewards.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rewards Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new rewards from your favorite creators!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableRewards.map((reward) => (
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
                      <div className="absolute top-2 left-2">
                        <Badge className={getRarityColor(reward.rarity)}>
                          {reward.rarity}
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
                          disabled={userXP < reward.xp_cost}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Redeem XP
                        </Button>
                      )}
                      {reward.cash_price && (
                        <Button 
                          className="flex-1 text-xs h-8"
                          variant="outline"
                          onClick={() => redeemReward(reward, 'cash')}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Buy
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="owned" className="space-y-4">
          {userRedemptions.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rewards Yet</h3>
                <p className="text-muted-foreground">
                  Start redeeming rewards to see them here!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userRedemptions.map((redemption) => (
                <Card key={redemption.id} className="card-modern">
                  <CardHeader className="p-0">
                    <div className="aspect-video bg-muted rounded-t-xl relative overflow-hidden">
                      {redemption.reward.image_url ? (
                        <img 
                          src={redemption.reward.image_url} 
                          alt={redemption.reward.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface">
                          <Sparkles className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className={getRarityColor(redemption.reward.rarity)}>
                          {redemption.reward.rarity}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant={redemption.status === 'completed' ? 'default' : 'secondary'}>
                          {redemption.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">
                        {redemption.reward.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {redemption.payment_method === 'xp' 
                          ? `${redemption.xp_spent} XP` 
                          : `$${redemption.amount_paid}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(redemption.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 text-xs h-8"
                        variant="outline"
                        onClick={() => {
                          // TODO: Implement redemption details modal
                          toast({
                            title: "Redemption Details",
                            description: "Feature coming soon!",
                          });
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        className="flex-1 text-xs h-8"
                        onClick={() => {
                          // TODO: Implement marketplace listing
                          toast({
                            title: "List on Marketplace",
                            description: "Feature coming soon!",
                          });
                        }}
                      >
                        Sell
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FanRewardsTab;