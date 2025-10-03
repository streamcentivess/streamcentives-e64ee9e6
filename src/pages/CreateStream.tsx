import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Radio } from 'lucide-react';

export default function CreateStream() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'twitch'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a stream',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .insert({
          creator_id: user.id,
          title: formData.title,
          description: formData.description || null,
          platform: formData.platform,
          status: 'live',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Stream Created! 🎥',
        description: 'Your live stream is now active'
      });

      navigate(`/live/${data.id}`);
    } catch (error: any) {
      console.error('Error creating stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to create stream',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Go Live</h1>
        </div>
      </div>

      {/* Form */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Start Your Live Stream
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What's your stream about?"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell viewers what to expect..."
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="twitch">Twitch</option>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="custom">Custom</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Select your streaming platform
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={creating || !formData.title}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  {creating ? 'Starting Stream...' : 'Go Live'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Make sure your streaming software is configured before going live
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Streaming Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Ensure stable internet connection (5+ Mbps upload)</li>
              <li>• Test your audio and video before starting</li>
              <li>• Engage with your viewers in the chat</li>
              <li>• Set a clear stream title that describes content</li>
              <li>• Have fun and be yourself!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
