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
import { ShoppingBag, DollarSign, Coins, Users, Search, Filter, Star, Tag } from 'lucide-react';

interface MarketplaceListing {
  id: string;
  reward_redemption_id: string;
  seller_id: string;
  asking_price_cents: number;
  asking_price_xp?: number;
  description?: string;
  is_active: boolean;
  is_sold: boolean;
  created_at: string;
  reward_title?: string;
  reward_image_url?: string;
  reward_rarity?: string;
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
}

export function EnhancedMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<UserRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('');
  const [priceSort, setPriceSort] = useState<string>('');
  const [createListingDialogOpen, setCreateListingDialogOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<string>('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    if (user) {
      fetchMarketplaceData();
    }
  }, [user]);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);

      // Fetch marketplace listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select(`
          id,
          reward_redemption_id,
          seller_id,
          asking_price_cents,
          asking_price_xp,
          description,
          is_active,
          is_sold,
          created_at
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
              creator_id
            )
          `)
          .in('id', redemptionIds);

        const { data: sellersData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', sellerIds);

        // Combine data
        const enrichedListings = listingsData.map(listing => {
          const redemption = redemptionsData?.find(r => r.id === listing.reward_redemption_id);
          const seller = sellersData?.find(s => s.user_id === listing.seller_id);
          
          return {
            ...listing,
            reward_title: redemption?.rewards?.title,
            reward_image_url: redemption?.rewards?.image_url,
            reward_rarity: redemption?.rewards?.rarity,
            seller_name: seller?.display_name || seller?.username,
            seller_avatar: seller?.avatar_url
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
            rarity
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
        reward_rarity: redemption.rewards?.rarity
      })) || [];

      setUserRedemptions(formattedRedemptions as UserRedemption[]);

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

    try {
      const { data, error } = await supabase.functions.invoke('purchase-marketplace-item', {
        body: {
          listingId: listing.id,
          paymentMethod: 'cash' // Enhanced marketplace only supports cash
        }
      });

      if (error) throw error;

      toast({
        title: "Purchase Successful",
        description: `You've purchased ${listing.reward_title}!`,
      });

      fetchMarketplaceData(); // Refresh listings
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase item",
        variant: "destructive"
      });
    }
  };

  const handleCreateListing = async () => {
    if (!selectedRedemption || !listingPrice) {
      toast({
        title: "Missing Information",
        description: "Please select a reward and set a price",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-marketplace-listing', {
        body: {
          redemptionId: selectedRedemption,
          askingPriceCents: Math.round(parseFloat(listingPrice) * 100),
          askingPriceXP: null, // Enhanced marketplace doesn't allow XP sales
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
        listing.seller_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const getRevenueBreakdown = (priceCents: number) => {
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
          <h1 className="text-3xl font-bold">Fan-to-Fan Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell rewards with other fans</p>
        </div>
        
        <Dialog open={createListingDialogOpen} onOpenChange={setCreateListingDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Sell Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Marketplace Listing</DialogTitle>
              <DialogDescription>
                List your redeemed rewards for sale (cash only)
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
                    {userRedemptions.map((redemption) => (
                      <SelectItem key={redemption.id} value={redemption.id}>
                        <div className="flex items-center gap-2">
                          {redemption.reward_image_url && (
                            <img 
                              src={redemption.reward_image_url} 
                              alt={redemption.reward_title} 
                              className="w-6 h-6 rounded"
                            />
                          )}
                          <span>{redemption.reward_title}</span>
                          <Badge className={getRarityColor(redemption.reward_rarity)}>
                            {redemption.reward_rarity}
                          </Badge>
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
                  min="0"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="0.00"
                />
                {listingPrice && (
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    {(() => {
                      const breakdown = getRevenueBreakdown(Math.round(parseFloat(listingPrice) * 100));
                      return (
                        <>
                          <div>You'll receive: {formatPrice(breakdown.sellerReceives)}</div>
                          <div>Buyer pays: {formatPrice(breakdown.total)}</div>
                          <div>Fees: {formatPrice(breakdown.sellerFee + breakdown.buyerFee + breakdown.creatorRoyalty)}</div>
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
                  placeholder="Add any additional details..."
                />
              </div>

              <Button 
                onClick={handleCreateListing}
                disabled={!selectedRedemption || !listingPrice}
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
          <TabsTrigger value="my_listings">My Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rewards or sellers..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredListings().map((listing) => {
              const breakdown = getRevenueBreakdown(listing.asking_price_cents);
              return (
                <Card key={listing.id} className="overflow-hidden">
                  {listing.reward_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={listing.reward_image_url} 
                        alt={listing.reward_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{listing.reward_title}</CardTitle>
                      {listing.reward_rarity && (
                        <Badge className={getRarityColor(listing.reward_rarity)}>
                          {listing.reward_rarity}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.seller_avatar && (
                        <img 
                          src={listing.seller_avatar} 
                          alt={listing.seller_name || 'Seller'}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        by {listing.seller_name}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {listing.description && (
                      <p className="text-sm text-muted-foreground">{listing.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(breakdown.total)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          +{formatPrice(breakdown.buyerFee)} fee
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Seller receives: {formatPrice(breakdown.sellerReceives)}</div>
                        <div>Creator royalty: {formatPrice(breakdown.creatorRoyalty)}</div>
                        <div>Platform fee: {formatPrice(breakdown.streamcentivesFee)}</div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handlePurchase(listing)}
                      className="w-full"
                      disabled={listing.seller_id === user?.id}
                    >
                      {listing.seller_id === user?.id ? (
                        'Your Listing'
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {getFilteredListings().length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters, or check back later for new listings.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my_listings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Active Listings</CardTitle>
              <CardDescription>
                Manage your marketplace listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your listings will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}