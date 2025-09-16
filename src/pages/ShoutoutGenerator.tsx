import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mic, RefreshCw, Users, Trophy, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { FanSelector } from '@/components/FanSelector';
import { AchievementSelector } from '@/components/AchievementSelector';
import { ShoutoutPreview } from '@/components/ShoutoutPreview';

const ShoutoutGenerator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enhanced state
  const [selectedFan, setSelectedFan] = useState<any>(null);
  const [selectedAchievements, setSelectedAchievements] = useState<any[]>([]);
  const [availableRewards, setAvailableRewards] = useState<any[]>([]);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [tone, setTone] = useState('friendly');
  const [shoutout, setShoutout] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load creator's rewards
  useEffect(() => {
    if (user) {
      loadCreatorRewards();
    }
  }, [user]);

  const loadCreatorRewards = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('rewards')
        .select('id, title, image_url, xp_cost, cash_price, quantity_available, quantity_redeemed')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .filter('quantity_available', 'gt', 'quantity_redeemed')
        .order('created_at', { ascending: false });

      setAvailableRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const generateShoutout = async () => {
    if (!selectedFan || selectedAchievements.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a fan and at least one achievement",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create achievement summary
      const achievementText = selectedAchievements.map(a => a.title).join(', ');
      const achievementDetails = selectedAchievements.map(a => `${a.title}: ${a.description}`).join('\n');

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `Generate a personalized ${tone} shoutout for a fan named "${selectedFan.display_name}" (@${selectedFan.username}) who achieved the following: ${achievementDetails}. 

Make it genuine, engaging, and encouraging. Mention specific achievements naturally. Keep it under 280 characters for social media. Make it feel personal and celebratory.`,
          type: 'shoutout'
        }
      });

      if (error) throw error;
      setShoutout(data.content || data.generatedText || '');
    } catch (error) {
      console.error('Error generating shoutout:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate shoutout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendShoutout = async () => {
    if (!selectedFan || !shoutout.trim()) return;

    setSending(true);
    try {
      // Save shoutout to database
      const { data, error } = await supabase
        .from('shoutouts')
        .insert([{
          creator_id: user?.id,
          fan_id: selectedFan.user_id,
          fan_display_name: selectedFan.display_name,
          fan_username: selectedFan.username,
          achievement_text: selectedAchievements.map(a => a.title).join(', '),
          achievements_data: selectedAchievements,
          shoutout_text: shoutout.trim(),
          tone: tone,
          reward_id: selectedReward?.id || null,
          reward_data: selectedReward ? {
            title: selectedReward.title,
            xp_cost: selectedReward.xp_cost,
            cash_price: selectedReward.cash_price
          } : null,
          is_sent: true,
          sent_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // If reward is attached, handle reward delivery
      if (selectedReward) {
        // This could trigger a reward redemption process
        console.log('Reward attached:', selectedReward);
      }

      toast({
        title: "Shoutout Sent!",
        description: `Your shoutout has been delivered to ${selectedFan.display_name}`,
      });

      // Reset form
      setSelectedFan(null);
      setSelectedAchievements([]);
      setSelectedReward(null);
      setShoutout('');
      
    } catch (error) {
      console.error('Error sending shoutout:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send shoutout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/creator-dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Shoutout Generator
            </h1>
            <p className="text-muted-foreground">Create personalized shoutouts for your fans</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Step 1: Fan Selection */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Step 1: Select Fan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FanSelector 
                selectedFan={selectedFan}
                onFanSelect={setSelectedFan}
              />
            </CardContent>
          </Card>

          {/* Step 2: Achievement Selection */}
          <div className="space-y-6">
            <AchievementSelector
              selectedFan={selectedFan}
              selectedAchievements={selectedAchievements}
              onAchievementsChange={setSelectedAchievements}
            />

            {/* Generation Controls */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Step 2: Generate Shoutout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="grateful">Grateful</SelectItem>
                      <SelectItem value="motivational">Motivational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional Reward */}
                {availableRewards.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attach Reward (Optional)</label>
                    <Select 
                      value={selectedReward?.id || ''} 
                      onValueChange={(value) => {
                        const reward = availableRewards.find(r => r.id === value);
                        setSelectedReward(reward || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No reward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No reward</SelectItem>
                        {availableRewards.map((reward) => (
                          <SelectItem key={reward.id} value={reward.id}>
                            {reward.title} - {reward.xp_cost ? `${reward.xp_cost} XP` : `$${reward.cash_price}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button 
                  onClick={generateShoutout} 
                  disabled={loading || !selectedFan || selectedAchievements.length === 0}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Generate Shoutout
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Preview & Send */}
          <div className="space-y-6">
            <ShoutoutPreview
              fan={selectedFan}
              shoutoutText={shoutout}
              onShoutoutEdit={setShoutout}
              selectedReward={selectedReward}
              onSend={handleSendShoutout}
              sending={sending}
            />
          </div>
        </div>

        {/* Enhanced Tips */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Pro Tips for Great Shoutouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-primary mb-2">Select Multiple Achievements</h4>
                <p className="text-muted-foreground">Choose 2-3 related achievements for a more comprehensive and meaningful shoutout</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Personalize with Rewards</h4>
                <p className="text-muted-foreground">Attach a small reward to make the shoutout extra special and memorable</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Edit Before Sending</h4>
                <p className="text-muted-foreground">Always review and edit the generated text to add your personal voice</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShoutoutGenerator;