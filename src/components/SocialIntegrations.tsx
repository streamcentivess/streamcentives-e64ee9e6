import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Instagram, Music, Twitter, Youtube, Link2, Plus, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { toast } from 'sonner';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ElementType;
  connected: boolean;
  username?: string;
  followers?: number;
}

const SocialIntegrations = () => {
  const { user } = useAuth();
  const { hapticImpact } = useMobileCapabilities();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { id: 'instagram', name: 'Instagram', icon: Instagram, connected: false },
    { id: 'tiktok', name: 'TikTok', icon: Music, connected: false },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, connected: false },
    { id: 'youtube', name: 'YouTube', icon: Youtube, connected: false },
    { id: 'spotify', name: 'Spotify', icon: Music, connected: true, username: '@artist', followers: 12500 }
  ]);

  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleConnect = async (platformId: string) => {
    await hapticImpact();
    
    // Simulate OAuth flow
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, connected: true, username: '@username', followers: Math.floor(Math.random() * 50000) }
        : p
    ));
    
    toast.success(`Connected to ${platforms.find(p => p.id === platformId)?.name}`);
  };

  const handleDisconnect = async (platformId: string) => {
    await hapticImpact();
    
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, connected: false, username: undefined, followers: undefined }
        : p
    ));
    
    toast.success(`Disconnected from ${platforms.find(p => p.id === platformId)?.name}`);
  };

  const handleWebhookSave = async () => {
    await hapticImpact();
    toast.success('Webhook URL saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Social Media Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      {platform.connected && platform.username && (
                        <p className="text-sm text-muted-foreground">
                          {platform.username} • {platform.followers?.toLocaleString()} followers
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {platform.connected ? (
                      <>
                        <Badge variant="secondary" className="text-green-600">
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(platform.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        className="bg-gradient-primary text-white"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Posting Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Posting Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-post">Enable Auto-Posting</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically post content to connected platforms
                </p>
              </div>
              <Switch
                id="auto-post"
                checked={autoPostEnabled}
                onCheckedChange={setAutoPostEnabled}
              />
            </div>
            
            {autoPostEnabled && (
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {platforms.filter(p => p.connected).map(platform => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Switch id={`auto-${platform.id}`} defaultChecked />
                      <Label htmlFor={`auto-${platform.id}`}>{platform.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Webhook Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Get notified when fans interact with your campaigns
              </p>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  placeholder="https://your-webhook-url.com/notify"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <Button onClick={handleWebhookSave} variant="outline">
                  Save
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Available Events:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Campaign participation</li>
                <li>• New messages received</li>
                <li>• XP rewards earned</li>
                <li>• Marketplace purchases</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialIntegrations;