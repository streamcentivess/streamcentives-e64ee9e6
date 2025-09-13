import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function XPPurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [xpAdded, setXpAdded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found");
      setLoading(false);
      return;
    }

    const verifyPurchase = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-xp-purchase', {
          body: { sessionId }
        });

        if (error) throw error;

        if (data?.success) {
          setXpAdded(data.xp_added);
          toast({
            title: "Purchase Successful!",
            description: `${data.xp_added} XP has been added to your account`,
          });
          
          // Refresh the page after a short delay to update XP balance
          setTimeout(() => {
            navigate(0); // React Router way to reload
          }, 2000);
        } else {
          throw new Error(data?.error || "Failed to verify purchase");
        }
      } catch (error: any) {
        setError(error.message || "Failed to verify purchase");
        toast({
          title: "Verification Error",
          description: error.message || "Failed to verify your purchase",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPurchase();
  }, [sessionId, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Verifying Purchase</h2>
              <p className="text-muted-foreground">Please wait while we confirm your XP purchase...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Purchase Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact support with your session ID: {sessionId}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/purchase-xp">Try Again</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/fan-dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
          <CardDescription>Your XP has been added to your account</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">{xpAdded?.toLocaleString()}</span>
              <span className="text-muted-foreground">XP Added</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You can now use this XP to message creators and unlock rewards!
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/fan-dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/universal-profile">Return to Profile</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/marketplace">Browse Rewards</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}