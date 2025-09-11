import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Image, 
  FileText, 
  Video, 
  Download, 
  Upload, 
  Wand2, 
  Camera, 
  Edit3, 
  Share2,
  Zap,
  Target,
  TrendingUp,
  Users,
  Brain,
  Palette,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PhotoEditor } from './PhotoEditor';
import { CarouselUpload } from './CarouselUpload';

interface ContentAssistantProps {
  profile?: any;
  onClose?: () => void;
}

interface GeneratedContent {
  id: string;
  type: 'image' | 'text' | 'video_idea' | 'video_script' | 'document' | 'audio_script' | 'carousel';
  title: string;
  content: string;
  imageUrl?: string;
  downloadUrl?: string;
  fileUrl?: string;
  fileFormat?: string;
  actualFile?: boolean;
  carouselSlides?: Array<{
    id: string;
    title: string;
    content: string;
    imagePrompt: string;
  }>;
  metadata?: any;
  created_at: string;
}

export const ContentAssistant: React.FC<ContentAssistantProps> = ({ profile, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [contentPrompt, setContentPrompt] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentGoal, setContentGoal] = useState('');
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showCarouselUpload, setShowCarouselUpload] = useState(false);
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [previewContent, setPreviewContent] = useState<GeneratedContent[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    checkProSubscription();
    loadGeneratedContent();
  }, [user]);

  const checkProSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_tool_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_name', 'creator_pro')
        .eq('status', 'active')
        .maybeSingle();

      setIsProSubscriber(!!data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadGeneratedContent = async () => {
    if (!user) return;
    
    try {
      // For now, load from localStorage until types are updated
      const stored = localStorage.getItem(`ai_content_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGeneratedContent(parsed || []);
      }
    } catch (error) {
      console.error('Error loading generated content:', error);
    }
  };

  const handleReferenceImageUpload = (files: FileList) => {
    const newImages = Array.from(files).slice(0, 5 - referenceImages.length);
    setReferenceImages(prev => [...prev, ...newImages]);
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateContent = async () => {
    if (!user || !contentPrompt.trim()) {
      toast.error('Please enter a content prompt');
      return;
    }

    setGenerating(true);
    setPreviewContent([]);
    setGenerationProgress(0);
    
    try {
      // Upload reference images if any
      const referenceUrls: string[] = [];
      for (const image of referenceImages) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/references/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, image);

        if (!uploadError) {
          const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
          referenceUrls.push(data.publicUrl);
        }
      }

      // Set progress to 25% after image upload
      setGenerationProgress(25);

      // Call AI generation service
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: contentPrompt,
          targetAudience: targetAudience,
          contentGoal: contentGoal,
          profileData: {
            username: profile?.username,
            bio: profile?.bio,
            location: profile?.location,
            interests: profile?.interests
          },
          referenceImages: referenceUrls,
          generationType: 'mixed' // images, text, video ideas
        }
      });

      if (error) throw error;

      // Set progress to 75% after API call
      setGenerationProgress(75);

      // Save generated content temporarily to localStorage
      const contentToSave = data.generatedContent.map((item: any) => ({
        ...item,
        user_id: user.id,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }));

      // Show preview content as it generates
      setPreviewContent(contentToSave);

      // Save to localStorage for now
      const existing = localStorage.getItem(`ai_content_${user.id}`);
      const existingContent = existing ? JSON.parse(existing) : [];
      const updatedContent = [...contentToSave, ...existingContent];
      localStorage.setItem(`ai_content_${user.id}`, JSON.stringify(updatedContent));

      setGeneratedContent(prev => [...contentToSave, ...prev]);
      setGenerationProgress(100);
      toast.success(`Generated ${contentToSave.length} pieces of content!`);
      
      // Clear form after a delay to show completed preview
      setTimeout(() => {
        setContentPrompt('');
        setTargetAudience('');
        setContentGoal('');
        setReferenceImages([]);
        setGenerationProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadContent = async (content: GeneratedContent) => {
    try {
      if (content.downloadUrl || content.fileUrl) {
        // Download actual file
        const fileUrl = content.downloadUrl || content.fileUrl || '';
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Determine file extension from fileFormat or type
        let extension = 'txt';
        if (content.fileFormat) {
          extension = content.fileFormat;
        } else if (content.type === 'image') {
          extension = 'jpg';
        } else if (content.type === 'video_script') {
          extension = 'txt';
        } else if (content.type === 'document') {
          extension = 'txt';
        }
        
        a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (content.imageUrl) {
        // Download image
        const response = await fetch(content.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Download text content
        const blob = new Blob([content.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast.success('Content downloaded successfully!');
    } catch (error) {
      console.error('Error downloading content:', error);
      toast.error('Failed to download content');
    }
  };

  const postToProfile = async (content: GeneratedContent, editedImages?: string[]) => {
    if (!user) return;

    try {
      const imagesToPost = editedImages || (content.imageUrl ? [content.imageUrl] : []);
      
      // Create post with carousel if multiple images
      const postData = {
        user_id: user.id,
        content_type: imagesToPost.length > 0 ? 'image' : 'text',
        content_url: imagesToPost[0] || '',
        caption: content.content,
        is_community_post: false,
        is_cross_posted: isProSubscriber, // Auto cross-post for Pro users
        carousel_urls: imagesToPost.length > 1 ? imagesToPost : null
      };

      const { error } = await supabase
        .from('posts')
        .insert([postData]);

      if (error) throw error;

      // If Pro subscriber, apply algorithm boost
      if (isProSubscriber) {
        await supabase.functions.invoke('boost-content', {
          body: {
            contentType: 'post',
            contentId: content.id,
            userId: user.id
          }
        });
      }

      toast.success('Posted to your profile!');
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error posting content:', error);
      toast.error('Failed to post content');
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!user) return;
    
    try {
      // Remove from state
      setGeneratedContent(prev => prev.filter(content => content.id !== contentId));
      setPreviewContent(prev => prev.filter(content => content.id !== contentId));
      
      // Remove from localStorage
      const existing = localStorage.getItem(`ai_content_${user.id}`);
      if (existing) {
        const existingContent = JSON.parse(existing);
        const updatedContent = existingContent.filter((content: any) => content.id !== contentId);
        localStorage.setItem(`ai_content_${user.id}`, JSON.stringify(updatedContent));
      }
      
      toast.success('Content deleted successfully!');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Content Assistant {isProSubscriber && <Badge variant="secondary">PRO</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generation Form */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content Generation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div>
                       <label className="text-sm font-medium">Content Prompt</label>
                       <Textarea
                         placeholder="Describe what type of content you want to create (e.g., 'Create an image of a sunset', 'Generate a video script about cooking', 'Make a document explaining social media tips')..."
                         value={contentPrompt}
                         onChange={(e) => setContentPrompt(e.target.value)}
                         className="min-h-[100px]"
                       />
                       <p className="text-xs text-muted-foreground mt-1">
                         Specify the file format you want: images, videos, documents, carousels, etc.
                       </p>
                     </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Target Audience</label>
                        <Input
                          placeholder="e.g., Gen Z music fans"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Content Goal</label>
                        <Input
                          placeholder="e.g., increase engagement"
                          value={contentGoal}
                          onChange={(e) => setContentGoal(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Reference Images Upload */}
                    <div>
                      <label className="text-sm font-medium">Reference Images (Optional)</label>
                      <div className="mt-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => e.target.files && handleReferenceImageUpload(e.target.files)}
                          className="hidden"
                          id="reference-upload"
                          disabled={referenceImages.length >= 5}
                        />
                        <label 
                          htmlFor="reference-upload"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                            referenceImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'border-muted-foreground/25 hover:border-primary'
                          }`}
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            Upload reference images<br />
                            <span className="text-xs">(Max 5 images)</span>
                          </p>
                        </label>
                      </div>

                      {referenceImages.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-3">
                          {referenceImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Reference ${index + 1}`}
                                className="w-full h-16 object-cover rounded"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeReferenceImage(index)}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={generateContent} 
                      disabled={generating || !contentPrompt.trim()}
                      className="w-full"
                    >
                      {generating ? (
                        <>
                          <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Real-time Preview */}
                {(generating || previewContent.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Live Preview
                        {generating && (
                          <Badge variant="outline" className="ml-auto">
                            Generating...
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {generating && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Generation Progress</span>
                            <span>{generationProgress}%</span>
                          </div>
                          <Progress value={generationProgress} className="h-2" />
                        </div>
                      )}
                      
                         <div className="space-y-3 max-h-60 overflow-y-auto">
                        {previewContent.map((content) => (
                          <div key={content.id} className="p-3 border rounded-lg">
                            {content.imageUrl && (
                              <img
                                src={content.imageUrl}
                                alt={content.title}
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                            )}
                            <h4 className="font-medium text-sm mb-1">{content.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {content.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {content.type}
                              </Badge>
                              {content.fileFormat && (
                                <Badge variant="secondary" className="text-xs">
                                  {content.fileFormat.toUpperCase()}
                                </Badge>
                              )}
                              {(content.downloadUrl || content.fileUrl) && (
                                <Badge variant="default" className="text-xs">
                                  File Ready
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {previewContent.length > 0 && !generating && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => setActiveTab('library')}
                            className="flex-1"
                          >
                            View in Library
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewContent([])}
                          >
                            Clear Preview
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* AI Insights */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Profile Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p><strong>Profile:</strong> @{profile?.username}</p>
                      {profile?.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
                      {profile?.location && <p><strong>Location:</strong> {profile.location}</p>}
                      {profile?.interests && <p><strong>Interests:</strong> {profile.interests}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Suggested Content Types:</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Behind the scenes</Badge>
                        <Badge variant="outline">Tutorial posts</Badge>
                        <Badge variant="outline">Fan interactions</Badge>
                        <Badge variant="outline">Lifestyle content</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Trending Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">#MusicMonday</Badge>
                        <Badge variant="secondary">#CreatorLife</Badge>
                        <Badge variant="secondary">#BehindTheScenes</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isProSubscriber && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Creator Pro Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Algorithm boost for generated content</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>Auto cross-post to community feed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Brain className="h-4 w-4 text-primary" />
                        <span>Advanced AI generation models</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {generating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Wand2 className="h-4 w-4 animate-spin" />
                  <span>Generating your content...</span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="overflow-auto">
            <div className="space-y-4">
              {generatedContent.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No generated content yet. Create some content first!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedContent.map((content) => (
                    <Card key={content.id} className="cursor-pointer hover:shadow-md transition-shadow">
                       <CardContent className="p-4">
                         {content.imageUrl && (
                           <img
                             src={content.imageUrl}
                             alt={content.title}
                             className="w-full h-32 object-cover rounded mb-3"
                           />
                         )}
                         <div className="flex items-center gap-2 mb-2">
                           <Badge variant="outline">
                             {content.type}
                           </Badge>
                           {content.fileFormat && (
                             <Badge variant="secondary" className="text-xs">
                               {content.fileFormat.toUpperCase()}
                             </Badge>
                           )}
                           {(content.downloadUrl || content.fileUrl) && (
                             <Badge variant="default" className="text-xs">
                               ✓ File
                             </Badge>
                           )}
                         </div>
                         <h3 className="font-semibold text-sm mb-2">{content.title}</h3>
                         <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                           {content.content}
                         </p>
                         <div className="flex items-center gap-2 flex-wrap">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => downloadContent(content)}
                           >
                             <Download className="h-3 w-3 mr-1" />
                             Download
                           </Button>
                           {content.imageUrl && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => {
                                 setSelectedContent(content);
                                 setShowPhotoEditor(true);
                               }}
                             >
                               <Edit3 className="h-3 w-3 mr-1" />
                               Edit
                             </Button>
                           )}
                           <Button
                             size="sm"
                             onClick={() => postToProfile(content)}
                           >
                             <Share2 className="h-3 w-3 mr-1" />
                             Post
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             onClick={() => deleteContent(content.id)}
                           >
                             <Trash2 className="h-3 w-3 mr-1" />
                             Delete
                           </Button>
                         </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="editor" className="overflow-auto">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Photo & Video Editor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => setShowPhotoEditor(true)}
                      className="h-32 flex-col gap-2"
                      variant="outline"
                    >
                      <Camera className="h-8 w-8" />
                      <span>Edit Photos</span>
                      <span className="text-xs text-muted-foreground">
                        Filters, lighting, effects
                      </span>
                    </Button>
                    
                    <Button
                      onClick={() => setShowCarouselUpload(true)}
                      className="h-32 flex-col gap-2"
                      variant="outline"
                    >
                      <Upload className="h-8 w-8" />
                      <span>Carousel Upload</span>
                      <span className="text-xs text-muted-foreground">
                        Multiple photos & videos
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Photo Editor Modal */}
        {showPhotoEditor && (
          <PhotoEditor
            initialImage={selectedContent?.imageUrl}
            onSave={(editedImages) => {
              if (selectedContent) {
                postToProfile(selectedContent, editedImages);
              }
              setShowPhotoEditor(false);
              setSelectedContent(null);
            }}
            onClose={() => {
              setShowPhotoEditor(false);
              setSelectedContent(null);
            }}
          />
        )}

        {/* Carousel Upload Modal */}
        {showCarouselUpload && (
          <CarouselUpload
            onUploadComplete={() => {
              setShowCarouselUpload(false);
              if (onClose) onClose();
            }}
            onClose={() => setShowCarouselUpload(false)}
            applyProBoost={isProSubscriber}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};