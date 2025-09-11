import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Wand2, Target, Gift, Zap, Brain, Rocket, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AICampaignBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICampaignBuilder: React.FC<AICampaignBuilderProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const campaignTypes = [
    { id: 'streaming', label: '🎵 Streaming', desc: 'Boost plays & listens' },
    { id: 'sharing', label: '📱 Social Share', desc: 'Viral content spread' },
    { id: 'merchandise', label: '🛍️ Merch Push', desc: 'Product promotions' },
    { id: 'voting', label: '🗳️ Fan Vote', desc: 'Community decisions' },
    { id: 'upload', label: '📤 Content Upload', desc: 'User-generated content' }
  ];

  const handleGenerateCampaign = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your campaign idea!');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-campaign', {
        body: { 
          prompt: prompt.trim(),
          targetAudience: targetAudience.trim() || 'music fans',
          userId: user?.id
        }
      });

      if (error) throw error;
      
      setGeneratedCampaign(data.campaign);
      toast.success('🚀 AI Campaign Generated!');
    } catch (error) {
      console.error('Campaign generation error:', error);
      toast.error('Failed to generate campaign. Try again!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!generatedCampaign || !user) return;

    setIsCreating(true);
    try {
      const campaignData = {
        creator_id: user.id,
        title: generatedCampaign.title,
        description: generatedCampaign.description,
        type: generatedCampaign.type,
        xp_reward: generatedCampaign.xpReward,
        cash_reward: generatedCampaign.cashReward || 0,
        start_date: new Date().toISOString(),
        end_date: generatedCampaign.endDate,
        target_value: generatedCampaign.targetValue,
        target_metric: generatedCampaign.targetMetric,
        requirements: generatedCampaign.requirements,
        status: 'active'
      };

      const { error } = await supabase
        .from('campaigns')
        .insert([campaignData]);

      if (error) throw error;

      toast.success('🎉 Campaign Created Successfully!');
      setGeneratedCampaign(null);
      setPrompt('');
      setTargetAudience('');
      onClose();
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const resetBuilder = () => {
    setGeneratedCampaign(null);
    setPrompt('');
    setTargetAudience('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              AI Campaign Builder
            </span>
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedCampaign ? (
            <>
              {/* Campaign Types Grid */}
              <div className="grid grid-cols-5 gap-2">
                {campaignTypes.map((type) => (
                  <Card key={type.id} className="p-3 hover:shadow-glow transition-all cursor-pointer border-primary/20">
                    <div className="text-center">
                      <div className="text-lg mb-1">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.desc}</div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Input Section */}
              <Card className="border-2 border-primary/20 bg-gradient-subtle">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    Describe Your Campaign Vision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Campaign Idea 💡</label>
                    <Textarea
                      placeholder="e.g., I want to create a challenge where fans share my new song on TikTok and get rewarded for creativity..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Audience 🎯</label>
                    <Input
                      placeholder="e.g., Gen Z music lovers, indie fans, TikTok creators..."
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateCampaign}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full h-12 text-lg bg-gradient-primary hover:shadow-glow transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                        Generating Magic...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Generate AI Campaign
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Generated Campaign Preview */
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-primary">Campaign Generated!</h3>
                <p className="text-muted-foreground">Review and launch your AI-powered campaign</p>
              </div>

              <Card className="border-2 border-primary bg-gradient-subtle">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{generatedCampaign.title}</span>
                    <Badge className="bg-primary text-primary-foreground">
                      {generatedCampaign.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{generatedCampaign.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary" />
                        <span className="font-medium">Rewards</span>
                      </div>
                      <div className="pl-6">
                        <div>🎯 {generatedCampaign.xpReward} XP</div>
                        {generatedCampaign.cashReward > 0 && (
                          <div>💰 ${generatedCampaign.cashReward}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="font-medium">Target</span>
                      </div>
                      <div className="pl-6">
                        <div>{generatedCampaign.targetValue} {generatedCampaign.targetMetric}</div>
                      </div>
                    </div>
                  </div>

                  {generatedCampaign.requirements && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="font-medium">Requirements</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {generatedCampaign.requirements}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={resetBuilder}
                      className="flex-1"
                    >
                      Generate New
                    </Button>
                    <Button 
                      onClick={handleCreateCampaign}
                      disabled={isCreating}
                      className="flex-1 bg-gradient-primary"
                    >
                      {isCreating ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-pulse" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4 mr-2" />
                          Launch Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};