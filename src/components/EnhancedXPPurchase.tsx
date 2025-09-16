import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Coins, Users, Zap, Star } from 'lucide-react';

interface XPPackage {
  id: string;
  name: string;
  xp_amount: number;
  price_cents: number;
  price_id: string;
  popular?: boolean;
  type: 'platform' | 'creator_specific';
}

interface Creator {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

const XP_PACKAGES: XPPackage[] = [
  {
    id: 'platform_100',
    name: 'Starter Pack',
    xp_amount: 100,
    price_cents: 199,
    price_id: 'price_starter_xp',
    type: 'platform'
  },
  {
    id: 'platform_500',
    name: 'Power User',
    xp_amount: 500,
    price_cents: 899,
    price_id: 'price_power_xp',
    popular: true,
    type: 'platform'
  },
  {
    id: 'platform_1000',
    name: 'XP Master',
    xp_amount: 1000,
    price_cents: 1599,
    price_id: 'price_master_xp',
    type: 'platform'
  },
  {
    id: 'creator_250',
    name: 'Creator Support',
    xp_amount: 250,
    price_cents: 599,
    price_id: 'price_creator_xp',
    type: 'creator_specific'
  }
];

export function EnhancedXPPurchase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'platform' | 'creator_specific'>('platform');

  useEffect(() => {
    if (user) {
      fetchCreators();
    }
  }, [user]);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .limit(20);

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
    }
  };

  const handlePurchase = async (pkg: XPPackage) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase XP",
        variant: "destructive"
      });
      return;
    }

    if (pkg.type === 'creator_specific' && !selectedCreator) {
      toast({
        title: "Creator Required",
        description: "Please select a creator for creator-specific XP",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-xp-purchase', {
        body: {
          xpAmount: pkg.xp_amount,
          priceId: pkg.price_id,
          creatorId: pkg.type === 'creator_specific' ? selectedCreator : null,
          xpType: pkg.type
        }
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error purchasing XP:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to initiate purchase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getRevenueBreakdown = (cents: number, type: 'platform' | 'creator_specific') => {
    const streamcentivesFee = 50; // 50 cents
    const creatorShare = type === 'creator_specific' ? cents - streamcentivesFee : 0;
    
    return {
      total: cents,
      streamcentivesFee,
      creatorShare,
      platformShare: type === 'platform' ? cents - streamcentivesFee : 0
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Purchase XP</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose between platform XP for universal use, or creator-specific XP to support your favorite creators directly.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'platform' | 'creator_specific')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Platform XP
          </TabsTrigger>
          <TabsTrigger value="creator_specific" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Creator XP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Platform XP Packages
              </CardTitle>
              <CardDescription>
                Universal XP that can be used across the entire platform for rewards, messages, and campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {XP_PACKAGES.filter(pkg => pkg.type === 'platform').map((pkg) => {
                  const breakdown = getRevenueBreakdown(pkg.price_cents, pkg.type);
                  return (
                    <Card key={pkg.id} className={`relative ${pkg.popular ? 'ring-2 ring-primary' : ''}`}>
                      {pkg.popular && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <div className="text-3xl font-bold text-primary">
                          {pkg.xp_amount.toLocaleString()} XP
                        </div>
                        <div className="text-2xl font-semibold">
                          {formatPrice(pkg.price_cents)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{formatPrice(breakdown.total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform Fee:</span>
                            <span>{formatPrice(breakdown.streamcentivesFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform Share:</span>
                            <span>{formatPrice(breakdown.platformShare)}</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handlePurchase(pkg)}
                          disabled={loading}
                          className="w-full"
                        >
                          <Coins className="h-4 w-4 mr-2" />
                          Purchase
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creator_specific" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Creator-Specific XP
              </CardTitle>
              <CardDescription>
                XP tied to specific creators. Can only be used for that creator's rewards and content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Creator</label>
                <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a creator to support" />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map((creator) => (
                      <SelectItem key={creator.user_id} value={creator.user_id}>
                        <div className="flex items-center gap-2">
                          {creator.avatar_url && (
                            <img 
                              src={creator.avatar_url} 
                              alt={creator.display_name || creator.username} 
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>{creator.display_name || creator.username}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {XP_PACKAGES.filter(pkg => pkg.type === 'creator_specific').map((pkg) => {
                  const breakdown = getRevenueBreakdown(pkg.price_cents, pkg.type);
                  return (
                    <Card key={pkg.id}>
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <div className="text-3xl font-bold text-primary">
                          {pkg.xp_amount.toLocaleString()} XP
                        </div>
                        <div className="text-2xl font-semibold">
                          {formatPrice(pkg.price_cents)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{formatPrice(breakdown.total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform Fee:</span>
                            <span>{formatPrice(breakdown.streamcentivesFee)}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Creator Share:</span>
                            <span>{formatPrice(breakdown.creatorShare)}</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handlePurchase(pkg)}
                          disabled={loading || !selectedCreator}
                          className="w-full"
                        >
                          <Coins className="h-4 w-4 mr-2" />
                          Support Creator
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}