import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Users, Zap } from 'lucide-react';

const BulkXPUpdate = () => {
  const [xpAmount, setXpAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBulkUpdate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-update-xp', {
        body: { xpAmount }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Failed to update XP');
      }

      console.log('Bulk update result:', data);
      setResult(data);
      
      if (data.success) {
        toast({
          title: "Success!",
          description: `Updated XP for ${data.updatedCount} users`,
        });
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error: any) {
      console.error('Error updating XP:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update XP',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk XP Update
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="xp-amount">XP Amount for All Users</Label>
              <Input
                id="xp-amount"
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(Number(e.target.value))}
                placeholder="Enter XP amount"
              />
            </div>

            <Button 
              onClick={handleBulkUpdate}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Update All Users to {xpAmount} XP
                </>
              )}
            </Button>

            {result && (
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Status:</strong> {result.success ? 'Success' : 'Failed'}
                    </p>
                    <p className="text-sm">
                      <strong>Updated Users:</strong> {result.updatedCount}
                    </p>
                    <p className="text-sm">
                      <strong>Total Users:</strong> {result.totalUsers}
                    </p>
                    {result.message && (
                      <p className="text-sm">
                        <strong>Message:</strong> {result.message}
                      </p>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-destructive">Errors:</p>
                        <ul className="text-xs text-muted-foreground">
                          {result.errors.map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkXPUpdate;