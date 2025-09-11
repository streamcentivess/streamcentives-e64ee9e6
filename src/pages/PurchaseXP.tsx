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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Purchase XP</h1>
        <p className="text-muted-foreground text-lg">
          Boost your experience points to unlock exclusive rewards and message creators
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {XP_PACKAGES.map((pkg) => (
          <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary shadow-lg' : ''}`}>
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <CardDescription>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-foreground">{pkg.xp.toLocaleString()}</span>
                  <span className="text-muted-foreground">XP</span>
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center">
              <div className="text-3xl font-bold mb-4">{pkg.price}</div>
              <Button 
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading === pkg.id}
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
              >
                {loading === pkg.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Purchase ${pkg.xp.toLocaleString()} XP`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-4">Why Purchase XP?</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <div>
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <p>Send messages to your favorite creators</p>
          </div>
          <div>
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <p>Unlock exclusive rewards and merchandise</p>
          </div>
          <div>
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <p>Participate in premium campaigns</p>
          </div>
        </div>
      </div>
    </div>
  );
}