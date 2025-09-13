import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Trash2,
  ImageIcon,
  LayoutGrid,
  Play,
  Clock,
  Mic,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PhotoEditor } from './PhotoEditor';
import { CarouselUpload } from './CarouselUpload';
import { VideoEditor } from './VideoEditor';

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
  videoUrl?: string;
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
  const [contentType, setContentType] = useState('image');
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showCarouselUpload, setShowCarouselUpload] = useState(false);
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [previewContent, setPreviewContent] = useState<GeneratedContent[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [motionPrompt, setMotionPrompt] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('en-US-female');
  const [isProcessingMotion, setIsProcessingMotion] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
const [motionVideos, setMotionVideos] = useState<any[]>([]);
  const [speechVideos, setSpeechVideos] = useState<any[]>([]);
  const [selectedMotionId, setSelectedMotionId] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [selectedMotionCategory, setSelectedMotionCategory] = useState<string>('camera');
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [apiErrors, setApiErrors] = useState<{[key: string]: string}>({});
  const [availableMotions, setAvailableMotions] = useState<any[]>([]);
  const [loadingMotions, setLoadingMotions] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<any | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  useEffect(() => {
    checkProSubscription();
    loadGeneratedContent();
    loadAvailableMotions();
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
          generationType: contentType
        }
      });

      if (error) throw error;

      // Set progress to 75% after API call
      setGenerationProgress(75);

      // Save generated content temporarily to localStorage (limit to 1 item)
      const firstOnly = (data?.generatedContent || []).slice(0, 1);
      const contentToSave = firstOnly.map((item: any) => {
        const urlForExt = item.downloadUrl || item.fileUrl || item.videoUrl || '';
        const match = typeof urlForExt === 'string' ? urlForExt.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/) : null;
        const derivedExt = match ? match[1].toLowerCase() : (item.type === 'video_script' && item.videoUrl ? 'mov' : item.fileFormat);
        return {
          ...item,
          fileFormat: derivedExt || item.fileFormat,
          user_id: user.id,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        };
      });

      // Show preview content as it generates
      console.log('Generated content received:', firstOnly);
      setPreviewContent(contentToSave);
      
      // Debug: Log content structure
      contentToSave.forEach((content: any) => {
        if (content.type === 'image') {
          console.log('Image content:', {
            id: content.id,
            title: content.title,
            hasImageUrl: !!content.imageUrl,
            hasDownloadUrl: !!content.downloadUrl,
            hasImagePrompt: !!content.imagePrompt,
            actualFile: content.actualFile
          });
        }
      });

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
      if (content.downloadUrl || content.fileUrl || content.videoUrl || content.imageUrl) {
        // Download actual file
        const fileUrl = content.downloadUrl || content.fileUrl || content.videoUrl || content.imageUrl || '';
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Determine file extension (prefer from URL), then fallback
        let extension = 'txt';
        const urlForExt = fileUrl;
        const match = typeof urlForExt === 'string' ? urlForExt.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/) : null;
        if (match) {
          extension = match[1].toLowerCase();
        } else if (content.fileFormat) {
          extension = content.fileFormat.toLowerCase();
        } else if (content.type === 'image') {
          extension = 'jpg';
        } else if (content.type === 'video_script') {
          extension = 'mp4';
        } else if (content.type === 'document') {
          extension = 'txt';
        }
        
        a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
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

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/motion/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
      setUploadedImage(data.publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleMotionEdit = async (imageUrl?: string) => {
    const targetImageUrl = imageUrl || uploadedImage;
    
    if (!targetImageUrl) {
      toast.error('Please upload an image first.');
      return;
    }

    if (!selectedMotionId) {
      toast.error('Please select a motion template.');
      return;
    }

    setIsProcessingMotion(true);
    setApiErrors(prev => ({ ...prev, motion: '' }));

    try {
      console.log('Adding motion to image:', targetImageUrl, 'with motion ID:', selectedMotionId);
      
      const { data, error } = await supabase.functions.invoke('higgsfield-motion', {
        body: {
          imageUrl: targetImageUrl,
          motionId: selectedMotionId,
          prompt: motionPrompt || `Apply ${selectedMotionId} motion effect`,
          type: 'image_to_video'
        }
      });

      if (error) {
        console.error('Error adding motion:', error);
        
        // Check if it's a HiggsField API timeout
        if (error.message?.includes('522') || error.message?.includes('timeout')) {
          setApiErrors(prev => ({ ...prev, motion: 'HiggsField service is temporarily unavailable. Please try again later.' }));
          toast.error('Motion service is temporarily down. Please try again in a few minutes.');
        } else {
          toast.error('Failed to add motion to image. Please try again.');
        }
        return;
      }

      console.log('Motion video generated:', data);
      
      toast.success('Motion added successfully!');

      // Add to motion videos array and switch to library tab
      if (data?.videoUrl) {
        setMotionVideos(prev => [...prev, {
          ...data,
          motionId: selectedMotionId,
          originalImage: targetImageUrl
        }]);
        
        // Automatically switch to library tab to show the generated content
        setActiveTab('library');
      }
    } catch (error) {
      console.error('Exception during motion generation:', error);
      setApiErrors(prev => ({ ...prev, motion: 'Service temporarily unavailable. Please try again later.' }));
      toast.error('Motion service is currently unavailable. Please try again later.');
    } finally {
      setIsProcessingMotion(false);
    }
  };

  const loadAvailableMotions = async () => {
    setLoadingMotions(true);
    try {
      const { data, error } = await supabase.functions.invoke('higgsfield-motions');
      
      if (error) {
        console.error('Error loading motions:', error);
        // Fallback to default motions if API fails
        setAvailableMotions(getEnhancedDefaultMotions());
        return;
      }

      if (data?.success && data?.motions && data.motions.length > 0) {
        // Enhance API motions with categories and better descriptions
        const enhancedMotions = data.motions.map((motion: any) => ({
          ...motion,
          category: categorizeMotion(motion.name || motion.id),
          enhanced_description: enhanceMotionDescription(motion.name || motion.id, motion.description)
        }));
        setAvailableMotions(enhancedMotions);
      } else {
        setAvailableMotions(getEnhancedDefaultMotions());
      }
    } catch (error) {
      console.error('Error loading motions:', error);
      setAvailableMotions(getEnhancedDefaultMotions());
    } finally {
      setLoadingMotions(false);
    }
  };

  const categorizeMotion = (motionName: string): string => {
    const name = motionName.toLowerCase();
    if (name.includes('zoom') || name.includes('dolly') || name.includes('pan') || name.includes('tilt') || name.includes('rotate') || name.includes('crash')) {
      return 'camera';
    } else if (name.includes('wind') || name.includes('water') || name.includes('particle') || name.includes('light') || name.includes('fog') || name.includes('leaves')) {
      return 'environmental';
    } else {
      return 'object';
    }
  };

  const enhanceMotionDescription = (name: string, description: string): string => {
    const enhancements: { [key: string]: string } = {
      'object-drift': '✨ Creates a dreamy floating effect perfect for portraits and artistic shots',
      'zoom-in': '🔍 Dramatic zoom that draws viewers deep into your content',
      'parallax-scroll': '🌊 Professional depth effect that separates foreground and background',
      'gentle-sway': '🍃 Natural organic movement ideal for nature and lifestyle content',
      'rotate-slow': '🔄 Hypnotic rotation perfect for product showcases and abstract art',
      'pulse-glow': '💫 Breathing light effect that adds energy and life to static images'
    };
    
    return enhancements[name.toLowerCase()] || description || `Professional ${name.replace('-', ' ')} motion effect`;
  };

  const getEnhancedDefaultMotions = () => [
    {
      id: 'object-drift',
      name: 'Floating Dreams',
      description: 'Subtle floating motion that makes subjects appear weightless',
      enhanced_description: '✨ Creates a dreamy floating effect perfect for portraits and artistic shots',
      preview_url: null,
      start_end_frame: false,
      category: 'object'
    },
    {
      id: 'zoom-in',
      name: 'Dramatic Focus',
      description: 'Smooth zoom effect that draws focus to the center',
      enhanced_description: '🔍 Dramatic zoom that draws viewers deep into your content',
      preview_url: null,
      start_end_frame: false,
      category: 'camera'
    },
    {
      id: 'parallax-scroll',
      name: 'Depth Master',
      description: 'Creates depth by moving layers at different speeds',
      enhanced_description: '🌊 Professional depth effect that separates foreground and background',
      preview_url: null,
      start_end_frame: false,
      category: 'camera'
    },
    {
      id: 'gentle-sway',
      name: 'Natural Flow',
      description: 'Organic swaying motion for natural elements',
      enhanced_description: '🍃 Natural organic movement ideal for nature and lifestyle content',
      preview_url: null,
      start_end_frame: false,
      category: 'environmental'
    },
    {
      id: 'rotate-slow',
      name: 'Hypnotic Spin',
      description: 'Elegant rotating motion with mesmerizing appeal',
      enhanced_description: '🔄 Hypnotic rotation perfect for product showcases and abstract art',
      preview_url: null,
      start_end_frame: false,
      category: 'object'
    },
    {
      id: 'pulse-glow',
      name: 'Energy Pulse',
      description: 'Breathing light effect that energizes images',
      enhanced_description: '💫 Breathing light effect that adds energy and life to static images',
      preview_url: null,
      start_end_frame: false,
      category: 'environmental'
    },
    {
      id: 'pan-left',
      name: 'Cinematic Pan',
      description: 'Professional horizontal camera movement',
      enhanced_description: '🎬 Hollywood-style panning for cinematic storytelling',
      preview_url: null,
      start_end_frame: false,
      category: 'camera'
    },
    {
      id: 'object-bounce',
      name: 'Playful Bounce',
      description: 'Fun bouncing animation for dynamic content',
      enhanced_description: '🏀 Energetic bouncing perfect for playful and youthful content',
      preview_url: null,
      start_end_frame: false,
      category: 'object'
    }
  ];

  const handleSpeechToVideo = async () => {
    if (!speechText.trim()) {
      toast.error('Please enter text for speech-to-video generation.');
      return;
    }

    setIsProcessingSpeech(true);

    try {
      console.log('Generating speech-to-video:', speechText);
      
      const { data, error } = await supabase.functions.invoke('higgsfield-speech-video', {
        body: {
          text: speechText,
          voice: selectedVoice,
          style: 'conversational'
        }
      });

      if (error) {
        console.error('Error generating speech video:', error);
        toast.error('Failed to generate speech video. Please try again.');
        return;
      }

      console.log('Speech video generated:', data);
      
      toast.success('Speech video generated successfully!');

      // Add to speech videos array and switch to library tab
      if (data?.videoUrl) {
        setSpeechVideos(prev => [...prev, data]);
        
        // Automatically switch to library tab to show the generated content
        setActiveTab('library');
      }
    } catch (error) {
      console.error('Exception during speech video generation:', error);
      toast.error('An unexpected error occurred while generating speech video.');
    } finally {
      setIsProcessingSpeech(false);
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
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Content Assistant {isProSubscriber && <Badge variant="secondary">PRO</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="speechvideo" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Speech</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="flex-1 overflow-auto">
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              {/* Generation Form */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content Generation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div>
                       <label className="text-sm font-medium">Content Type</label>
                       <Select value={contentType} onValueChange={setContentType}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select content type" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="image">
                             <div className="flex items-center gap-2">
                               <ImageIcon className="h-4 w-4" />
                               Image
                             </div>
                           </SelectItem>
                           <SelectItem value="video">
                             <div className="flex items-center gap-2">
                               <Video className="h-4 w-4" />
                               Video
                             </div>
                           </SelectItem>
                           <SelectItem value="text">
                             <div className="flex items-center gap-2">
                               <FileText className="h-4 w-4" />
                               Text Content
                             </div>
                           </SelectItem>
                           <SelectItem value="document">
                             <div className="flex items-center gap-2">
                               <FileText className="h-4 w-4" />
                               Document
                             </div>
                           </SelectItem>
                           <SelectItem value="carousel">
                             <div className="flex items-center gap-2">
                               <LayoutGrid className="h-4 w-4" />
                               Carousel
                             </div>
                           </SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <label className="text-sm font-medium">Content Prompt</label>
                        <Textarea
                          placeholder={`Describe the ${contentType} you want to create...`}
                          value={contentPrompt}
                          onChange={(e) => setContentPrompt(e.target.value)}
                          className="min-h-[100px]"
                        />
                       <p className="text-xs text-muted-foreground mt-1">
                         Will generate one {contentType} based on your description.
                       </p>
                     </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
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
                        {previewContent.slice(0, 1).map((content) => (
                          <div key={content.id} className="p-3 border rounded-lg">
                            {(content.imageUrl || content.downloadUrl) && content.type === 'image' && (
                              <img
                                src={content.imageUrl || content.downloadUrl}
                                alt={content.title}
                                className="w-full h-24 object-cover rounded mb-2"
                                onError={(e) => {
                                  console.error('Image failed to load:', content);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            {content.type === 'image' && !content.imageUrl && !content.downloadUrl && (
                              <div className="w-full h-24 bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed">
                                {content.actualFile ? (
                                  <div className="text-center">
                                    <div className="animate-pulse">🎨 Generating image...</div>
                                    <div className="text-xs mt-1">This may take a few moments</div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <div>📝 Image concept ready</div>
                                    <div className="text-xs mt-1">Use prompt to generate manually</div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {content.videoUrl && content.type === 'video_script' && (
                              <video
                                controls
                                className="w-full h-24 object-cover rounded mb-2"
                                onError={(e) => {
                                  console.error('Video failed to load:', content);
                                }}
                                preload="metadata"
                              >
                                <source
                                  src={content.videoUrl}
                                  type={(content.fileFormat === 'mov' ? 'video/quicktime' : content.fileFormat === 'webm' ? 'video/webm' : 'video/mp4')}
                                />
                                Your browser does not support the video tag.
                              </video>
                            )}
                            {content.type === 'video_script' && !content.videoUrl && (
                              <div className="w-full h-24 bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed">
                                {content.actualFile ? (
                                  <div className="text-center">
                                    <div className="animate-pulse">🎬 Generating video...</div>
                                    <div className="text-xs mt-1">This may take up to 5 minutes</div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <div>📝 Video script ready</div>
                                    <div className="text-xs mt-1">Use script to create video manually</div>
                                  </div>
                                )}
                              </div>
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
            </div>
          </TabsContent>

          <TabsContent value="library" className="flex-1 overflow-auto">
            <div className="space-y-4 p-4">
              {generatedContent.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No generated content yet. Create some content first!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {generatedContent.map((content) => (
                    <CampaignCard
                      key={content.id}
                      title={content.title}
                      description={content.content}
                      imageUrl={content.imageUrl}
                      videoUrl={content.videoUrl || content.carouselImageUrls?.[0]}
                      onEdit={() => {
                        setSelectedContent(content);
                        if (content.type === 'image') {
                          setShowPhotoEditor(true);
                        } else if (content.carouselImageUrls) {
                          setShowCarouselUpload(true);
                        }
                      }}
                      onDelete={() => deleteContent(content.id)}
                      actionLabel={content.type === 'image' ? 'Edit Image' : 'View Details'}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="editor" className="flex-1 overflow-auto">
            <div className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Motion Templates & Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Content will be here but truncated for brevity */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="speechvideo" className="flex-1 overflow-auto">
            <div className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Speech Video Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Speech video content */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
                            {content.videoUrl && content.type === 'video_script' && (
                              <video
                                controls
                                className="w-full h-32 object-cover rounded mb-3"
                                preload="metadata"
                              >
                                <source
                                  src={content.videoUrl}
                                  type={(content.fileFormat === 'mov' ? 'video/quicktime' : content.fileFormat === 'webm' ? 'video/webm' : 'video/mp4')}
                                />
                                Your browser does not support the video tag.
                              </video>
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
                            {(content.downloadUrl || content.fileUrl || content.videoUrl || content.imageUrl) && (
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
                            {(content.downloadUrl || content.fileUrl || content.videoUrl || content.imageUrl) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadContent(content)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            ) : (
                              content.type === 'video_script' && (
                                <Button size="sm" variant="outline" disabled>
                                  Generating video…
                                </Button>
                              )
                            )}
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
                  <CardTitle className="text-sm">Streamcentives Suite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Upload Section */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload Image for Motion</label>
                    <div className="relative w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        className="hidden"
                        id="motion-image-upload"
                      />
                      
                       {uploadedImage ? (
                         <div className="relative w-full max-w-md mx-auto">
                           <div className="aspect-square w-full overflow-hidden rounded-lg border-2 border-muted">
                             <img
                               src={uploadedImage}
                               alt="Uploaded for motion"
                               className="w-full h-full object-contain bg-muted"
                             />
                           </div>
                           <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center group">
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                               <Button
                                 size="sm"
                                 variant="secondary"
                                 onClick={() => document.getElementById('motion-image-upload')?.click()}
                               >
                                 <Upload className="h-4 w-4 mr-1" />
                                 Replace
                               </Button>
                               <Button
                                 size="sm"
                                 variant="destructive"
                                 onClick={() => setUploadedImage('')}
                               >
                                 <Trash2 className="h-4 w-4 mr-1" />
                                 Remove
                               </Button>
                             </div>
                           </div>
                         </div>
                       ) : (
                         <label
                           htmlFor="motion-image-upload"
                           className="flex flex-col items-center justify-center w-full aspect-square max-w-md mx-auto border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25 hover:border-primary"
                         >
                           <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                           <p className="text-sm text-muted-foreground text-center mb-2">
                             Click to upload image
                           </p>
                           <p className="text-xs text-muted-foreground/70 text-center px-4">
                             JPG, PNG, WebP • 1024x1024+ recommended<br />
                             Maximum file size: 20MB
                           </p>
                         </label>
                       )}
                    </div>
                  </div>

                  {/* Motion Templates Selection */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Motion Templates Library</label>
                    
                    {loadingMotions ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-3 text-sm text-muted-foreground">Loading motion templates...</span>
                      </div>
                    ) : (
                      <>
                        {/* Category Selection */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Button
                            size="sm"
                            variant={selectedMotionCategory === 'camera' ? 'default' : 'outline'}
                            onClick={() => setSelectedMotionCategory('camera')}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Camera ({availableMotions.filter(m => m.category === 'camera').length})
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedMotionCategory === 'object' ? 'default' : 'outline'}
                            onClick={() => setSelectedMotionCategory('object')}
                          >
                            <Target className="h-4 w-4 mr-1" />
                            Object ({availableMotions.filter(m => m.category === 'object').length})
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedMotionCategory === 'environmental' ? 'default' : 'outline'}
                            onClick={() => setSelectedMotionCategory('environmental')}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            Environmental ({availableMotions.filter(m => m.category === 'environmental').length})
                          </Button>
                        </div>

                        {/* Instagram-Style Templates Grid */}
                        <div className="border rounded-lg p-2 max-h-80 overflow-y-auto">
                          <div className="grid grid-cols-3 gap-2">
                            {availableMotions
                              .filter(motion => motion.category === selectedMotionCategory)
                              .map((motion) => (
                              <div
                                key={motion.id}
                                className={`relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 transition-all ${
                                  selectedMotionId === motion.id 
                                    ? 'border-primary ring-2 ring-primary/20' 
                                    : 'border-transparent hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedMotionId(motion.id)}
                              >
                                {/* Template Preview Image */}
                                {motion.preview_url ? (
                                  <img
                                    src={motion.preview_url}
                                    alt={`${motion.name} preview`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg'
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}

                                {/* Overlay with template info */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                  <h4 className="text-white text-xs font-medium mb-1 line-clamp-1">{motion.name}</h4>
                                  <p className="text-white/80 text-xs line-clamp-2 leading-tight">
                                    {motion.enhanced_description || motion.description}
                                  </p>
                                  {motion.start_end_frame && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0 mt-1 w-fit">
                                      Advanced
                                    </Badge>
                                  )}
                                </div>

                                {/* Selection indicator */}
                                {selectedMotionId === motion.id && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}

                                {/* Preview button */}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTemplateForPreview(motion);
                                    setShowTemplatePreview(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Selected Template Info */}
                        {selectedMotionId && (
                          <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                            {(() => {
                              const selectedTemplate = availableMotions.find(m => m.id === selectedMotionId);
                              return selectedTemplate ? (
                                <div className="flex items-start gap-3">
                                  {selectedTemplate.preview_url && (
                                    <img
                                      src={selectedTemplate.preview_url}
                                      alt={`${selectedTemplate.name} preview`}
                                      className="w-16 h-16 object-cover rounded border flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium text-sm">{selectedTemplate.name}</h4>
                                      {selectedTemplate.start_end_frame && (
                                        <Badge variant="secondary" className="text-xs px-2 py-0">
                                          Advanced
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {selectedTemplate.enhanced_description || selectedTemplate.description}
                                    </p>
                                    {uploadedImage && (
                                      <div className="mt-2 text-xs text-primary font-medium">
                                        ✓ Ready to apply to your uploaded image
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        {/* No motions found message */}
                        {availableMotions.filter(m => m.category === selectedMotionCategory).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No {selectedMotionCategory} templates available</p>
                            <p className="text-xs">Try selecting a different category</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Custom Motion Prompt */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Motion Prompt (Optional)</label>
                    <Textarea
                      placeholder="Add custom motion instructions or leave empty to use template default..."
                      value={motionPrompt}
                      onChange={(e) => setMotionPrompt(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* API Error Message */}
                  {apiErrors.motion && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{apiErrors.motion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The HiggsField service may be experiencing high traffic. Try again in a few minutes.
                      </p>
                    </div>
                  )}

                  {/* Generate Motion Button */}
                  <Button
                    onClick={() => handleMotionEdit()}
                    disabled={!uploadedImage || !selectedMotionId || isProcessingMotion}
                    className="w-full"
                  >
                    {isProcessingMotion ? (
                      <>
                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Motion... (30-60s)
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Apply Motion Effect
                      </>
                    )}
                  </Button>

                  {/* Generated Motion Videos */}
                  {motionVideos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Generated Motion Videos</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {motionVideos.map((video, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-0">
                              <video
                                controls
                                className="w-full h-32 object-cover"
                                preload="metadata"
                              >
                                <source src={video.videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              <div className="p-3 space-y-2">
                                <Badge variant="outline" className="text-xs">
                                  {video.motionId || 'Custom Motion'}
                                </Badge>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const a = document.createElement('a');
                                      a.href = video.videoUrl;
                                      a.download = `motion-video-${video.motionId}-${Date.now()}.mp4`;
                                      a.click();
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedVideoUrl(video.videoUrl);
                                      setShowVideoEditor(true);
                                    }}
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      // Convert video to content format and post
                                      const videoContent: GeneratedContent = {
                                        id: crypto.randomUUID(),
                                        type: 'video_idea',
                                        title: `Motion Video - ${video.motionId}`,
                                        content: `Generated motion video with ${video.motionId} effect`,
                                        videoUrl: video.videoUrl,
                                        created_at: new Date().toISOString()
                                      };
                                      postToProfile(videoContent);
                                    }}
                                  >
                                    <Share2 className="h-3 w-3 mr-1" />
                                    Post
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy Editor Options */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3">Additional Tools</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        onClick={() => setShowPhotoEditor(true)}
                        className="h-24 flex-col gap-2"
                        variant="outline"
                      >
                        <Edit3 className="h-6 w-6" />
                        <span className="text-sm">Photo Editor</span>
                        <span className="text-xs text-muted-foreground">
                          Filters & effects
                        </span>
                      </Button>
                      
                      <Button
                        onClick={() => setShowCarouselUpload(true)}
                        className="h-24 flex-col gap-2"
                        variant="outline"
                      >
                        <LayoutGrid className="h-6 w-6" />
                        <span className="text-sm">Carousel Upload</span>
                        <span className="text-xs text-muted-foreground">
                          Multiple files
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="speechvideo" className="overflow-auto">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Speech-to-Video Generation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Speech Text</label>
                    <Textarea
                      placeholder="Enter the text you want to convert to speech video..."
                      value={speechText}
                      onChange={(e) => setSpeechText(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Voice Selection</label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US-female">English (US) - Female</SelectItem>
                        <SelectItem value="en-US-male">English (US) - Male</SelectItem>
                        <SelectItem value="en-UK-female">English (UK) - Female</SelectItem>
                        <SelectItem value="en-UK-male">English (UK) - Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSpeechToVideo}
                    disabled={!speechText.trim() || isProcessingSpeech}
                    className="w-full"
                  >
                    {isProcessingSpeech ? (
                      <>
                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Speech Video...
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Generate Speech Video
                      </>
                    )}
                  </Button>

                  {speechVideos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Generated Speech Videos</h3>
                      <div className="space-y-3">
                        {speechVideos.map((video, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <video
                                controls
                                className="w-full h-48 object-cover rounded mb-3"
                                preload="metadata"
                              >
                                <source src={video.videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = video.videoUrl;
                                    a.download = `speech-video-${Date.now()}.mp4`;
                                    a.click();
                                  }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVideoUrl(video.videoUrl);
                                    setShowVideoEditor(true);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const videoContent: GeneratedContent = {
                                      id: crypto.randomUUID(),
                                      type: 'video_idea',
                                      title: 'AI Speech Video',
                                      content: speechText.slice(0, 100) + (speechText.length > 100 ? '...' : ''),
                                      videoUrl: video.videoUrl,
                                      created_at: new Date().toISOString()
                                    };
                                    postToProfile(videoContent);
                                  }}
                                >
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Post
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
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

        {/* Video Editor Modal */}
        {showVideoEditor && (
          <VideoEditor
            videoUrl={selectedVideoUrl}
            onSave={(editedVideoUrl) => {
              // Add edited video to motion videos or speech videos based on source
              const videoContent: GeneratedContent = {
                id: crypto.randomUUID(),
                type: 'video_idea',
                title: 'Edited Video',
                content: 'Video edited with custom effects and filters',
                videoUrl: editedVideoUrl,
                created_at: new Date().toISOString()
              };
              
              setGeneratedContent(prev => [videoContent, ...prev]);
              setShowVideoEditor(false);
              setSelectedVideoUrl('');
              toast.success('Video saved to library!');
            }}
            onClose={() => {
              setShowVideoEditor(false);
              setSelectedVideoUrl('');
            }}
          />
        )}

        {/* Template Preview Dialog */}
        {showTemplatePreview && selectedTemplateForPreview && (
          <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {selectedTemplateForPreview.name} Preview
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Large Preview */}
                <div className="aspect-video rounded-lg overflow-hidden border">
                  {selectedTemplateForPreview.preview_url ? (
                    <img
                      src={selectedTemplateForPreview.preview_url}
                      alt={`${selectedTemplateForPreview.name} preview`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Template Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{selectedTemplateForPreview.name}</h3>
                    {selectedTemplateForPreview.start_end_frame && (
                      <Badge variant="secondary">Advanced</Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedTemplateForPreview.enhanced_description || selectedTemplateForPreview.description}
                  </p>

                  {/* Template Usage */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">How to use this template:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Upload an image in the Editor tab</li>
                      <li>• Select this template from the grid</li>
                      <li>• Click "Apply Motion" to generate your video</li>
                      {selectedTemplateForPreview.start_end_frame && (
                        <li>• This advanced template supports start and end frame customization</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedMotionId(selectedTemplateForPreview.id);
                      setShowTemplatePreview(false);
                    }}
                  >
                    Select This Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};