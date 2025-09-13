import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AwardXP() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const amountParam = searchParams.get('amount');

  useEffect(() => {
    const award = async () => {
      if (!amountParam) {
        setError('Missing amount parameter');
        setLoading(false);
        return;
      }
      const amt = parseInt(amountParam, 10);
      if (!Number.isFinite(amt) || amt <= 0) {
        setError('Invalid amount');
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('award-xp', {
          body: { xpAmount: amt }
        });
        if (error) throw error;
        if (data?.success) {
          setResult(`${amt} XP added to your account`);
          toast({ title: 'XP Added', description: `${amt} XP has been added to your balance` });
          setTimeout(() => {
            navigate('/fan-dashboard');
          }, 1500);
        } else {
          throw new Error(data?.error || 'Failed to add XP');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to add XP');
        toast({ title: 'Error', description: e.message || 'Failed to add XP', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    award();
  }, [amountParam, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Adding XP...</h2>
              <p className="text-muted-foreground">Please wait while we update your balance</p>
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
            <CardTitle className="text-destructive">Failed to Add XP</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/fan-dashboard">Go to Dashboard</Link>
              </Button>
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
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">XP Added</CardTitle>
          <CardDescription>{result}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link to="/fan-dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
