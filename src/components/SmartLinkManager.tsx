import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Link2, 
  Plus, 
  ExternalLink, 
  Copy, 
  BarChart3, 
  Settings, 
  Trash2,
  Eye,
  EyeOff,
  Coins,
  TrendingUp,
  Users,
  Music,
  Youtube,
  Instagram,
  Twitter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SmartLink {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_active: boolean;
  total_clicks: number;
  total_xp_awarded: number;
  created_at: string;
  actions_count: number;
}

interface Action {
  id: string;
  action_type: string;
  action_label: string;
  action_url: string;
  xp_reward: number;
  bonus_multiplier: number;
  is_active: boolean;
  order_index: number;
}

export const SmartLinkManager: React.FC = () => {
  const { user } = useAuth();
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SmartLink | null>(null);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [currentActions, setCurrentActions] = useState<Action[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (user) {
      loadSmartLinks();
    }
  }, [user]);

  const loadSmartLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_links')
        .select(`
          *,
          actions_count:smart_link_actions(count)
        `)
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include actions count
      const transformedData = data.map(link => ({
        ...link,
        actions_count: link.actions_count?.[0]?.count || 0
      }));

      setSmartLinks(transformedData);
    } catch (error) {
      console.error('Error loading smart links:', error);
      toast.error('Failed to load smart links');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  const handleCreateLink = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const finalSlug = slug || generateSlug(title);

    try {
      // Check if slug already exists
      const { data: existingLink } = await supabase
        .from('smart_links')
        .select('id')
        .eq('slug', finalSlug)
        .single();

      if (existingLink) {
        toast.error('This URL slug is already taken. Please choose a different one.');
        return;
      }

      const { data, error } = await supabase
        .from('smart_links')
        .insert([{
          creator_id: user!.id,
          title: title.trim(),
          description: description.trim(),
          slug: finalSlug,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Create default actions
      const defaultActions = [
        {
          smart_link_id: data.id,
          action_type: 'spotify_follow',
          action_label: '🎵 Follow on Spotify',
          action_url: 'https://open.spotify.com/artist/your-artist-id',
          xp_reward: 25,
          bonus_multiplier: 1.0,
          order_index: 1
        },
        {
          smart_link_id: data.id,
          action_type: 'youtube_subscribe',
          action_label: '📺 Subscribe on YouTube',
          action_url: 'https://youtube.com/@your-channel',
          xp_reward: 20,
          bonus_multiplier: 1.0,
          order_index: 2
        },
        {
          smart_link_id: data.id,
          action_type: 'instagram_follow',
          action_label: '📸 Follow on Instagram',
          action_url: 'https://instagram.com/your-handle',
          xp_reward: 15,
          bonus_multiplier: 1.0,
          order_index: 3
        }
      ];

      await supabase.from('smart_link_actions').insert(defaultActions);

      toast.success('Smart link created with default actions!');
      setCreateDialogOpen(false);
      resetForm();
      loadSmartLinks();
    } catch (error) {
      console.error('Error creating smart link:', error);
      toast.error('Failed to create smart link');
    }
  };

  const handleToggleActive = async (linkId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('smart_links')
        .update({ is_active: !currentActive })
        .eq('id', linkId);

      if (error) throw error;

      toast.success(currentActive ? 'Smart link deactivated' : 'Smart link activated');
      loadSmartLinks();
    } catch (error) {
      console.error('Error updating smart link:', error);
      toast.error('Failed to update smart link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this smart link? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('smart_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast.success('Smart link deleted');
      loadSmartLinks();
    } catch (error) {
      console.error('Error deleting smart link:', error);
      toast.error('Failed to delete smart link');
    }
  };

  const copyLinkToClipboard = async (slug: string) => {
    const fullUrl = `${window.location.origin}/link/${slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const loadActions = async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('smart_link_actions')
        .select('*')
        .eq('smart_link_id', linkId)
        .order('order_index');

      if (error) throw error;

      setCurrentActions(data || []);
      setSelectedLinkId(linkId);
      setActionsDialogOpen(true);
    } catch (error) {
      console.error('Error loading actions:', error);
      toast.error('Failed to load actions');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSlug('');
    setEditingLink(null);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'spotify_follow':
      case 'spotify_save':
        return <Music className="h-4 w-4" />;
      case 'youtube_subscribe':
      case 'youtube_watch':
        return <Youtube className="h-4 w-4" />;
      case 'instagram_follow':
        return <Instagram className="h-4 w-4" />;
      case 'twitter_follow':
        return <Twitter className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading smart links...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔗 Smart Link Manager</h2>
          <p className="text-muted-foreground">
            Create bio links that convert social media followers into engaged fans
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Smart Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Smart Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <Input
                  placeholder="e.g., Check out my music!"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Brief description of what fans will find..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {window.location.origin}/link/
                  </span>
                  <Input
                    placeholder="my-music-link"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLink} className="bg-gradient-primary">
                  Create Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Smart Links Grid */}
      {smartLinks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Smart Links Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first smart link to start converting social media followers into engaged fans
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Smart Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {smartLinks.map((link) => (
            <Card key={link.id} className="hover:shadow-glow transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Link2 className="h-5 w-5 text-primary" />
                      {link.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      /link/{link.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={link.is_active ? "default" : "secondary"}>
                      {link.is_active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                      {link.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {link.description && (
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted rounded">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Users className="h-3 w-3" />
                      {link.total_clicks}
                    </div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Coins className="h-3 w-3" />
                      {link.total_xp_awarded}
                    </div>
                    <div className="text-xs text-muted-foreground">XP Awarded</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Settings className="h-3 w-3" />
                      {link.actions_count}
                    </div>
                    <div className="text-xs text-muted-foreground">Actions</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLinkToClipboard(link.slug)}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadActions(link.id)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(link.id, link.is_active)}
                  >
                    {link.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Actions Management Dialog */}
      <Dialog open={actionsDialogOpen} onOpenChange={setActionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Configure what actions fans can take to earn XP rewards
            </div>
            
            {currentActions.map((action) => (
              <Card key={action.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionIcon(action.action_type)}
                    <div>
                      <div className="font-medium">{action.action_label}</div>
                      <div className="text-sm text-muted-foreground">
                        {action.xp_reward} XP • {action.bonus_multiplier}x multiplier
                      </div>
                    </div>
                  </div>
                  <Badge variant={action.is_active ? "default" : "secondary"}>
                    {action.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Card>
            ))}
            
            <div className="text-center text-sm text-muted-foreground">
              Action management interface coming soon. For now, actions are auto-generated.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};