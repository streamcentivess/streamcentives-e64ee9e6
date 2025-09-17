import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Youtube, 
  Copy, 
  Eye, 
  Settings, 
  Coins, 
  Play,
  Heart,
  UserPlus,
  Code,
  Palette,
  Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface YouTubeAction {
  id?: string;
  smart_link_id?: string;
  action_type: 'youtube_subscribe' | 'youtube_watch' | 'youtube_like';
  action_label: string;
  action_url: string;
  xp_reward: number;
  button_style: 'default' | 'youtube' | 'google_official' | 'custom';
  button_color?: string;
  google_layout?: 'default' | 'full';
  google_count?: 'default' | 'hidden';
  channel_id?: string;
  is_active: boolean;
}

interface SmartLink {
  id: string;
  title: string;
  slug: string;
}

export const YouTubeActionConfigurator: React.FC = () => {
  const { user } = useAuth();
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [action, setAction] = useState<YouTubeAction>({
    action_type: 'youtube_subscribe',
    action_label: '📺 Subscribe on YouTube',
    action_url: '',
    xp_reward: 20,
    button_style: 'google_official',
    google_layout: 'default',
    google_count: 'default',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadSmartLinks();
    }
  }, [user]);

  useEffect(() => {
    generateEmbedCode();
  }, [action, selectedLinkId]);

  const loadSmartLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_links')
        .select('id, title, slug')
        .eq('creator_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSmartLinks(data || []);
      
      if (data && data.length > 0) {
        setSelectedLinkId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading smart links:', error);
      toast.error('Failed to load smart links');
    }
  };

  const handleSaveAction = async () => {
    if (!selectedLinkId) {
      toast.error('Please select a smart link');
      return;
    }

    if (!action.action_url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    try {
      const actionData = {
        ...action,
        smart_link_id: selectedLinkId,
        order_index: 99 // Place custom actions at the end
      };

      const { error } = await supabase
        .from('smart_link_actions')
        .upsert(actionData);

      if (error) throw error;

      toast.success('YouTube action saved successfully!');
      generateEmbedCode();
    } catch (error) {
      console.error('Error saving action:', error);
      toast.error('Failed to save YouTube action');
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedCode = () => {
    if (!selectedLinkId) return;

    const selectedLink = smartLinks.find(link => link.id === selectedLinkId);
    if (!selectedLink) return;

    if (action.button_style === 'google_official' && action.action_type === 'youtube_subscribe') {
      const channelId = extractChannelId(action.action_url);
      if (!channelId) {
        setEmbedCode('<!-- Please provide a valid YouTube channel URL to generate Google official button -->');
        return;
      }

      const googleButtonHtml = `<!-- Google Official YouTube Subscribe Button with XP Tracking -->
<script src="https://apis.google.com/js/platform.js"></script>
<div style="display: inline-block; position: relative;">
  <div 
    class="g-ytsubscribe" 
    data-channel="${channelId}" 
    data-layout="${action.google_layout}" 
    data-count="${action.google_count}"
    onclick="trackYouTubeAction('${selectedLink.slug}', ${action.xp_reward})"
  ></div>
  <div style="
    position: absolute;
    top: -8px;
    right: -8px;
    background: #10B981;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
  ">
    +${action.xp_reward} XP
  </div>
</div>

<script>
function trackYouTubeAction(linkSlug, xpReward) {
  // Track the action with StreamCentives
  fetch('${window.location.origin}/link/' + linkSlug, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'youtube_subscribe', xp: xpReward })
  }).catch(err => console.log('XP tracking:', err));
}
</script>`;

      setEmbedCode(googleButtonHtml);
    } else {
      const customButtonHtml = `<!-- StreamCentives Custom YouTube Action Button -->
<button 
  onclick="window.open('${window.location.origin}/link/${selectedLink.slug}', '_blank')"
  style="
    background: ${getButtonBackgroundStyle()};
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
  "
  onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
  onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'"
>
  ${getActionIcon()} ${action.action_label}
  <span style="
    background: rgba(255,255,255,0.2);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    margin-left: 8px;
  ">
    +${action.xp_reward} XP
  </span>
</button>`;

      setEmbedCode(customButtonHtml);
    }
  };

  const extractChannelId = (url: string) => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    const patterns = [
      /youtube\.com\/channel\/([\w-]+)/,
      /youtube\.com\/@([\w-]+)/,
      /youtube\.com\/c\/([\w-]+)/,
      /youtube\.com\/user\/([\w-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return '';
  };

  const getButtonBackgroundStyle = () => {
    switch (action.button_style) {
      case 'youtube':
        return '#FF0000';
      case 'google_official':
        return 'transparent';
      case 'custom':
        return action.button_color || '#3B82F6';
      default:
        return 'linear-gradient(135deg, #3B82F6, #1E40AF)';
    }
  };

  const getActionIcon = () => {
    switch (action.action_type) {
      case 'youtube_subscribe':
        return '👤';
      case 'youtube_watch':
        return '▶️';
      case 'youtube_like':
        return '👍';
      default:
        return '📺';
    }
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success('Embed code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy embed code');
    }
  };

  const validateYouTubeUrl = (url: string) => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/channel\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/@[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'youtube_subscribe':
        return 'Subscribe to Channel';
      case 'youtube_watch':
        return 'Watch Video';
      case 'youtube_like':
        return 'Like Video';
      default:
        return 'YouTube Action';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            YouTube Action Button Configurator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="configure" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="configure" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Embed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="configure" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Configuration */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smart-link">Smart Link</Label>
                    <Select value={selectedLinkId} onValueChange={setSelectedLinkId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a smart link" />
                      </SelectTrigger>
                      <SelectContent>
                        {smartLinks.map((link) => (
                          <SelectItem key={link.id} value={link.id}>
                            {link.title} (/link/{link.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="action-type">Action Type</Label>
                    <Select 
                      value={action.action_type} 
                      onValueChange={(value) => setAction(prev => ({
                        ...prev,
                        action_type: value as YouTubeAction['action_type'],
                        action_label: value === 'youtube_subscribe' ? '📺 Subscribe on YouTube' :
                                     value === 'youtube_watch' ? '▶️ Watch Video' :
                                     '👍 Like Video'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube_subscribe">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Subscribe to Channel
                          </div>
                        </SelectItem>
                        <SelectItem value="youtube_watch">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Watch Video
                          </div>
                        </SelectItem>
                        <SelectItem value="youtube_like">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Like Video
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="button-text">Button Text</Label>
                    <Input
                      id="button-text"
                      value={action.action_label}
                      onChange={(e) => setAction(prev => ({ ...prev, action_label: e.target.value }))}
                      placeholder="e.g., Subscribe for Updates!"
                    />
                  </div>

                  <div>
                    <Label htmlFor="youtube-url">YouTube URL</Label>
                    <Input
                      id="youtube-url"
                      value={action.action_url}
                      onChange={(e) => setAction(prev => ({ ...prev, action_url: e.target.value }))}
                      placeholder="https://youtube.com/@yourchannel"
                      className={action.action_url && !validateYouTubeUrl(action.action_url) ? 'border-red-500' : ''}
                    />
                    {action.action_url && !validateYouTubeUrl(action.action_url) && (
                      <p className="text-sm text-red-500 mt-1">Please enter a valid YouTube URL</p>
                    )}
                  </div>
                </div>

                {/* Styling Configuration */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="xp-reward">XP Reward</Label>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <Input
                        id="xp-reward"
                        type="number"
                        min="1"
                        max="100"
                        value={action.xp_reward}
                        onChange={(e) => setAction(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="button-style">Button Style</Label>
                    <Select 
                      value={action.button_style} 
                      onValueChange={(value) => setAction(prev => ({ ...prev, button_style: value as YouTubeAction['button_style'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_official">Google Official Widget</SelectItem>
                        <SelectItem value="youtube">YouTube Red</SelectItem>
                        <SelectItem value="default">Default Gradient</SelectItem>
                        <SelectItem value="custom">Custom Color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {action.button_style === 'google_official' && action.action_type === 'youtube_subscribe' && (
                    <>
                      <div>
                        <Label htmlFor="google-layout">Google Button Layout</Label>
                        <Select 
                          value={action.google_layout} 
                          onValueChange={(value) => setAction(prev => ({ ...prev, google_layout: value as 'default' | 'full' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default (compact)</SelectItem>
                            <SelectItem value="full">Full (with channel info)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="google-count">Subscriber Count</Label>
                        <Select 
                          value={action.google_count} 
                          onValueChange={(value) => setAction(prev => ({ ...prev, google_count: value as 'default' | 'hidden' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Show Count</SelectItem>
                            <SelectItem value="hidden">Hide Count</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {action.button_style === 'custom' && (
                    <div>
                      <Label htmlFor="button-color">Custom Color</Label>
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <Input
                          id="button-color"
                          type="color"
                          value={action.button_color || '#3B82F6'}
                          onChange={(e) => setAction(prev => ({ ...prev, button_color: e.target.value }))}
                        />
                        <Input
                          value={action.button_color || '#3B82F6'}
                          onChange={(e) => setAction(prev => ({ ...prev, button_color: e.target.value }))}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleSaveAction} 
                    disabled={loading || !action.action_url || !validateYouTubeUrl(action.action_url)}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save YouTube Action'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Button Preview</h3>
                <div className="p-8 bg-muted rounded-lg">
                  {action.button_style === 'google_official' && action.action_type === 'youtube_subscribe' ? (
                    <div className="inline-block relative">
                      <div className="bg-white border border-gray-300 rounded px-3 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        Subscribe {action.google_count === 'default' && '• 1.2M'}
                      </div>
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        +{action.xp_reward} XP
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-transform hover:scale-105"
                      style={{ 
                        background: getButtonBackgroundStyle(),
                        color: 'white'
                      }}
                    >
                      <span>{getActionIcon()}</span>
                      {action.action_label}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        +{action.xp_reward} XP
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Action:</strong> {getActionTypeLabel(action.action_type)}</p>
                  <p><strong>URL:</strong> {action.action_url || 'Not set'}</p>
                  <p><strong>XP Reward:</strong> {action.xp_reward} points</p>
                  <p><strong>Button Style:</strong> {action.button_style === 'google_official' ? 'Google Official Widget' : 'Custom Button'}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Embed Code</h3>
                  <Button onClick={copyEmbedCode} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
                    {embedCode}
                  </pre>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">How to Use:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Copy the embed code above</li>
                    <li>2. Paste it into your website HTML where you want the button to appear</li>
                    <li>3. The button will automatically track clicks and award XP to users</li>
                    <li>4. Users need to be logged in to StreamCentives to receive XP rewards</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};