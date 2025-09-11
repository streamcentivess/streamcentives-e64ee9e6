import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedRealtime } from '@/hooks/useOptimizedRealtime';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, ShoppingCart, Sparkles, Star, Heart, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Reward {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_cost: number | null;
  cash_price: number | null;
  currency: string;
  quantity_available: number;
  quantity_redeemed: number;
  image_url: string | null;
  rarity: string;
  tags: string[] | null;
  creator_id: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [userXP] = useState(2500); // This should come from your user profile/state

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    filterAndSortRewards();
  }, [rewards, searchTerm, selectedType, selectedRarity, sortBy]);

  const fetchRewards = async () => {
    try {
      console.log('Fetching rewards...');
      // Step 1: fetch rewards only (no nested relation to avoid FK/RLS issues)
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('id,title,description,type,xp_cost,cash_price,currency,quantity_available,quantity_redeemed,image_url,rarity,tags,creator_id,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('Rewards response:', { rewardsData, rewardsError });
      if (rewardsError) throw rewardsError;

      // Step 2: fetch creator profiles in a separate query
      const creatorIds = Array.from(new Set((rewardsData || []).map(r => r.creator_id).filter(Boolean)));
      let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

      if (creatorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id,display_name,avatar_url')
          .in('user_id', creatorIds);

        console.log('Profiles response:', { profilesData, profilesError });
        if (!profilesError && profilesData) {
          profileMap = new Map(profilesData.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]));
        }
      }

      const enriched = (rewardsData || []).map((r: any) => ({
        ...r,
        profiles: profileMap.get(r.creator_id) || null,
      }));

      setRewards(enriched as any);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Optimized real-time subscription for rewards
  useOptimizedRealtime({
    table: 'rewards',
    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
    onUpdate: fetchRewards,
    debounceMs: 300
  });

  // Real-time subscription for reward redemptions
  useOptimizedRealtime({
    table: 'reward_redemptions',
    event: 'INSERT',
    onUpdate: fetchRewards,
    debounceMs: 300
  });

  const filterAndSortRewards = () => {
    let filtered = rewards.filter(reward => {
      const matchesSearch = 
        reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || reward.type === selectedType;
      const matchesRarity = selectedRarity === 'all' || reward.rarity === selectedRarity;
      
      return matchesSearch && matchesType && matchesRarity;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'xp_low':
          return (a.xp_cost || 0) - (b.xp_cost || 0);
        case 'xp_high':
          return (b.xp_cost || 0) - (a.xp_cost || 0);
        case 'cash_low':
          return (a.cash_price || 0) - (b.cash_price || 0);
        case 'cash_high':
          return (b.cash_price || 0) - (a.cash_price || 0);
        case 'rarity':
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
          return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - 
                 (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredRewards(filtered);
  };

  const redeemReward = async (reward: Reward, paymentMethod: 'xp' | 'cash') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to redeem rewards",
        variant: "destructive",
      });
      navigate('/auth/signin');
      return;
    }

    // Check availability
    if (reward.quantity_available <= reward.quantity_redeemed) {
      toast({
        title: "Out of Stock",
        description: "This reward is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    // Check payment method availability
    if (paymentMethod === 'xp' && !reward.xp_cost) {
      toast({
        title: "Payment Method Unavailable",
        description: "XP payment not available for this reward",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'cash' && !reward.cash_price) {
      toast({
        title: "Payment Method Unavailable", 
        description: "Cash payment not available for this reward",
        variant: "destructive",
      });
      return;
    }

    // Check XP balance
    if (paymentMethod === 'xp' && reward.xp_cost && userXP < reward.xp_cost) {
      toast({
        title: "Insufficient XP",
        description: `You need ${reward.xp_cost} XP but only have ${userXP} XP`,
        variant: "destructive",
      });
      return;
    }

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

      // Refresh rewards to update quantities
      fetchRewards();
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'experience': return '🎫';
      case 'merchandise': return '👕';
      case 'digital': return '💾';
      case 'access': return '⭐';
      default: return '🎁';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/fan-dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Reward Marketplace
                </h1>
                <p className="text-sm text-muted-foreground">
                  Redeem your XP for exclusive rewards from your favorite creators
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your XP Balance</p>
                <p className="text-xl font-bold text-primary">{userXP.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rewards, creators, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Reward Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="access">Access</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedRarity} onValueChange={setSelectedRarity}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarity</SelectItem>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="epic">Epic</SelectItem>
                <SelectItem value="legendary">Legendary</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rarity">Rarity</SelectItem>
                <SelectItem value="xp_low">XP: Low to High</SelectItem>
                <SelectItem value="xp_high">XP: High to Low</SelectItem>
                <SelectItem value="cash_low">Price: Low to High</SelectItem>
                <SelectItem value="cash_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rewards Grid */}
        {filteredRewards.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rewards found</h3>
            <p className="text-muted-foreground">
              {rewards.length === 0 ? 
                'No rewards available in the marketplace yet.' :
                'Try adjusting your filters to find what you\'re looking for.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className="card-modern group hover:scale-105 transition-all duration-300">
                <CardHeader className="p-0">
                  <div className="aspect-video bg-muted rounded-t-xl relative overflow-hidden">
                    {reward.image_url ? (
                      <img 
                        src={reward.image_url} 
                        alt={reward.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                    <div className="absolute top-2 right-2">
                      <span className="text-2xl">{getTypeIcon(reward.type)}</span>
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
                  </div>
                  
                  {/* Creator Info */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reward.profiles?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {reward.profiles?.display_name?.slice(0, 2).toUpperCase() || 'CR'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {reward.profiles?.display_name || 'Creator'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Price and Stock */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {reward.xp_cost && (
                          <span className="text-xs font-bold text-primary">
                            {reward.xp_cost.toLocaleString()} XP
                          </span>
                        )}
                        {reward.cash_price && (
                          <span className="text-xs font-bold text-success">
                            ${reward.cash_price}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{reward.quantity_available - reward.quantity_redeemed} left</div>
                        <div>of {reward.quantity_available}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{reward.quantity_redeemed} redeemed</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span className="capitalize">{reward.type}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    {reward.xp_cost && (
                      <Button 
                        className="flex-1 text-xs h-8"
                        onClick={() => redeemReward(reward, 'xp')}
                        disabled={!user || userXP < reward.xp_cost || reward.quantity_available <= reward.quantity_redeemed}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {!user ? 'Sign In' : 
                         userXP < reward.xp_cost ? 'Need XP' : 
                         reward.quantity_available <= reward.quantity_redeemed ? 'Out of Stock' : 'Redeem'}
                      </Button>
                    )}
                    {reward.cash_price && (
                      <Button 
                        variant="outline"
                        className="flex-1 text-xs h-8"
                        onClick={() => redeemReward(reward, 'cash')}
                        disabled={!user || reward.quantity_available <= reward.quantity_redeemed}
                      >
                        Buy ${reward.cash_price}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Heart className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;