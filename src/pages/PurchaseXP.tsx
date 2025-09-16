import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Crown, Check, Coins, Users, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Custom XP Coin component
const XPCoin = ({ className }: { className?: string }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    <svg
      viewBox="0 0 32 32"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer gold ring */}
      <circle
        cx="16"
        cy="16"
        r="15"
        stroke="#FFD700"
        strokeWidth="2"
        fill="#FFC107"
        className="drop-shadow-lg"
      />
      {/* Inner coin body */}
      <circle
        cx="16"
        cy="16"
        r="12"
        fill="#FFEB3B"
        stroke="#FFD700"
        strokeWidth="1"
      />
      {/* XP text */}
      <text
        x="16"
        y="20"
        textAnchor="middle"
        className="text-[10px] font-bold fill-amber-800"
        fontFamily="Arial, sans-serif"
      >
        XP
      </text>
    </svg>
  </div>
);

interface XPPackage {
  id: string;
  name: string;
  xp: number;
  price: string;
  price_cents: number;
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
    id: "price_1S65Zr2XJfhJAhD8CuWu3KKI",
    name: "Starter Pack",
    xp: 500,
    price: "$4.99",
    price_cents: 499,
    popular: false,
    type: 'platform',
  },
  {
    id: "price_1S65hR2XJfhJAhD8Qal3BZEY",
    name: "Power Pack", 
    xp: 1220,
    price: "$9.99",
    price_cents: 999,
    popular: true,
    type: 'platform',
  },
  {
    id: "price_1S65lJ2XJfhJAhD8axA12XlE",
    name: "Ultimate Pack",
    xp: 2500,
    price: "$19.99", 
    price_cents: 1999,
    popular: false,
    type: 'platform',
  },
  {
    id: "price_creator_support",
    name: "Creator Support",
    xp: 250,
    price: "$5.99",
    price_cents: 599,
    popular: false,
    type: 'creator_specific',
  },
];

export default function PurchaseXP() {
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'platform' | 'creator_specific'>('platform');
  const { toast } = useToast();
  const { user } = useAuth();

  // Check subscription status on mount
  useEffect(() => {
    if (user) {
      checkSubscription();
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

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionData(data);
    } catch (error: any) {
      console.error("Failed to check subscription:", error);
    }
  };

  const handleSubscriptionCheckout = async () => {
    try {
      setSubscriptionLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: "price_1S65rm2XJfhJAhD8TGvfijgk" }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription checkout",
        variant: "destructive",
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setSubscriptionLoading(false);
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

    try {
      setLoading(pkg.id);
      
      if (pkg.type === 'creator_specific') {
        // Use enhanced XP purchase for creator-specific XP
        const { data, error } = await supabase.functions.invoke('enhanced-xp-purchase', {
          body: {
            xpAmount: pkg.xp,
            priceId: pkg.id,
            creatorId: selectedCreator,
            xpType: pkg.type
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        // Use regular XP purchase for platform XP
        const { data, error } = await supabase.functions.invoke('create-xp-checkout', {
          body: { priceId: pkg.id }
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Hero Section with XP Image */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img 
                  src="/lovable-uploads/696807ab-f28f-43f5-9bf2-0e5f252915af.png" 
                  alt="StreamCents XP" 
                  className="w-64 h-64 object-contain drop-shadow-2xl rounded-3xl"
                />
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 text-white">
              Power Up with <span className="text-cyan-400">XP</span>
            </h1>
            <p className="text-blue-200 text-xl max-w-2xl mx-auto">
              Choose between universal platform XP or support your favorite creators directly with creator-specific XP.
            </p>
          </div>
        </div>
      </div>

      {/* XP Purchase Tabs */}
      <div className="container mx-auto px-4 pb-16">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'platform' | 'creator_specific')} 
          className="max-w-6xl mx-auto"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Platform XP
            </TabsTrigger>
            <TabsTrigger value="creator_specific" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Creator XP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Platform XP Packages</h2>
              <p className="text-blue-200 text-lg">
                Universal XP that works across the entire platform for rewards, messages, and campaigns.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {XP_PACKAGES.filter(pkg => pkg.type === 'platform').map((pkg) => {
                const breakdown = getRevenueBreakdown(pkg.price_cents, pkg.type);
                return (
                  <Card key={pkg.id} className={`relative overflow-hidden backdrop-blur-sm bg-slate-800/30 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 ${pkg.popular ? 'ring-2 ring-cyan-400 shadow-2xl shadow-cyan-400/20 scale-105' : 'hover:scale-105'}`}>
                    
                    {pkg.popular && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    
                    {/* Animated background glow */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 animate-pulse"></div>
                    </div>
                    
                    <CardHeader className="text-center relative z-10 pt-8">
                      <CardTitle className="text-2xl font-bold text-white mb-4">{pkg.name}</CardTitle>
                      <div className="relative">
                        {/* Mini XP visualization */}
                        <div className="flex justify-center mb-4">
                          <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30"></div>
                            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-400/40 to-blue-500/40 flex items-center justify-center">
                              <XPCoin className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                        <div className="text-4xl font-bold text-cyan-300 mb-2">
                          {pkg.xp.toLocaleString()}
                        </div>
                        <div className="text-blue-200 text-sm font-medium">XP Points</div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="text-center relative z-10 pb-8 space-y-4">
                      <div className="text-4xl font-bold text-white mb-4">{pkg.price}</div>
                      
                      <div className="text-sm text-muted-foreground space-y-1 bg-slate-800/50 p-3 rounded-lg">
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
                        disabled={loading === pkg.id}
                        className={`w-full h-12 font-semibold text-lg transition-all duration-300 ${
                          pkg.popular 
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-900 shadow-lg shadow-cyan-400/25' 
                            : 'bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600 hover:border-cyan-400/50'
                        }`}
                      >
                        {loading === pkg.id ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XPCoin className="mr-2 h-5 w-5" />
                            Get {pkg.xp.toLocaleString()} XP
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="creator_specific" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Creator-Specific XP</h2>
              <p className="text-blue-200 text-lg">
                Support your favorite creators directly! XP tied to specific creators with revenue sharing.
              </p>
            </div>

            <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700 max-w-md mx-auto mb-8">
              <CardContent className="p-6">
                <label className="text-white font-medium mb-3 block">Select Creator to Support</label>
                <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
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
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {XP_PACKAGES.filter(pkg => pkg.type === 'creator_specific').map((pkg) => {
                const breakdown = getRevenueBreakdown(pkg.price_cents, pkg.type);
                return (
                  <Card key={pkg.id} className="relative overflow-hidden backdrop-blur-sm bg-slate-800/30 border-slate-700 hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                    
                    {/* Creator support indicator */}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900">
                        <Users className="h-3 w-3 mr-1" />
                        Creator Support
                      </Badge>
                    </div>
                    
                    {/* Animated background glow */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 animate-pulse"></div>
                    </div>
                    
                    <CardHeader className="text-center relative z-10 pt-8">
                      <CardTitle className="text-2xl font-bold text-white mb-4">{pkg.name}</CardTitle>
                      <div className="relative">
                        {/* Mini XP visualization */}
                        <div className="flex justify-center mb-4">
                          <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-400/30"></div>
                            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-400/40 to-emerald-500/40 flex items-center justify-center">
                              <XPCoin className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                        <div className="text-4xl font-bold text-green-300 mb-2">
                          {pkg.xp.toLocaleString()}
                        </div>
                        <div className="text-green-200 text-sm font-medium">Creator XP Points</div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="text-center relative z-10 pb-8 space-y-4">
                      <div className="text-4xl font-bold text-white mb-4">{pkg.price}</div>
                      
                      <div className="text-sm text-muted-foreground space-y-1 bg-slate-800/50 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{formatPrice(breakdown.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee:</span>
                          <span>{formatPrice(breakdown.streamcentivesFee)}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                          <span>Creator Share:</span>
                          <span>{formatPrice(breakdown.creatorShare)}</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handlePurchase(pkg)}
                        disabled={loading === pkg.id || !selectedCreator}
                        className="w-full h-12 font-semibold text-lg transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-400/25"
                      >
                        {loading === pkg.id ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Coins className="mr-2 h-5 w-5" />
                            Support Creator
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Creator Pro Subscription Section */}
        <div className="mt-16 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Unlock Creator <span className="text-yellow-400">Pro</span>
            </h2>
            <p className="text-blue-200 text-lg">
              Get unlimited features and premium tools for serious creators
            </p>
          </div>
          
          <Card className="max-w-lg mx-auto relative overflow-hidden backdrop-blur-sm bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/50 shadow-2xl shadow-yellow-400/20">
            {/* Premium glow effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 animate-pulse"></div>
            </div>
            
            <CardHeader className="text-center relative z-10 pt-8">
              <div className="flex justify-center mb-4">
                <Badge className="bg-yellow-500 text-black font-bold px-4 py-1">
                  <Crown className="h-4 w-4 mr-2" />
                  PREMIUM
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">Creator Pro</CardTitle>
              <CardDescription className="text-yellow-200 text-lg">
                Everything you need to monetize your content
              </CardDescription>
              
              <div className="text-5xl font-bold text-yellow-300 mt-4 mb-2">
                $8.99
                <span className="text-lg text-yellow-200">/month</span>
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 pb-8">
              {/* Features list */}
              <div className="space-y-3 mb-6">
                {[
                  "Unlimited XP messaging",
                  "Advanced analytics dashboard", 
                  "Custom reward creation",
                  "Priority customer support",
                  "Exclusive creator tools",
                  "Revenue optimization features"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-white">
                    <Check className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Action button */}
              {subscriptionData?.subscribed ? (
                <Button 
                  onClick={handleManageSubscription}
                  disabled={subscriptionLoading}
                  className="w-full h-12 font-semibold text-lg bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-400/25"
                >
                  {subscriptionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Manage Subscription
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleSubscriptionCheckout}
                  disabled={subscriptionLoading}
                  className="w-full h-12 font-semibold text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg shadow-yellow-400/25"
                >
                  {subscriptionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Start Pro Subscription
                    </>
                  )}
                </Button>
              )}
              
              {subscriptionData?.subscribed && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <p className="text-green-300 text-sm text-center">
                    ✅ Active {subscriptionData.subscription_tier} subscription
                    {subscriptionData.subscription_end && (
                      <span className="block text-green-400 text-xs mt-1">
                        Renews on {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-6">Why Purchase XP?</h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <XPCoin className="h-8 w-8" />
                  </div>
                  <div className="absolute inset-0 bg-cyan-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h4 className="text-lg font-semibold text-white mb-3">Message Creators</h4>
                <p className="text-blue-200">Connect directly with your favorite artists and influencers</p>
              </div>
              <div className="group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="absolute inset-0 bg-green-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h4 className="text-lg font-semibold text-white mb-3">Support Creators</h4>
                <p className="text-blue-200">Directly support your favorite creators with revenue sharing</p>
              </div>
              <div className="group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <XPCoin className="h-8 w-8" />
                  </div>
                  <div className="absolute inset-0 bg-cyan-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h4 className="text-lg font-semibold text-white mb-3">Premium Access</h4>
                <p className="text-blue-200">Join exclusive campaigns and special events</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}