import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, ExternalLink, Check, Copy, Twitter, Facebook } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ShareCampaignProps {
  campaign: any;
  onComplete: () => void;
}

export const ShareCampaign = ({ campaign, onComplete }: ShareCampaignProps) => {
  const [completed, setCompleted] = useState(false);
  const [postData, setPostData] = useState<any>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchPostData();
  }, [campaign.id]);

  const fetchPostData = async () => {
    // Get post data from campaign assets
    const { data } = await supabase
      .from('campaign_assets')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('asset_type', 'post')
      .single();

    if (data) {
      setPostData(data.asset_data);
    } else {
      // Default share content
      setPostData({
        content: campaign.description || "Check out this amazing creator!",
        image_url: campaign.image_url,
        hashtags: ["#streamcentives", "#creator"]
      });
    }
  };

  const handleShare = async (platform: string) => {
    setSharing(true);
    try {
      let shareUrl = '';
      const shareText = `${postData.content} ${postData.hashtags?.join(' ') || ''}`;
      const campaignUrl = `${window.location.origin}/fan-campaigns?highlight=${campaign.id}`;

      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(campaignUrl)}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}&quote=${encodeURIComponent(shareText)}`;
          break;
        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n${campaignUrl}`);
          toast({
            title: "Copied!",
            description: "Share content copied to clipboard"
          });
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }

      // Complete campaign after sharing
      setTimeout(async () => {
        const { data, error } = await supabase.rpc('complete_campaign_interaction', {
          campaign_id_param: campaign.id,
          interaction_data_param: {
            type: 'share',
            platform: platform,
            content: shareText,
            timestamp: new Date().toISOString()
          }
        });

        if (error) throw error;

        const result = data as { success: boolean; xp_awarded: number; message?: string };
        if (result.success) {
          setCompleted(true);
          toast({
            title: "Share Completed!",
            description: `You've earned ${result.xp_awarded} XP for sharing this content!`
          });
          onComplete();
        }
      }, 1000);

    } catch (error: any) {
      console.error('Error completing share campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete share",
        variant: "destructive"
      });
    } finally {
      setSharing(false);
    }
  };

  if (completed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Campaign Completed!</h3>
          <p className="text-green-600">Thank you for sharing and supporting this creator!</p>
        </CardContent>
      </Card>
    );
  }

  if (!postData) {
    return <div className="animate-pulse">Loading share content...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Share this creator's content to complete the campaign and earn XP!
          </p>

          {/* Preview of content to share */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Content to Share:</h4>
              <div className="space-y-2">
                <p className="text-sm">{postData.content}</p>
                {postData.image_url && (
                  <img 
                    src={postData.image_url} 
                    alt="Share content" 
                    className="w-full max-w-sm h-32 object-cover rounded"
                  />
                )}
                {postData.hashtags && postData.hashtags.length > 0 && (
                  <p className="text-xs text-primary">
                    {postData.hashtags.join(' ')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Share buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button 
              onClick={() => handleShare('twitter')}
              disabled={sharing}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Share on X
            </Button>
            
            <Button 
              onClick={() => handleShare('facebook')}
              disabled={sharing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Share on Facebook
            </Button>
            
            <Button 
              onClick={() => handleShare('copy')}
              disabled={sharing}
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Share on any platform to complete the campaign
          </div>
        </CardContent>
      </Card>
    </div>
  );
};