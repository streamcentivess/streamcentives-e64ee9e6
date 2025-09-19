import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledContent {
  id: string;
  title: string;
  content: string;
  content_type: string;
  platforms: string[];
  media_urls?: string[];
  hashtags?: string[];
  scheduled_time: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const ContentScheduler = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<ScheduledContent | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: '',
    platforms: [] as string[],
    hashtags: '',
    scheduled_date: '',
    scheduled_time: '',
    status: 'draft' as 'draft' | 'scheduled' | 'posted' | 'failed'
  });

  useEffect(() => {
    fetchScheduledContent();
  }, []);

  const fetchScheduledContent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('content-scheduler', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setScheduledContent(data || []);
    } catch (error) {
      console.error('Error fetching scheduled content:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.content_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString();
      
      const action = editingContent ? 'update' : 'create';
      const payload = {
        action,
        ...(editingContent && { id: editingContent.id }),
        title: formData.title,
        content: formData.content,
        content_type: formData.content_type,
        platforms: formData.platforms,
        hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(Boolean),
        scheduled_time: scheduledDateTime,
        status: formData.status
      };

      const { data, error } = await supabase.functions.invoke('content-scheduler', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Content ${editingContent ? 'updated' : 'scheduled'} successfully`
      });

      setShowDialog(false);
      resetForm();
      fetchScheduledContent();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (contentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('content-scheduler', {
        body: { action: 'delete', id: contentId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully"
      });

      fetchScheduledContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      content_type: '',
      platforms: [],
      hashtags: '',
      scheduled_date: '',
      scheduled_time: '',
      status: 'draft'
    });
    setEditingContent(null);
  };

  const openEditDialog = (content: ScheduledContent) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      content: content.content,
      content_type: content.content_type,
      platforms: content.platforms,
      hashtags: (content.hashtags || []).join(', '),
      scheduled_date: new Date(content.scheduled_time).toISOString().split('T')[0],
      scheduled_time: new Date(content.scheduled_time).toTimeString().slice(0, 5),
      status: content.status
    });
    setShowDialog(true);
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
    } else {
      setFormData(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Content Schedule</h3>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingContent ? 'Edit' : 'Schedule'} Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="content-title">Content Title *</Label>
                <Input 
                  id="content-title" 
                  placeholder="Enter content title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="content-type">Content Type *</Label>
                <Select value={formData.content_type} onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Social Media Post</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="reel">Reel/Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Platforms *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Instagram', 'Twitter', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn'].map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox 
                        id={platform}
                        checked={formData.platforms.includes(platform)}
                        onCheckedChange={(checked) => handlePlatformChange(platform, checked as boolean)}
                      />
                      <Label htmlFor={platform} className="text-sm">{platform}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="content-text">Content *</Label>
                <Textarea 
                  id="content-text" 
                  placeholder="Write your content..." 
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                <Input 
                  id="hashtags" 
                  placeholder="#hashtag1, #hashtag2, #hashtag3"
                  value={formData.hashtags}
                  onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule-date">Schedule Date *</Label>
                  <Input 
                    id="schedule-date" 
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-time">Time *</Label>
                  <Input 
                    id="schedule-time" 
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                >
                  Save Draft
                </Button>
                <Button 
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  onClick={handleSubmit}
                >
                  {editingContent ? 'Update' : 'Schedule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {scheduledContent.map((content) => (
          <Card key={content.id} className="card-modern">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {content.title}
                </CardTitle>
                <Badge variant={content.status === 'scheduled' ? 'default' : 'outline'}>
                  {content.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{content.content}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Platforms: {content.platforms.join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {new Date(content.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(content)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(content.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {scheduledContent.length === 0 && (
          <Card className="card-modern">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No scheduled content yet. Create your first scheduled post!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};