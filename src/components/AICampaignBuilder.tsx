import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Gift, Zap, Rocket, Star, Crown, TrendingUp, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCreatorSubscription } from '@/hooks/useCreatorSubscription';

interface AICampaignBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICampaignBuilder: React.FC<AICampaignBuilderProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isProSubscriber } = useCreatorSubscription();
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'listen',
    xpReward: 100,
    cashReward: 0,
    targetValue: '',
    requirements: ''
  });

  const campaignTypes = [
    { value: 'listen', label: '🎵 Listen Campaign', desc: 'Fans listen to your music' },
    { value: 'follow', label: '👥 Follow Campaign', desc: 'Gain new followers' },
    { value: 'share', label: '📱 Share Campaign', desc: 'Share content on social media' },
    { value: 'stream', label: '🔥 Stream Campaign', desc: 'Stream specific songs/playlists' },
    { value: 'purchase', label: '💰 Purchase Campaign', desc: 'Buy merchandise or music' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCampaign = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const campaignData = {
        creator_id: user?.id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        xp_reward: formData.xpReward,
        cash_reward: formData.cashReward,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        target_value: parseInt(formData.targetValue) || 1000,
        target_metric: formData.type === 'listen' ? 'plays' : formData.type === 'follow' ? 'followers' : 'shares',
        requirements: formData.requirements,
        status: 'active'
      };

      const { data: newCampaign, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;

      toast.success('🎉 Campaign Created Successfully!');
      setFormData({
        title: '',
        description: '',
        type: 'listen',
        xpReward: 100,
        cashReward: 0,
        targetValue: '',
        requirements: ''
      });
      onClose();
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpgradeToAI = () => {
    navigate('/creator-subscription');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            Campaign Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Upsell Card */}
          <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Want to create campaigns instantly?</h3>
                    <p className="text-sm text-muted-foreground">
                      Let AI build optimized campaigns for you in seconds with Creator Pro
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleUpgradeToAI}
                  className="bg-gradient-primary hover:shadow-glow"
                  disabled={isProSubscriber}
                >
                  {isProSubscriber ? (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Pro Active
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Campaign Builder */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Listen to My New Album"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Campaign Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div>{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.desc}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Campaign Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what fans need to do to participate in your campaign..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="xpReward">XP Reward</Label>
                  <Input
                    id="xpReward"
                    type="number"
                    min="0"
                    value={formData.xpReward}
                    onChange={(e) => handleInputChange('xpReward', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="cashReward">Cash Reward ($)</Label>
                  <Input
                    id="cashReward"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cashReward}
                    onChange={(e) => handleInputChange('cashReward', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="targetValue">Target Goal</Label>
                  <Input
                    id="targetValue"
                    placeholder="e.g., 1000"
                    value={formData.targetValue}
                    onChange={(e) => handleInputChange('targetValue', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="requirements">Requirements (Optional)</Label>
                <Textarea
                  id="requirements"
                  placeholder="Any specific requirements or instructions for fans..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={isCreating}
                  className="flex-1 bg-gradient-primary"
                >
                  {isCreating ? (
                    <>
                      <Target className="w-4 h-4 mr-2 animate-pulse" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-muted">
              <CardHeader>
                <CardTitle className="text-center text-lg">Manual Builder</CardTitle>
                <Badge variant="secondary" className="mx-auto">Current</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-primary" />
                  Create campaigns manually
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="w-4 h-4 text-primary" />
                  Set rewards and requirements
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  Basic targeting
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/50 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="text-center text-lg flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  AI Builder
                </CardTitle>
                <Badge className="mx-auto bg-primary">Creator Pro</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-primary" />
                  AI-powered campaign generation
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  KPI-driven optimization
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-primary" />
                  Advanced targeting & insights
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};