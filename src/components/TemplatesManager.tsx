import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: any;
  is_public: boolean;
  usage_count: number;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

interface TemplatesManagerProps {
  onUseTemplate?: (template: ContentTemplate) => void;
}

export const TemplatesManager = ({ onUseTemplate }: TemplatesManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    content: '',
    is_public: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('templates-manager', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.type || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const action = editingTemplate ? 'update' : 'create';
      const payload = {
        action,
        ...(editingTemplate && { id: editingTemplate.id }),
        ...formData
      };

      const { data, error } = await supabase.functions.invoke('templates-manager', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`
      });

      setShowDialog(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleUseTemplate = async (template: ContentTemplate) => {
    try {
      const { error } = await supabase.functions.invoke('templates-manager', {
        body: { action: 'use', template_id: template.id }
      });

      if (error) throw error;

      if (onUseTemplate) {
        onUseTemplate(template);
      }

      toast({
        title: "Success",
        description: "Template applied successfully"
      });

      fetchTemplates(); // Refresh to show updated usage count
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: "Error",
        description: "Failed to use template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase.functions.invoke('templates-manager', {
        body: { action: 'delete', id: templateId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully"
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      content: '',
      is_public: false
    });
    setEditingTemplate(null);
  };

  const openEditDialog = (template: ContentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      is_public: template.is_public
    });
    setShowDialog(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Content Templates</h3>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name *</Label>
                <Input 
                  id="template-name" 
                  placeholder="Enter template name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="template-type">Template Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_post">Social Media Post</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template-content">Template Content *</Label>
                <Textarea 
                  id="template-content" 
                  placeholder="Create your reusable template..."
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="public-template"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked as boolean }))}
                />
                <Label htmlFor="public-template">Make template public</Label>
              </div>
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={handleSubmit}
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="card-modern">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Used {template.usage_count} times</span>
                      <span>•</span>
                      <span className="capitalize">{template.type.replace('_', ' ')}</span>
                      {template.is_public && <Badge variant="secondary" className="text-xs">Public</Badge>}
                      {template.creator_id !== user?.id && <Badge variant="outline" className="text-xs">Shared</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                  {template.creator_id === user?.id && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <Card className="card-modern">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No templates yet. Create your first reusable template!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};