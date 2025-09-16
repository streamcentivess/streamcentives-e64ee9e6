import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Search, 
  Tag, 
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface MarketplaceListing {
  id: string;
  reward_redemption_id: string;
  seller_id: string;
  asking_price_cents: number;
  description?: string;
  is_active: boolean;
  is_sold: boolean;
  created_at: string;
  buyer_id?: string;
  sold_at?: string;
  reward_title?: string;
  reward_image_url?: string;
  reward_rarity?: string;
  reward_delivery_type?: string;
  reward_instant_delivery?: boolean;
  seller_name?: string;
  seller_avatar?: string;
  original_creator_name?: string;
}

interface UserRedemption {
  id: string;
  reward_id: string;
  status: string;
  created_at: string;
  reward_title: string;
  reward_description?: string;
  reward_image_url?: string;
  reward_rarity?: string;
  reward_delivery_type?: string;
  reward_instant_delivery?: boolean;
}

interface RevenueBreakdown {
  total: number;
  sellerReceives: number;
  buyerFee: number;
  sellerFee: number;
  creatorRoyalty: number;
  streamcentivesFee: number;
}

export function EnhancedMarketplaceV2() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<UserRedemption[]>([]);
  const [userListings, setUserListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('');
  const [priceSort, setPriceSort] = useState<string>('');
  const [createListingDialogOpen, setCreateListingDialogOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<string>('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMarketplaceData();
    }
  }, [user]);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);

      // Fetch active marketplace listings with enhanced data
      const { data: listingsData, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select(`
          id,
          reward_redemption_id,
          seller_id,
          asking_price_cents,
          description,
          is_active,
          is_sold,
          created_at,
          buyer_id,
          sold_at
        `)
        .eq('is_active', true)
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      // Fetch reward and seller details for listings
      if (listingsData && listingsData.length > 0) {
        const redemptionIds = listingsData.map(l => l.reward_redemption_id);
        const sellerIds = listingsData.map(l => l.seller_id);

        const { data: redemptionsData } = await supabase
          .from('reward_redemptions')
          .select(`
            id,
            rewards (
              title,
              image_url,
              rarity,
              delivery_type,
              instant_delivery,
              creator_id
            )
          `)
          .in('id', redemptionIds);

        const { data: sellersData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', sellerIds);

        // Combine data with enhanced information
        const enrichedListings = listingsData.map(listing => {
          const redemption = redemptionsData?.find(r => r.id === listing.reward_redemption_id);
          const seller = sellersData?.find(s => s.user_id === listing.seller_id);
          
          return {
            ...listing,
            reward_title: redemption?.rewards?.title,
            reward_image_url: redemption?.rewards?.image_url,
            reward_rarity: redemption?.rewards?.rarity,
            reward_delivery_type: redemption?.rewards?.delivery_type,
            reward_instant_delivery: redemption?.rewards?.instant_delivery,
            seller_name: seller?.display_name || seller?.username,
            seller_avatar: seller?.avatar_url,
            original_creator_name: 'Creator' // We'll fetch this separately if needed
          };
        });

        setListings(enrichedListings as MarketplaceListing[]);
      }

      // Fetch user's available redemptions for selling
      const { data: userRedemptionsData, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select(`
          id,
          reward_id,
          status,
          created_at,
          rewards (
            title,
            description,
            image_url,
            rarity,
            delivery_type,
            instant_delivery
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (redemptionsError) throw redemptionsError;

      const formattedRedemptions = userRedemptionsData?.map(redemption => ({
        ...redemption,
        reward_title: redemption.rewards?.title,
        reward_description: redemption.rewards?.description,
        reward_image_url: redemption.rewards?.image_url,
        reward_rarity: redemption.rewards?.rarity,
        reward_delivery_type: redemption.rewards?.delivery_type,
        reward_instant_delivery: redemption.rewards?.instant_delivery
      })) || [];

      setUserRedemptions(formattedRedemptions as UserRedemption[]);

      // Fetch user's active listings
      const { data: userListingsData, error: userListingsError } = await supabase
        .from('marketplace_listings')
        .select(`
          id,
          reward_redemption_id,
          seller_id,
          asking_price_cents,
          description,
          is_active,
          is_sold,
          created_at,
          buyer_id,
          sold_at
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (userListingsError) throw userListingsError;

      // Enrich user listings with reward data
      if (userListingsData && userListingsData.length > 0) {
        const userRedemptionIds = userListingsData.map(l => l.reward_redemption_id);
        
        const { data: userRedemptionsForListings } = await supabase
          .from('reward_redemptions')
          .select(`
            id,
            rewards (
              title,
              image_url,
              rarity,
              delivery_type,
              instant_delivery
            )
          `)
          .in('id', userRedemptionIds);

        const enrichedUserListings = userListingsData.map(listing => {
          const redemption = userRedemptionsForListings?.find(r => r.id === listing.reward_redemption_id);
          
          return {
            ...listing,
            reward_title: redemption?.rewards?.title,
            reward_image_url: redemption?.rewards?.image_url,
            reward_rarity: redemption?.rewards?.rarity,
            reward_delivery_type: redemption?.rewards?.delivery_type,
            reward_instant_delivery: redemption?.rewards?.instant_delivery
          };
        });

        setUserListings(enrichedUserListings as MarketplaceListing[]);
      }

    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (listing: MarketplaceListing) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase items",
        variant: "destructive"
      });
      return;
    }

    if (user.id === listing.seller_id) {
      toast({
        title: "Cannot Purchase",
        description: "You cannot purchase your own listing",
        variant: "destructive"
      });
      return;
    }

    setPurchaseLoading(listing.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-marketplace-transaction', {
        body: {
          listingId: listing.id,
          paymentMethod: 'cash'
        }
      });

      if (error) throw error;

      toast({
        title: "Purchase Successful",
        description: `You've purchased ${listing.reward_title}! Check your rewards for details.`,
      });

      fetchMarketplaceData(); // Refresh listings
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase item",
        variant: "destructive"
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedRedemption || !listingPrice || parseFloat(listingPrice) <= 0) {
      toast({
        title: "Missing Information",
        description: "Please select a reward and set a valid price",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-marketplace-listing', {
        body: {
          redemptionId: selectedRedemption,
          askingPriceCents: Math.round(parseFloat(listingPrice) * 100),
          description: listingDescription
        }
      });

      if (error) throw error;

      toast({
        title: "Listing Created",
        description: "Your item has been listed on the marketplace!",
      });

      setCreateListingDialogOpen(false);
      setSelectedRedemption('');
      setListingPrice('');
      setListingDescription('');
      fetchMarketplaceData(); // Refresh data
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Listing Failed",
        description: error instanceof Error ? error.message : "Failed to create listing",
        variant: "destructive"
      });
    }
  };

  const getFilteredListings = () => {
    return listings.filter(listing => {
      const matchesSearch = !searchTerm || 
        listing.reward_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.original_creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRarity = !rarityFilter || listing.reward_rarity === rarityFilter;
      
      return matchesSearch && matchesRarity;
    }).sort((a, b) => {
      if (priceSort === 'price_asc') return a.asking_price_cents - b.asking_price_cents;
      if (priceSort === 'price_desc') return b.asking_price_cents - a.asking_price_cents;
      if (priceSort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getRarityColor = (rarity?: string) => {
    const colors = {
      'common': 'bg-gray-100 text-gray-800',
      'rare': 'bg-blue-100 text-blue-800',
      'epic': 'bg-purple-100 text-purple-800',
      'legendary': 'bg-yellow-100 text-yellow-800'
    };
    return colors[rarity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRevenueBreakdown = (priceCents: number): RevenueBreakdown => {
    const buyerFee = Math.floor(priceCents * 0.03); // 3% buyer fee
    const sellerFee = Math.floor(priceCents * 0.02); // 2% seller fee
    const creatorRoyalty = Math.floor(priceCents * 0.02); // 2% creator royalty
    const netToSeller = priceCents - sellerFee - creatorRoyalty;
    
    return {
      total: priceCents + buyerFee,
      sellerReceives: netToSeller,
      buyerFee,
      sellerFee,
      creatorRoyalty,
      streamcentivesFee: buyerFee + sellerFee
    };
  };

  const getDeliveryTypeIcon = (deliveryType?: string, instantDelivery?: boolean) => {
    if (instantDelivery) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    return <Clock className="h-3 w-3 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Enhanced Marketplace
          </h1>
          <p className="text-muted-foreground">Buy and sell rewards with secure transactions</p>
        </div>
        
        <Dialog open={createListingDialogOpen} onOpenChange={setCreateListingDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Sell Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Marketplace Listing</DialogTitle>
              <DialogDescription>
                List your redeemed rewards for sale (cash only with secure revenue sharing)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reward">Select Reward</Label>
                <Select value={selectedRedemption} onValueChange={setSelectedRedemption}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a reward to sell" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRedemptions
                      .filter(redemption => !userListings.some(listing => 
                        listing.reward_redemption_id === redemption.id && listing.is_active
                      ))
                      .map((redemption) => (
                        <SelectItem key={redemption.id} value={redemption.id}>
                          <div className="flex items-center gap-2">
                            {redemption.reward_image_url && (
                              <img 
                                src={redemption.reward_image_url} 
                                alt={redemption.reward_title} 
                                className="w-6 h-6 rounded"
                              />
                            )}
                            <span className="flex-1">{redemption.reward_title}</span>
                            <Badge className={getRarityColor(redemption.reward_rarity)}>
                              {redemption.reward_rarity}
                            </Badge>
                            {getDeliveryTypeIcon(redemption.reward_delivery_type, redemption.reward_instant_delivery)}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="0.00"
                />
                {listingPrice && parseFloat(listingPrice) > 0 && (
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    {(() => {
                      const breakdown = getRevenueBreakdown(Math.round(parseFloat(listingPrice) * 100));
                      return (
                        <>
                          <div className="font-medium">Revenue Breakdown:</div>
                          <div>• You receive: {formatPrice(breakdown.sellerReceives)}</div>
                          <div>• Buyer pays: {formatPrice(breakdown.total)}</div>
                          <div>• Creator royalty: {formatPrice(breakdown.creatorRoyalty)}</div>
                          <div>• Platform fees: {formatPrice(breakdown.streamcentivesFee)}</div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={listingDescription}
                  onChange={(e) => setListingDescription(e.target.value)}
                  placeholder="Add any additional details about the condition, rarity, etc..."
                />
              </div>

              <Button 
                onClick={handleCreateListing}
                disabled={!selectedRedemption || !listingPrice || parseFloat(listingPrice) <= 0}
                className="w-full"
              >
                Create Listing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Marketplace</TabsTrigger>
          <TabsTrigger value="my_listings">My Listings ({userListings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card className="card-modern">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rewards, sellers, or creators..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={rarityFilter} onValueChange={setRarityFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Rarities</SelectItem>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priceSort} onValueChange={setPriceSort}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Listings Grid */}
          {getFilteredListings().length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Listings Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || rarityFilter 
                    ? "Try adjusting your filters to see more listings."
                    : "Be the first to list a reward for sale!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredListings().map((listing) => {
                const breakdown = getRevenueBreakdown(listing.asking_price_cents);
                return (
                  <Card key={listing.id} className="card-modern group hover:scale-105 transition-all duration-300">
                    {listing.reward_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-xl">
                        <img 
                          src={listing.reward_image_url} 
                          alt={listing.reward_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-1">{listing.reward_title}</CardTitle>
                        <Badge className={getRarityColor(listing.reward_rarity)}>
                          {listing.reward_rarity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Sold by {listing.seller_name}</span>
                        {getDeliveryTypeIcon(listing.reward_delivery_type, listing.reward_instant_delivery)}
                        <span className="text-xs">
                          {listing.reward_instant_delivery ? 'Instant' : 'Manual'} delivery
                        </span>
                      </div>
                      {listing.original_creator_name && (
                        <div className="text-xs text-muted-foreground">
                          Original creator: {listing.original_creator_name}
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(listing.asking_price_cents)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {formatPrice(breakdown.total)}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>• Platform fee: {formatPrice(breakdown.buyerFee)}</div>
                        <div>• Creator royalty: {formatPrice(breakdown.creatorRoyalty)}</div>
                      </div>

                      <Button 
                        onClick={() => handlePurchase(listing)}
                        disabled={purchaseLoading === listing.id || user?.id === listing.seller_id}
                        className="w-full"
                      >
                        {purchaseLoading === listing.id ? (
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-4 w-4 mr-2" />
                        )}
                        {user?.id === listing.seller_id 
                          ? "Your Listing" 
                          : `Buy for ${formatPrice(breakdown.total)}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my_listings" className="space-y-6">
          {userListings.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-8 text-center">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Listings</h3>
                <p className="text-muted-foreground">
                  You haven't created any marketplace listings yet.
                </p>
                <Button 
                  onClick={() => setCreateListingDialogOpen(true)}
                  className="mt-4"
                >
                  Create Your First Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userListings.map((listing) => {
                const breakdown = getRevenueBreakdown(listing.asking_price_cents);
                return (
                  <Card key={listing.id} className="card-modern">
                    {listing.reward_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-xl">
                        <img 
                          src={listing.reward_image_url} 
                          alt={listing.reward_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-1">{listing.reward_title}</CardTitle>
                        <Badge className={getRarityColor(listing.reward_rarity)}>
                          {listing.reward_rarity}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={listing.is_sold ? "default" : "secondary"}>
                          {listing.is_sold ? "Sold" : "Active"}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Listed {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(listing.asking_price_cents)}
                        </div>
                        <div className="text-sm text-success font-medium">
                          You get: {formatPrice(breakdown.sellerReceives)}
                        </div>
                      </div>

                      {listing.is_sold ? (
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 mx-auto text-green-500 mb-1" />
                          <div className="text-sm text-green-700">
                            Sold on {listing.sold_at ? new Date(listing.sold_at).toLocaleDateString() : 'Recently'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <TrendingUp className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                          <div className="text-sm text-blue-700">
                            Active listing - buyers pay {formatPrice(breakdown.total)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedMarketplaceV2;