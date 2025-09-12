import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Sparkles, Wand2, Target, Gift, Zap, Brain, Rocket, Star, Upload, Image, TrendingUp, Users, DollarSign } from 'lucide-react';
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
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [kpiGoal, setKpiGoal] = useState('');
  const [targetMetric, setTargetMetric] = useState('');
  const [timeframe, setTimeframe] = useState('2_weeks');

  const kpiGoals = [
    { id: 'streams', label: '🎵 Increase Streams', icon: TrendingUp, desc: 'Boost plays & listens' },
    { id: 'followers', label: '👥 Grow Fanbase', icon: Users, desc: 'Gain new followers' },
    { id: 'revenue', label: '💰 Generate Revenue', icon: DollarSign, desc: 'Drive sales & earnings' },
    { id: 'engagement', label: '❤️ Boost Engagement', icon: Target, desc: 'Increase interactions' }
  ];

  const timeframes = [
    { id: '1_week', label: '1 Week', desc: 'Quick sprint' },
    { id: '2_weeks', label: '2 Weeks', desc: 'Standard campaign' },
    { id: '1_month', label: '1 Month', desc: 'Long-term push' },
    { id: '3_months', label: '3 Months', desc: 'Major milestone' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedImages(prev => [...prev, ...files].slice(0, 3)); // Max 3 images
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateCampaign = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your campaign idea!');
      return;
    }
    if (!kpiGoal) {
      toast.error('Please select a KPI goal!');
      return;
    }

    setIsGenerating(true);
    try {
      // Convert images to base64 for AI analysis
      const imageData = await Promise.all(
        uploadedImages.map(async (file) => {
          const reader = new FileReader();
          return new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      const { data, error } = await supabase.functions.invoke('generate-ai-campaign', {
        body: { 
          prompt: prompt.trim(),
          targetAudience: targetAudience.trim() || 'music fans',
          kpiGoal,
          targetMetric: targetMetric.trim(),
          timeframe,
          images: imageData,
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

      const { data: newCampaign, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;

      // Check for Creator Pro subscription and apply boost
      const { data: subscription } = await supabase
        .from('ai_tool_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_name', 'creator_pro')
        .eq('status', 'active')
        .single();

      let boostMessage = '';
      if (subscription && newCampaign) {
        try {
          const { data: boostResult, error: boostError } = await supabase
            .rpc('apply_creator_pro_boost', {
              campaign_id_param: newCampaign.id,
              creator_id_param: user.id
            });

          if (!boostError && boostResult) {
            const result = boostResult as any;
            if (result?.success) {
              boostMessage = `\n🚀 Creator Pro Boost Applied! Visibility score: ${result.new_visibility_score}`;
            }
          }
        } catch (boostErr) {
          console.log('Boost application failed:', boostErr);
        }
      }

      toast.success(`🎉 Campaign Created Successfully!${boostMessage}`);
      setGeneratedCampaign(null);
      setPrompt('');
      setTargetAudience('');
      setKpiGoal('');
      setTargetMetric('');
      setUploadedImages([]);
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
    setKpiGoal('');
    setTargetMetric('');
    setUploadedImages([]);
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
              {/* KPI Goals Grid */}
              <Card className="border-2 border-primary/20 bg-gradient-subtle">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    What's Your Main Goal? 🎯
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {kpiGoals.map((goal) => (
                      <Card 
                        key={goal.id} 
                        className={`p-4 hover:shadow-glow transition-all cursor-pointer border-2 ${
                          kpiGoal === goal.id ? 'border-primary bg-primary/5' : 'border-primary/20'
                        }`}
                        onClick={() => setKpiGoal(goal.id)}
                      >
                        <div className="flex items-center gap-3">
                          <goal.icon className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-medium">{goal.label}</div>
                            <div className="text-xs text-muted-foreground">{goal.desc}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {kpiGoal && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Target Number</Label>
                        <Input
                          placeholder="e.g., 10,000 streams, 500 followers..."
                          value={targetMetric}
                          onChange={(e) => setTargetMetric(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Timeframe</Label>
                        <select 
                          value={timeframe} 
                          onChange={(e) => setTimeframe(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                        >
                          {timeframes.map(tf => (
                            <option key={tf.id} value={tf.id}>{tf.label} - {tf.desc}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reference Images Upload */}
              <Card className="border-2 border-primary/20 bg-gradient-subtle">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Reference Images (Optional) 📸
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Upload reference images for your campaign (max 3)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Album covers, promotional materials, event photos, etc.
                      </p>
                    </label>
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Reference ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-primary/20"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Description */}
              <Card className="border-2 border-primary/20 bg-gradient-subtle">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    Campaign Strategy & Vision 🚀
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Campaign Strategy 💡</Label>
                    <Textarea
                      placeholder="Describe your campaign strategy, what specific actions you want fans to take, and how you'll motivate them to participate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Target Audience 🎯</Label>
                    <Input
                      placeholder="e.g., Gen Z music lovers, indie fans, TikTok creators..."
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateCampaign}
                    disabled={isGenerating || !prompt.trim() || !kpiGoal}
                    className="w-full h-12 text-lg bg-gradient-primary hover:shadow-glow transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Brain className="w-5 h-5 mr-2 animate-pulse" />
                        AI Building Your Campaign...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Generate KPI-Driven Campaign
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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