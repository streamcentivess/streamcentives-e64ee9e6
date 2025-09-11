import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, ExternalLink, Upload, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MerchandiseCampaignProps {
  campaign: any;
  onComplete: () => void;
}

export const MerchandiseCampaign = ({ campaign, onComplete }: MerchandiseCampaignProps) => {
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [merchStore, setMerchStore] = useState<any>(null);

  // Fetch merch store info from creator profile
  useEffect(() => {
    const fetchMerchStore = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('merch_store_url, merch_store_platform, merch_store_connected')
        .eq('user_id', campaign.creator_id)
        .single();
      
      if (profile?.merch_store_connected) {
        setMerchStore(profile);
      }
    };
    fetchMerchStore();
  }, [campaign.creator_id]);

  const handlePurchaseComplete = async () => {
    if (!proofUrl.trim()) {
      toast({
        title: "Proof Required",
        description: "Please provide proof of purchase URL or screenshot",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Complete the campaign interaction
      const { data, error } = await supabase.rpc('complete_campaign_interaction', {
        campaign_id_param: campaign.id,
        interaction_data_param: {
          type: 'purchase',
          proof_url: proofUrl,
          store_url: merchStore?.merch_store_url,
          platform: merchStore?.merch_store_platform
        }
      });

      if (error) throw error;

      const result = data as { success: boolean; xp_awarded: number; error?: string };
      if (result.success) {
        setCompleted(true);
        toast({
          title: "Purchase Verified!",
          description: `You've earned ${result.xp_awarded} XP for completing this campaign!`
        });
        onComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error completing purchase campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify purchase",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (completed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Campaign Completed!</h3>
          <p className="text-green-600">Thank you for supporting this creator's merchandise!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Purchase Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Purchase merchandise from this creator to complete the campaign and earn XP!
          </p>
          
          {merchStore ? (
            <div className="p-4 bg-primary/5 rounded-lg">
              <h4 className="font-medium mb-2">Creator's Store</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Platform: {merchStore.merch_store_platform}</p>
                </div>
                <Button 
                  onClick={() => window.open(merchStore.merch_store_url, '_blank')}
                  className="flex items-center gap-2"
                >
                  Visit Store <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Store information not available. Contact the creator for purchase details.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Proof of Purchase</label>
            <Input
              placeholder="Paste order confirmation URL or screenshot link here..."
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Provide your order confirmation email, receipt, or screenshot to verify your purchase
            </p>
          </div>

          <Button 
            onClick={handlePurchaseComplete}
            disabled={uploading || !proofUrl.trim()}
            className="w-full"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Verify Purchase & Complete Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};