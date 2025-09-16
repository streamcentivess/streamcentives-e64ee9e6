import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Copy, MessageSquare, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MessageTemplate {
  id: string;
  template_name: string;
  template_content: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface MessageTemplateManagerProps {
  onSelectTemplate?: (template: MessageTemplate) => void;
  mode?: 'manage' | 'select';
}

const MessageTemplateManager: React.FC<MessageTemplateManagerProps> = ({
  onSelectTemplate,
  mode = 'manage'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    template_name: '',
    template_content: ''
  });

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('creator_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load message templates.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !formData.template_name.trim() || !formData.template_content.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide both template name and content.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          creator_id: user.id,
          template_name: formData.template_name.trim(),
          template_content: formData.template_content.trim()
        });

      if (error) throw error;

      toast({
        title: "Template created",
        description: "Your message template has been saved."
      });

      setFormData({ template_name: '', template_content: '' });
      setShowCreateDialog(false);
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.template_name.trim() || !formData.template_content.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide both template name and content.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('message_templates')
        .update({
          template_name: formData.template_name.trim(),
          template_content: formData.template_content.trim()
        })
        .eq('id', editingTemplate.id)
        .eq('creator_id', user?.id);

      if (error) throw error;

      toast({
        title: "Template updated",
        description: "Your message template has been updated."
      });

      setEditingTemplate(null);
      setFormData({ template_name: '', template_content: '' });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId)
        .eq('creator_id', user?.id);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: "The message template has been removed."
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (template: MessageTemplate) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id)
        .eq('creator_id', user?.id);

      if (error) throw error;

      toast({
        title: template.is_active ? "Template deactivated" : "Template activated",
        description: `Template is now ${!template.is_active ? 'active' : 'inactive'}.`
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCopyTemplate = async (template: MessageTemplate) => {
    try {
      await navigator.clipboard.writeText(template.template_content);
      toast({
        title: "Copied to clipboard",
        description: "Template content has been copied."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleUseTemplate = async (template: MessageTemplate) => {
    // Increment usage count
    try {
      await supabase
        .from('message_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id);
    } catch (error) {
      console.error('Error updating usage count:', error);
    }

    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const startEditing = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_content: template.template_content
    });
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({ template_name: '', template_content: '' });
    setShowCreateDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode === 'manage' && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Message Templates</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Message Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={formData.template_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                    placeholder="e.g., Welcome Message, Thank You Note"
                  />
                </div>
                <div>
                  <Label htmlFor="template-content">Template Content</Label>
                  <Textarea
                    id="template-content"
                    value={formData.template_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                    placeholder="Write your message template here..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateTemplate} disabled={!formData.template_name.trim() || !formData.template_content.trim()}>
                    Create Template
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No message templates</h3>
            <p className="text-muted-foreground mb-4">
              Create reusable message templates to save time when responding to your fans.
            </p>
            {mode === 'manage' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Used {template.usage_count} times
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {mode === 'select' && (
                        <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                          Use Template
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleCopyTemplate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Content
                      </DropdownMenuItem>
                      {mode === 'manage' && (
                        <>
                          <DropdownMenuItem onClick={() => startEditing(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                            {template.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{template.template_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">
                    {template.template_content}
                  </p>
                </div>
                {mode === 'select' && (
                  <div className="mt-3 flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleUseTemplate(template)}
                      disabled={!template.is_active}
                    >
                      Use This Template
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopyTemplate(template)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={formData.template_name}
                onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-template-content">Template Content</Label>
              <Textarea
                id="edit-template-content"
                value={formData.template_content}
                onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateTemplate}>
                Update Template
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageTemplateManager;