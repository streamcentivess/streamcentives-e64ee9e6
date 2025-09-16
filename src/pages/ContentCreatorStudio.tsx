import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Upload, Palette, Clock, Plus, FileText, Image, Video } from 'lucide-react';

const ContentCreatorStudio = () => {
  const { user } = useAuth();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);

  // Mock data
  const scheduledContent = [
    { id: 1, title: 'New Music Monday', platforms: ['Instagram', 'Twitter'], scheduledTime: '2024-03-18 09:00', status: 'scheduled' },
    { id: 2, title: 'Behind the Scenes Video', platforms: ['YouTube', 'TikTok'], scheduledTime: '2024-03-19 15:30', status: 'scheduled' },
    { id: 3, title: 'Fan Appreciation Post', platforms: ['Facebook', 'Instagram'], scheduledTime: '2024-03-20 12:00', status: 'draft' }
  ];

  const contentTemplates = [
    { id: 1, name: 'New Release Announcement', type: 'social_post', usageCount: 23, isPublic: false },
    { id: 2, name: 'Tour Date Reveal', type: 'story', usageCount: 15, isPublic: true },
    { id: 3, name: 'Fan Thank You', type: 'email', usageCount: 8, isPublic: false }
  ];

  const brandAssets = [
    { id: 1, name: 'Main Logo', type: 'logo', size: '2.3 MB', isPrimary: true },
    { id: 2, name: 'Album Cover', type: 'banner', size: '5.1 MB', isPrimary: false },
    { id: 3, name: 'Brand Colors', type: 'color_palette', size: '0.2 MB', isPrimary: true },
    { id: 4, name: 'Custom Font', type: 'font', size: '1.8 MB', isPrimary: false }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Content Creator Studio
            </h1>
            <p className="text-muted-foreground">Streamline your content creation workflow</p>
          </div>
        </div>

        <Tabs defaultValue="scheduler" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scheduler">Content Scheduler</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="assets">Brand Assets</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduler" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Content Schedule</h3>
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Schedule New Content</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="content-title">Content Title</Label>
                      <Input id="content-title" placeholder="Enter content title" />
                    </div>
                    <div>
                      <Label htmlFor="content-type">Content Type</Label>
                      <Select>
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
                      <Label htmlFor="platforms">Platforms</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['Instagram', 'Twitter', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn'].map((platform) => (
                          <label key={platform} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">{platform}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="content-text">Content</Label>
                      <Textarea id="content-text" placeholder="Write your content..." rows={4} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="schedule-date">Schedule Date</Label>
                        <Input id="schedule-date" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="schedule-time">Time</Label>
                        <Input id="schedule-time" type="time" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">Save Draft</Button>
                      <Button className="flex-1 bg-gradient-primary hover:opacity-90">Schedule</Button>
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
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Platforms: {content.platforms.join(', ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {new Date(content.scheduledTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Preview</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Content Templates</h3>
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Content Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input id="template-name" placeholder="Enter template name" />
                    </div>
                    <div>
                      <Label htmlFor="template-type">Template Type</Label>
                      <Select>
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
                      <Label htmlFor="template-content">Template Content</Label>
                      <Textarea id="template-content" placeholder="Create your reusable template..." rows={6} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="public-template" className="rounded" />
                      <Label htmlFor="public-template">Make template public</Label>
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Create Template</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {contentTemplates.map((template) => (
                <Card key={template.id} className="card-modern">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Used {template.usageCount} times</span>
                            {template.isPublic && <Badge variant="secondary" className="text-xs">Public</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Use Template</Button>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Brand Assets</h3>
              <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Asset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Brand Asset</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="asset-name">Asset Name</Label>
                      <Input id="asset-name" placeholder="Enter asset name" />
                    </div>
                    <div>
                      <Label htmlFor="asset-type">Asset Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logo">Logo</SelectItem>
                          <SelectItem value="banner">Banner</SelectItem>
                          <SelectItem value="font">Font</SelectItem>
                          <SelectItem value="color_palette">Color Palette</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="asset-file">Upload File</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="primary-asset" className="rounded" />
                      <Label htmlFor="primary-asset">Set as primary asset</Label>
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Upload Asset</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandAssets.map((asset) => (
                <Card key={asset.id} className="card-modern">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                          {asset.type === 'logo' ? <Image className="h-6 w-6 text-white" /> :
                           asset.type === 'banner' ? <Image className="h-6 w-6 text-white" /> :
                           asset.type === 'font' ? <FileText className="h-6 w-6 text-white" /> :
                           <Palette className="h-6 w-6 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{asset.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{asset.size}</p>
                            {asset.isPrimary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">Download</Button>
                        <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Bulk Upload</h3>
            </div>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Multiple Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="text-lg font-medium mb-2">Drop files here or click to browse</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload multiple images, videos, or documents at once
                    </p>
                    <Button className="bg-gradient-primary hover:opacity-90">
                      Select Files
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bulk-tags">Tags (comma-separated)</Label>
                      <Input id="bulk-tags" placeholder="tag1, tag2, tag3" />
                    </div>
                    <div>
                      <Label htmlFor="bulk-category">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social">Social Media</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="branding">Branding</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-primary hover:opacity-90" disabled>
                    Upload Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentCreatorStudio;