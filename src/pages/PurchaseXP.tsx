import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const XP_PACKAGES = [
  {
    id: "price_1S61gh2UwaYvRlm0O1VvcNIK",
    name: "Starter Pack",
    xp: 500,
    price: "$4.99",
    popular: false,
  },
  {
    id: "price_1S61gi2UwaYvRlm0fQVvlMzK",
    name: "Power Pack", 
    xp: 1200,
    price: "$9.99",
    popular: true,
  },
  {
    id: "price_1S61gj2UwaYvRlm0bJVvnOxL",
    name: "Ultimate Pack",
    xp: 2500,
    price: "$19.99", 
    popular: false,
  },
];

export default function PurchaseXP() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (priceId: string) => {
    try {
      setLoading(priceId);
      
      const { data, error } = await supabase.functions.invoke('create-xp-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
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
              Elevate your StreamCents experience. Purchase XP to message creators, elevate your exclusive rewards, and level up your fan journey.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {XP_PACKAGES.map((pkg) => (
            <Card key={pkg.id} className={`relative overflow-hidden backdrop-blur-sm bg-slate-800/30 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 ${pkg.popular ? 'ring-2 ring-cyan-400 shadow-2xl shadow-cyan-400/20 scale-105' : 'hover:scale-105'}`}>
              
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
                        <Zap className="h-8 w-8 text-cyan-300" />
                      </div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-cyan-300 mb-2">
                    {pkg.xp.toLocaleString()}
                  </div>
                  <div className="text-blue-200 text-sm font-medium">XP Points</div>
                </div>
              </CardHeader>
              
              <CardContent className="text-center relative z-10 pb-8">
                <div className="text-4xl font-bold text-white mb-6">{pkg.price}</div>
                <Button 
                  onClick={() => handlePurchase(pkg.id)}
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
                      <Zap className="mr-2 h-5 w-5" />
                      Get {pkg.xp.toLocaleString()} XP
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Most Popular Indicator */}
        <div className="flex justify-center mt-8">
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 px-6 py-2 rounded-full text-sm font-bold">
            ⭐ Most Popular
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-6">Why Purchase XP?</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="group">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-cyan-300" />
                </div>
                <div className="absolute inset-0 bg-cyan-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Message Creators</h4>
              <p className="text-blue-200">Connect directly with your favorite artists and influencers</p>
            </div>
            <div className="group">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-cyan-300" />
                </div>
                <div className="absolute inset-0 bg-cyan-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Exclusive Rewards</h4>
              <p className="text-blue-200">Unlock premium merchandise and limited-edition items</p>
            </div>
            <div className="group">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-cyan-300" />
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
  );
}