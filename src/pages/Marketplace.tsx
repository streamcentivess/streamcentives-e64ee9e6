import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Gift, Star, ArrowLeft, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'experience' | 'merchandise' | 'digital' | 'exclusive';
  xpCost: number;
  originalPrice?: number;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  imageUrl: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stock: number;
  totalClaimed: number;
  isLimited: boolean;
  tags: string[];
}

// Mock data - replace with real API calls
const mockRewards: Reward[] = [
  {
    id: '1',
    title: 'VIP Meet & Greet Pass',
    description: 'Exclusive backstage access and personal meet & greet with Luna Rodriguez during her world tour.',
    type: 'experience',
    xpCost: 5000,
    originalPrice: 200,
    creator: {
      name: 'Luna Rodriguez',
      avatar: '/placeholder-artist.jpg',
      verified: true
    },
    imageUrl: '/placeholder-vip.jpg',
    category: 'Experience',
    rarity: 'legendary',
    stock: 5,
    totalClaimed: 15,
    isLimited: true,
    tags: ['vip', 'exclusive', 'meet-greet']
  },
  {
    id: '2',
    title: 'Limited Edition Vinyl Record',
    description: 'Signed vinyl record of "Midnight Dreams" album with exclusive artwork and liner notes.',
    type: 'merchandise',
    xpCost: 2500,
    originalPrice: 75,
    creator: {
      name: 'Luna Rodriguez',
      avatar: '/placeholder-artist.jpg',
      verified: true
    },
    imageUrl: '/placeholder-vinyl.jpg',
    category: 'Merchandise',
    rarity: 'epic',
    stock: 50,
    totalClaimed: 125,
    isLimited: true,
    tags: ['vinyl', 'signed', 'collectible']
  },
  {
    id: '3',
    title: 'Exclusive Digital Wallpaper Pack',
    description: 'Collection of 10 high-resolution wallpapers featuring exclusive band photography.',
    type: 'digital',
    xpCost: 500,
    creator: {
      name: 'The Electric Beats',
      avatar: '/placeholder-band.jpg',
      verified: true
    },
    imageUrl: '/placeholder-wallpaper.jpg',
    category: 'Digital',
    rarity: 'common',
    stock: 999,
    totalClaimed: 1247,
    isLimited: false,
    tags: ['wallpaper', 'digital', 'photography']
  },
  {
    id: '4',
    title: 'DJ Cosmic Remix Pack',
    description: 'Unreleased remixes and stems from DJ Cosmic\'s latest tracks for aspiring producers.',
    type: 'digital',
    xpCost: 1200,
    creator: {
      name: 'DJ Cosmic',
      avatar: '/placeholder-dj.jpg',
      verified: true
    },
    imageUrl: '/placeholder-remix.jpg',
    category: 'Digital',
    rarity: 'rare',
    stock: 200,
    totalClaimed: 89,
    isLimited: true,
    tags: ['remix', 'stems', 'producer']
  },
  {
    id: '5',
    title: 'Concert Livestream Access',
    description: '4K livestream access to Neon Pulse\'s sold-out concert with multi-camera angles.',
    type: 'experience',
    xpCost: 800,
    originalPrice: 25,
    creator: {
      name: 'Neon Pulse',
      avatar: '/placeholder-artist2.jpg',
      verified: false
    },
    imageUrl: '/placeholder-livestream.jpg',
    category: 'Experience',
    rarity: 'common',
    stock: 500,
    totalClaimed: 1456,
    isLimited: false,
    tags: ['livestream', 'concert', '4k']
  }
];

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>(mockRewards);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [userXP] = useState(3500); // Mock user XP - replace with real data

  useEffect(() => {
    filterAndSortRewards();
  }, [searchTerm, selectedType, selectedRarity, sortBy]);

  const filterAndSortRewards = () => {
    let filtered = rewards;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reward => 
        reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(reward => reward.type === selectedType);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(reward => reward.rarity === selectedRarity);
    }

    // Sort rewards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.xpCost - b.xpCost;
        case 'price_high':
          return b.xpCost - a.xpCost;
        case 'popular':
          return b.totalClaimed - a.totalClaimed;
        case 'newest':
        default:
          return 0; // Mock - in real app, sort by creation date
      }
    });

    setFilteredRewards(filtered);
  };

  const redeemReward = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (userXP < reward.xpCost) {
      toast({
        title: "Insufficient XP",
        description: `You need ${reward.xpCost - userXP} more XP to redeem this reward.`,
        variant: "destructive"
      });
      return;
    }

    if (reward.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This reward is currently out of stock.",
        variant: "destructive"
      });
      return;
    }

    // Mock redemption logic - replace with real API call
    toast({
      title: "Reward Redeemed!",
      description: `You've successfully redeemed "${reward.title}" for ${reward.xpCost} XP!`,
    });

    // Update local state
    setRewards(prev => prev.map(r => 
      r.id === rewardId 
        ? { ...r, stock: r.stock - 1, totalClaimed: r.totalClaimed + 1 }
        : r
    ));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-muted/20 text-muted-foreground';
      case 'rare': return 'bg-blue-500/20 text-blue-500';
      case 'epic': return 'bg-purple-500/20 text-purple-500';
      case 'legendary': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'experience': return '🎫';
      case 'merchandise': return '👕';
      case 'digital': return '💾';
      case 'exclusive': return '⭐';
      default: return '🎁';
    }
  };

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
                onClick={() => navigate(-1)}
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
              placeholder="Search rewards, creators, or categories..."
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
                <SelectItem value="exclusive">Exclusive</SelectItem>
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
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRewards.map((reward) => (
            <Card key={reward.id} className="card-modern group hover:scale-105 transition-all duration-300">
              <CardHeader className="p-0">
                <div className="aspect-video bg-muted rounded-t-xl relative overflow-hidden">
                  <img 
                    src={reward.imageUrl} 
                    alt={reward.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-reward.jpg';
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className={getRarityColor(reward.rarity)}>
                      {reward.rarity}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="text-2xl">{getTypeIcon(reward.type)}</span>
                  </div>
                  {reward.isLimited && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="destructive" className="text-xs">
                        Limited Edition
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {reward.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {reward.description}
                  </p>
                </div>
                
                {/* Creator Info */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reward.creator.avatar} />
                    <AvatarFallback className="text-xs">{reward.creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {reward.creator.name}
                      {reward.creator.verified && (
                        <span className="ml-1 text-primary">✓</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Price and Stock */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-primary">
                      {reward.xpCost.toLocaleString()} XP
                    </span>
                    {reward.originalPrice && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (${reward.originalPrice} value)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {reward.stock > 0 ? `${reward.stock} left` : 'Out of stock'}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{reward.totalClaimed} claimed</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span>{reward.category}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 text-xs h-8"
                    onClick={() => redeemReward(reward.id)}
                    disabled={userXP < reward.xpCost || reward.stock <= 0}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {userXP < reward.xpCost ? 'Need More XP' : reward.stock <= 0 ? 'Out of Stock' : 'Redeem'}
                  </Button>
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
        
        {filteredRewards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rewards found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find more rewards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;