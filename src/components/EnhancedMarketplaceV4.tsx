import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, ShoppingCart, Coins, Star, Clock, User, Gift, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketplaceListing {
  id: string;
  reward_redemption_id: string;
  seller_id: string;
  asking_price_cents: number;
  asking_price_xp: number;
  description: string;
  is_active: boolean;
  is_sold: boolean;
  created_at: string;
  reward_type?: string;
  seller?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
  reward_data?: any;
}

interface UserXPBalance {
  current_xp: number;
}

const EnhancedMarketplaceV4 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [userXPBalance, setUserXPBalance] = useState<UserXPBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [buyerNote, setBuyerNote] = useState('');

  useEffect(() => {
    fetchMarketplaceLists();
    if (user) {
      fetchUserXPBalance();
    }
  }, [user]);

  const fetchMarketplaceLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('is_active', true)
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch seller profiles separately
      const listingsWithSellers = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', listing.seller_id)
            .single();

          return {
            ...listing,
            seller: sellerData || null
          };
        })
      );

      setListings(listingsWithSellers);
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserXPBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_xp_balances')
        .select('current_xp')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching XP balance:', error);
      } else {
        setUserXPBalance(data || { current_xp: 0 });
      }
    } catch (error) {
      console.error('Error fetching XP balance:', error);
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedListing) return;

    if (selectedListing.seller_id === user.id) {
      toast({
        title: "Cannot Purchase",
        description: "You cannot purchase your own listing",
        variant: "destructive",
      });
      return;
    }

    if (userXPBalance && userXPBalance.current_xp < selectedListing.asking_price_xp) {
      toast({
        title: "Insufficient XP",
        description: `You need ${selectedListing.asking_price_xp} XP but only have ${userXPBalance.current_xp} XP`,
        variant: "destructive",
      });
      return;
    }

    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-purchase-xp', {
        body: {
          listingId: selectedListing.id,
          buyerNote: buyerNote
        }
      });

      if (error) throw error;

      toast({
        title: "Purchase Successful!",
        description: `You've successfully purchased this item for ${selectedListing.asking_price_xp} XP`,
      });

      // Refresh data
      fetchMarketplaceLists();
      fetchUserXPBalance();
      setPurchaseDialogOpen(false);
      setSelectedListing(null);
      setBuyerNote('');
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const openPurchaseDialog = (listing: MarketplaceListing) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make purchases",
        variant: "destructive",
      });
      return;
    }
    setSelectedListing(listing);
    setBuyerNote('');
    setPurchaseDialogOpen(true);
  };

  const filteredListings = listings.filter(listing =>
    listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.seller?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatXP = (xp: number) => {
    return new Intl.NumberFormat('en-US').format(xp);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getRewardTypeIcon = (type?: string) => {
    switch (type) {
      case 'physical': return <Gift className="h-4 w-4" />;
      case 'experiential': return <MapPin className="h-4 w-4" />;
      case 'digital': return <Star className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getRewardTypeColor = (type?: string) => {
    switch (type) {
      case 'physical': return 'bg-blue-500';
      case 'experiential': return 'bg-purple-500';
      case 'digital': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell rewards with XP</p>
        </div>
        {user && userXPBalance && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-medium">{formatXP(userXPBalance.current_xp)} XP</span>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="shrink-0">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No listings found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new listings'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    {getRewardTypeIcon(listing.reward_type)}
                    <Badge className={getRewardTypeColor(listing.reward_type)}>
                      {listing.reward_type || 'reward'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Coins className="h-4 w-4" />
                      {formatXP(listing.asking_price_xp)} XP
                    </div>
                    {listing.asking_price_cents > 0 && (
                      <div className="text-sm text-muted-foreground">
                        or {formatCurrency(listing.asking_price_cents)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{listing.seller?.display_name || listing.seller?.username || 'Anonymous'}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm line-clamp-3">{listing.description}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(listing.created_at).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  onClick={() => openPurchaseDialog(listing)}
                  className="w-full"
                  disabled={listing.seller_id === user?.id}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {listing.seller_id === user?.id ? 'Your Listing' : 'Purchase'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to purchase this item?
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Purchase Summary</h4>
                  <Badge className={getRewardTypeColor(selectedListing.reward_type)}>
                    {selectedListing.reward_type || 'reward'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedListing.description}
                </p>
                <div className="flex justify-between items-center">
                  <span>Total Price:</span>
                  <div className="flex items-center gap-1 font-bold text-primary">
                    <Coins className="h-4 w-4" />
                    {formatXP(selectedListing.asking_price_xp)} XP
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                  <span>Platform Fee (2%):</span>
                  <span>{formatXP(Math.floor(selectedListing.asking_price_xp * 0.02))} XP</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Seller Receives:</span>
                  <span>{formatXP(selectedListing.asking_price_xp - Math.floor(selectedListing.asking_price_xp * 0.02))} XP</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer-note">Message to Seller (Optional)</Label>
                <Textarea
                  id="buyer-note"
                  placeholder="Add a note for the seller..."
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  rows={3}
                />
              </div>

              {userXPBalance && userXPBalance.current_xp < selectedListing.asking_price_xp && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    Insufficient XP balance. You need {formatXP(selectedListing.asking_price_xp)} XP 
                    but only have {formatXP(userXPBalance.current_xp)} XP.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPurchaseDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing || (userXPBalance && userXPBalance.current_xp < selectedListing.asking_price_xp)}
                  className="flex-1"
                >
                  {purchasing ? 'Processing...' : 'Confirm Purchase'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMarketplaceV4;