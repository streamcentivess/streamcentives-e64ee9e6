import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mic, Copy, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ShoutoutGenerator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fanName, setFanName] = useState('');
  const [achievement, setAchievement] = useState('');
  const [tone, setTone] = useState('friendly');
  const [shoutout, setShoutout] = useState('');
  const [loading, setLoading] = useState(false);

  const generateShoutout = async () => {
    if (!fanName || !achievement) {
      toast({
        title: "Missing Information",
        description: "Please fill in both fan name and achievement",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `Generate a personalized ${tone} shoutout for a fan named "${fanName}" who achieved: "${achievement}". Make it genuine, engaging, and encouraging. Keep it under 280 characters for social media.`,
          type: 'shoutout'
        }
      });

      if (error) throw error;
      setShoutout(data.content);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shoutout);
    toast({
      title: "Copied!",
      description: "Shoutout copied to clipboard"
    });
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Shoutout Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fanName">Fan Name</Label>
                <Input
                  id="fanName"
                  value={fanName}
                  onChange={(e) => setFanName(e.target.value)}
                  placeholder="Enter fan's name or username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="achievement">Achievement</Label>
                <Textarea
                  id="achievement"
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  placeholder="What did they achieve? (e.g., completed a campaign, reached milestone, etc.)"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tone</Label>
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
              
              <Button 
                onClick={generateShoutout} 
                disabled={loading}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Generate Shoutout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Shoutout */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Generated Shoutout</CardTitle>
            </CardHeader>
            <CardContent>
              {shoutout ? (
                <div className="space-y-4">
                  <div className="p-4 bg-surface rounded-lg">
                    <p className="text-sm leading-relaxed">{shoutout}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button onClick={generateShoutout} disabled={loading} variant="outline">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Your generated shoutout will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Pro Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-primary mb-2">Be Specific</h4>
                <p className="text-muted-foreground">Mention specific achievements or milestones for more personalized shoutouts</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Choose the Right Tone</h4>
                <p className="text-muted-foreground">Match the tone to your brand and the fan's achievement</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Add Your Own Touch</h4>
                <p className="text-muted-foreground">Feel free to edit the generated shoutout to make it even more personal</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Share Across Platforms</h4>
                <p className="text-muted-foreground">Use these shoutouts on social media, in campaigns, or direct messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShoutoutGenerator;