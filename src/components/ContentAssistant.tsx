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
  Eye,
  X,
  User,
  ChevronDown
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PhotoEditor } from './PhotoEditor';
import { CarouselUpload } from './CarouselUpload';
import { VideoEditor } from './VideoEditor';
import { VoiceRecorder } from './VoiceRecorder';

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
  const [audioMode, setAudioMode] = useState<'tts' | 'upload'>('tts');
  const [uploadedAudioFile, setUploadedAudioFile] = useState<string>('');
  const [speechDuration, setSpeechDuration] = useState<5 | 10 | 15>(5);
  const [speechQuality, setSpeechQuality] = useState<'high' | 'mid'>('high');
const [motionVideos, setMotionVideos] = useState<any[]>([]);
  const [speechVideos, setSpeechVideos] = useState<any[]>([]);
  const [selectedMotionId, setSelectedMotionId] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [persistedMotionVideos, setPersistedMotionVideos] = useState<any[]>([]);
  const [selectedMotionCategory, setSelectedMotionCategory] = useState<string>('camera');
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [showVideoModal, setShowVideoModal] = useState(false);
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
      const { data } = await supabase
        .from('ai_tool_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_name', 'creator_pro')
        .eq('status', 'active')
        .single();

      setIsProSubscriber(!!data);
    } catch (error) {
      setIsProSubscriber(false);
    }
  };

  // Load persisted motion videos on component mount
  useEffect(() => {
    loadPersistedMotionVideos();
  }, [user]);

  const loadPersistedMotionVideos = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'motion_video')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading persisted motion videos:', error);
        return;
      }

      setPersistedMotionVideos(data || []);
    } catch (error) {
      console.error('Error loading persisted motion videos:', error);
    }
  };

  const saveMotionVideoToDatabase = async (videoData: any) => {
    try {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .insert({
          user_id: user?.id,
          type: 'motion_video',
          title: `Motion Video - ${videoData.motionId || 'Custom'}`,
          content: `Generated motion video with ${videoData.motionId || 'custom'} effect`,
          download_url: videoData.videoUrl,
          image_url: videoData.originalImage,
          metadata: {
            motionId: videoData.motionId,
            originalImage: videoData.originalImage,
            jobSetId: videoData.jobSetId,
            generatedAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving motion video to database:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving motion video to database:', error);
      return null;
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
          type: 'image2video'
        }
      });

      if (error) {
        console.error('Error starting motion job:', error);
        if (error.message?.includes('522') || error.message?.includes('timeout')) {
          setApiErrors(prev => ({ ...prev, motion: 'HiggsField service is temporarily unavailable. Please try again later.' }));
          toast.error('Motion service is temporarily down. Please try again in a few minutes.');
        } else {
          toast.error('Failed to start motion job. Please try again.');
        }
        return;
      }

      // If function returned the video immediately (rare), handle it
      if (data?.videoUrl) {
        const videoData = {
          ...data,
          motionId: selectedMotionId,
          originalImage: targetImageUrl
        };
        
        setMotionVideos(prev => [...prev, videoData]);
        setActiveTab('library');
        toast.success('Motion video generated!');
        
        // Save to database for persistence
        await saveMotionVideoToDatabase(videoData);
        await loadPersistedMotionVideos();
        return;
      }

      // Otherwise, poll for completion using jobSetId
      const jobSetId = data?.jobSetId;
      if (!jobSetId) {
        toast.error('Failed to start generation. Missing job id.');
        return;
      }

      toast.message('Processing started', { description: 'Your motion video is being generated. This can take 30–60 seconds.' });

      const pollIntervalMs = 5000;
      const maxAttempts = 120; // up to ~10 minutes

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        const { data: statusData, error: statusError } = await supabase.functions.invoke('higgsfield-motion-status', {
          body: { jobSetId }
        });

        if (statusError) {
          console.warn('Status check error:', statusError);
          continue;
        }

        if (statusData?.status === 'completed' && statusData?.videoUrl) {
          const videoData = {
            ...statusData,
            jobSetId,
            motionId: selectedMotionId,
            originalImage: targetImageUrl
          };
          
          setMotionVideos(prev => [...prev, videoData]);
          setActiveTab('library');
          toast.success('Motion video ready!');
          
          // Save to database for persistence
          await saveMotionVideoToDatabase(videoData);
          await loadPersistedMotionVideos();
          return;
        }

        if (statusData?.status === 'failed') {
          toast.error('Generation failed. Try a different image or template.');
          return;
        }
      }

      toast.error('Timed out while generating video. Please try again.');
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

  const handleAudioUpload = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.includes('wav') && !file.name.toLowerCase().endsWith('.wav')) {
        toast.error('Please upload a WAV audio file (.wav format required)');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/speech-audio/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('generated-content').getPublicUrl(fileName);
      setUploadedAudioFile(data.publicUrl);
      toast.success('WAV audio file uploaded successfully!');
    } catch (error) {
      console.error('Error uploading audio file:', error);
      toast.error('Failed to upload audio file');
    }
  };

  const handleSpeechToVideo = async () => {
    // Validation based on audio mode
    if (audioMode === 'tts' && !speechText.trim()) {
      toast.error('Please enter text for speech-to-video generation.');
      return;
    }

    if (audioMode === 'upload' && !uploadedAudioFile) {
      toast.error('Please upload a WAV audio file.');
      return;
    }

    // Require an image to animate per HiggsField Speak v2 spec
    if (!uploadedImage) {
      toast.error('Please upload an image to animate.');
      return;
    }

    setIsProcessingSpeech(true);

    try {
      console.log('Generating speech-to-video with mode:', audioMode);
      
      const requestBody: any = {
        input_image_url: uploadedImage,
        duration: speechDuration,
        quality: speechQuality,
      };

      if (audioMode === 'tts') {
        requestBody.text = speechText;
        requestBody.voice = selectedVoice;
      } else {
        requestBody.input_audio_url = uploadedAudioFile;
        requestBody.prompt = speechText || 'Speech-to-video animation';
      }
      
      const { data, error } = await supabase.functions.invoke('higgsfield-speech-video', {
        body: requestBody
      });

      if (error) {
        console.error('Error generating speech video:', error);
        
        // Provide specific error messages based on error content
        if (error.message?.includes('WAV') || error.message?.includes('wav')) {
          toast.error('Audio format error: Please use WAV format audio or try text-to-speech mode.');
        } else if (error.message?.includes('image')) {
          toast.error('Image error: Please upload a valid image file.');
        } else if (error.message?.includes('timeout') || error.message?.includes('522')) {
          toast.error('Generation timed out. Please try again with a shorter duration.');
        } else {
          toast.error(`Generation failed: ${error.message || 'Please try again.'}`);
        }
        return;
      }

      console.log('Speech video generated:', data);
      
      toast.success(
        `🎥 Speech video generated successfully! Check the Library tab to view and share your video.`,
        { 
          duration: 4000,
          action: {
            label: 'View Library',
            onClick: () => setActiveTab('library')
          }
        }
      );

        // Add to speech videos array and save to library
        if (data?.videoUrl) {
          const displayText = speechText || 'Speech-to-video animation';
          const speechVideoContent: GeneratedContent = {
            id: crypto.randomUUID(),
            type: 'video_script',
            title: `Speech Video - ${displayText.slice(0, 30)}...`,
            content: displayText,
            videoUrl: data.videoUrl,
            imageUrl: uploadedImage,
            created_at: new Date().toISOString(),
            metadata: {
              generationType: 'speech-to-video',
              audioMode: audioMode,
              voiceSettings: audioMode === 'tts' ? selectedVoice : 'uploaded',
              originalImage: uploadedImage,
              duration: speechDuration,
              quality: speechQuality,
              generatedAt: new Date().toISOString()
            }
          };

        // Add to speech videos array
        setSpeechVideos(prev => [...prev, data]);
        
        // Save to generated content library
        setGeneratedContent(prev => [speechVideoContent, ...prev]);
        
        // Save to localStorage for persistence
        const existing = localStorage.getItem(`ai_content_${user.id}`);
        const existingContent = existing ? JSON.parse(existing) : [];
        const updatedContent = [speechVideoContent, ...existingContent];
        localStorage.setItem(`ai_content_${user.id}`, JSON.stringify(updatedContent));
        
        // Automatically switch to library tab to show the generated content
        setTimeout(() => {
          setActiveTab('library');
        }, 1000);
        
        // Clear form after successful generation
        if (audioMode === 'tts') {
          setSpeechText('');
        } else {
          setUploadedAudioFile('');
        }
      }
    } catch (error) {
      console.error('Exception during speech video generation:', error);
      toast.error('An unexpected error occurred while generating speech video. Please check your inputs and try again.');
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  const postToProfile = async (content: GeneratedContent, editedImages?: string[], destination: 'profile' | 'community' | 'both' = 'profile') => {
    if (!user) return;

    try {
      const imagesToPost = editedImages || (content.imageUrl ? [content.imageUrl] : content.videoUrl ? [] : []);
      
      // Handle video content
      const contentType = content.videoUrl ? 'video' : (imagesToPost.length > 0 ? 'image' : 'text');
      const contentUrl = content.videoUrl || imagesToPost[0] || '';
      
      const postsToCreate = [];
      
      // Create profile post
      if (destination === 'profile' || destination === 'both') {
        postsToCreate.push({
          user_id: user.id,
          content_type: contentType,
          content_url: contentUrl,
          caption: content.content,
          is_community_post: false,
          is_cross_posted: destination === 'both',
          carousel_urls: imagesToPost.length > 1 ? imagesToPost : null
        });
      }
      
      // Create community post
      if (destination === 'community' || destination === 'both') {
        postsToCreate.push({
          user_id: user.id,
          content_type: contentType,
          content_url: contentUrl,
          caption: content.content,
          is_community_post: true,
          is_cross_posted: destination === 'both',
          carousel_urls: imagesToPost.length > 1 ? imagesToPost : null
        });
      }

      // Insert all posts
      const { error } = await supabase
        .from('posts')
        .insert(postsToCreate);

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

      const destinationText = destination === 'both' ? 'profile and community' : destination;
      toast.success(`Posted to your ${destinationText}!`);
      
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
                    <Card key={content.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {content.imageUrl && (
                          <img
                            src={content.imageUrl}
                            alt={content.title}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        {content.videoUrl && (
                          <video
                            controls
                            className="w-full h-32 object-cover rounded mb-3"
                            preload="metadata"
                          >
                            <source
                              src={content.videoUrl}
                              type={(
                                content.fileFormat === 'mov'
                                  ? 'video/quicktime'
                                  : content.fileFormat === 'webm'
                                  ? 'video/webm'
                                  : 'video/mp4'
                              )}
                            />
                            Your browser does not support the video tag.
                          </video>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{content.type}</Badge>
                          {content.fileFormat && (
                            <Badge variant="secondary" className="text-xs">
                              {content.fileFormat.toUpperCase()}
                            </Badge>
                          )}
                          {(content.downloadUrl || content.fileUrl || content.videoUrl || content.imageUrl) && (
                            <Badge variant="default" className="text-xs">✓ File</Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-sm mb-2">{content.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{content.content}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                          {(content.downloadUrl || content.fileUrl || content.videoUrl || content.imageUrl) ? (
                            <Button size="sm" variant="outline" onClick={() => downloadContent(content)}>
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

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm">
                                <Share2 className="h-3 w-3 mr-1" />
                                Post
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => postToProfile(content, undefined, 'profile')}>
                                <User className="h-4 w-4 mr-2" />
                                Post to Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => postToProfile(content, undefined, 'community')}>
                                <Users className="h-4 w-4 mr-2" />
                                Post to Community
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => postToProfile(content, undefined, 'both')}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Post to Both
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button size="sm" variant="destructive" onClick={() => deleteContent(content.id)}>
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
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                              <div 
                                className="relative cursor-pointer group"
                                onClick={() => {
                                  setSelectedVideoUrl(video.videoUrl);
                                  setShowVideoModal(true);
                                }}
                              >
                                <video
                                  className="w-full h-32 object-cover"
                                  preload="metadata"
                                  muted
                                >
                                  <source src={video.videoUrl} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
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
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm">
                                        <Share2 className="h-3 w-3 mr-1" />
                                        Post
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const videoContent: GeneratedContent = {
                                            id: crypto.randomUUID(),
                                            type: 'video_idea',
                                            title: `Motion Video - ${video.motionId}`,
                                            content: `Generated motion video with ${video.motionId} effect`,
                                            videoUrl: video.videoUrl,
                                            created_at: new Date().toISOString()
                                          };
                                          postToProfile(videoContent, undefined, 'profile');
                                        }}
                                      >
                                        <User className="h-4 w-4 mr-2" />
                                        Post to Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const videoContent: GeneratedContent = {
                                            id: crypto.randomUUID(),
                                            type: 'video_idea',
                                            title: `Motion Video - ${video.motionId}`,
                                            content: `Generated motion video with ${video.motionId} effect`,
                                            videoUrl: video.videoUrl,
                                            created_at: new Date().toISOString()
                                          };
                                          postToProfile(videoContent, undefined, 'community');
                                        }}
                                      >
                                        <Users className="h-4 w-4 mr-2" />
                                        Post to Community
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const videoContent: GeneratedContent = {
                                            id: crypto.randomUUID(),
                                            type: 'video_idea',
                                            title: `Motion Video - ${video.motionId}`,
                                            content: `Generated motion video with ${video.motionId} effect`,
                                            videoUrl: video.videoUrl,
                                            created_at: new Date().toISOString()
                                          };
                                          postToProfile(videoContent, undefined, 'both');
                                        }}
                                      >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Post to Both
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Persisted Motion Videos */}
                  {persistedMotionVideos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Saved Motion Videos</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {persistedMotionVideos.map((video) => (
                          <Card key={video.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div 
                                className="relative cursor-pointer group"
                                onClick={() => {
                                  setSelectedVideoUrl(video.download_url);
                                  setShowVideoModal(true);
                                }}
                              >
                                <video
                                  className="w-full h-32 object-cover"
                                  preload="metadata"
                                  muted
                                >
                                  <source src={video.download_url} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 space-y-2">
                                <Badge variant="outline" className="text-xs">
                                  {video.metadata?.motionId || 'Saved Motion'}
                                </Badge>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const a = document.createElement('a');
                                      a.href = video.download_url;
                                      a.download = `motion-video-${video.metadata?.motionId || 'saved'}-${Date.now()}.mp4`;
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
                                      setSelectedVideoUrl(video.download_url);
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
                                        title: video.title,
                                        content: video.content,
                                        videoUrl: video.download_url,
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

          <TabsContent value="speechvideo" className="flex-1 overflow-auto">
            <div className="space-y-6 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Speech-to-Video Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload Image to Animate</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                      id="speech-image-upload"
                    />
                    <div className="relative">
                      {uploadedImage ? (
                        <div className="relative w-full max-w-md mx-auto">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={uploadedImage}
                              alt="Uploaded for animation"
                              className="w-full h-full object-contain bg-muted"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center group">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => document.getElementById('speech-image-upload')?.click()}
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
                          htmlFor="speech-image-upload"
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

                  <div>
                    <label className="text-sm font-medium mb-3 block">Audio Input Method</label>
                    <Tabs value={audioMode} onValueChange={(value) => setAudioMode(value as 'tts' | 'upload')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tts" className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Text-to-Speech
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Upload WAV
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="tts" className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Voice Recording</label>
                          <VoiceRecorder
                            onTranscription={(text) => setSpeechText(text)}
                            placeholder="Record your voice to convert to speech video..."
                            showTranscription={true}
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or type manually
                            </span>
                          </div>
                        </div>

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
                      </TabsContent>

                      <TabsContent value="upload" className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Upload WAV Audio File</label>
                          <input
                            type="file"
                            accept="audio/wav,.wav"
                            onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                            className="hidden"
                            id="wav-audio-upload"
                          />
                          {uploadedAudioFile ? (
                            <div className="border rounded-lg p-4 bg-muted/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">WAV Audio Uploaded</p>
                                  <audio controls className="mt-2 w-full max-w-xs">
                                    <source src={uploadedAudioFile} type="audio/wav" />
                                    Your browser does not support audio playback.
                                  </audio>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setUploadedAudioFile('')}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <label
                              htmlFor="wav-audio-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25 hover:border-primary"
                            >
                              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground text-center">
                                Click to upload WAV audio file
                              </p>
                              <p className="text-xs text-muted-foreground/70 text-center px-4">
                                Only .wav format • Maximum 20MB
                              </p>
                            </label>
                          )}
                        </div>

                        {audioMode === 'upload' && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                            <Textarea
                              placeholder="Describe what's happening in your audio..."
                              value={speechText}
                              onChange={(e) => setSpeechText(e.target.value)}
                              className="min-h-[80px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              This description helps create better video animations.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Video Duration</label>
                      <Select value={speechDuration.toString()} onValueChange={(value) => setSpeechDuration(Number(value) as 5 | 10 | 15)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                          <SelectItem value="15">15 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Video Quality</label>
                      <Select value={speechQuality} onValueChange={(value) => setSpeechQuality(value as 'high' | 'mid')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Quality</SelectItem>
                          <SelectItem value="mid">Standard Quality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSpeechToVideo}
                    disabled={
                      isProcessingSpeech || 
                      !uploadedImage || 
                      (audioMode === 'tts' && !speechText.trim()) ||
                      (audioMode === 'upload' && !uploadedAudioFile)
                    }
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
                        Generate Speech Video ({audioMode === 'tts' ? 'TTS' : 'WAV'})
                      </>
                    )}
                  </Button>

                  {isProcessingSpeech && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Wand2 className="h-5 w-5 animate-spin text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Generating Speech Video...</p>
                            <p className="text-xs text-muted-foreground">
                              {audioMode === 'tts' 
                                ? `Converting "${speechText.slice(0, 40)}..." to speech, then animating with your image` 
                                : 'Processing your WAV audio and animating with your image'
                              }
                            </p>
                            <div className="mt-2">
                              <Progress value={33} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">
                                This usually takes 30-60 seconds...
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!uploadedImage && (
                    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-amber-600" />
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            Upload an image above to enable speech-to-video generation
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(audioMode === 'tts' && !speechText.trim()) && uploadedImage && (
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-blue-600" />
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            Enter text or record voice to enable speech-to-video generation
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(audioMode === 'upload' && !uploadedAudioFile) && uploadedImage && (
                    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-purple-600" />
                          <p className="text-xs text-purple-800 dark:text-purple-200">
                            Upload a WAV audio file to enable generation
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm">
                                      <Share2 className="h-3 w-3 mr-1" />
                                      Post
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const videoContent: GeneratedContent = {
                                          id: crypto.randomUUID(),
                                          type: 'video_idea',
                                          title: 'AI Speech Video',
                                          content: speechText.slice(0, 100) + (speechText.length > 100 ? '...' : ''),
                                          videoUrl: video.videoUrl,
                                          created_at: new Date().toISOString()
                                        };
                                        postToProfile(videoContent, undefined, 'profile');
                                      }}
                                    >
                                      <User className="h-4 w-4 mr-2" />
                                      Post to Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const videoContent: GeneratedContent = {
                                          id: crypto.randomUUID(),
                                          type: 'video_idea',
                                          title: 'AI Speech Video',
                                          content: speechText.slice(0, 100) + (speechText.length > 100 ? '...' : ''),
                                          videoUrl: video.videoUrl,
                                          created_at: new Date().toISOString()
                                        };
                                        postToProfile(videoContent, undefined, 'community');
                                      }}
                                    >
                                      <Users className="h-4 w-4 mr-2" />
                                      Post to Community
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const videoContent: GeneratedContent = {
                                          id: crypto.randomUUID(),
                                          type: 'video_idea',
                                          title: 'AI Speech Video',
                                          content: speechText.slice(0, 100) + (speechText.length > 100 ? '...' : ''),
                                          videoUrl: video.videoUrl,
                                          created_at: new Date().toISOString()
                                        };
                                        postToProfile(videoContent, undefined, 'both');
                                      }}
                                    >
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Post to Both
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
              // Handle saved images
              editedImages.forEach((image, index) => {
                const imageContent: GeneratedContent = {
                  id: crypto.randomUUID(),
                  type: 'image',
                  title: `Edited Image ${index + 1}`,
                  content: 'Edited image from Content Assistant',
                  imageUrl: image,
                  created_at: new Date().toISOString()
                };
                
                // Add to generated content
                setGeneratedContent(prev => [imageContent, ...prev]);
                
                // Also post to profile if requested
                postToProfile(imageContent);
              });
              
              setShowPhotoEditor(false);
              setSelectedContent(null);
              toast.success('Images edited and saved!');
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
              const carouselContent: GeneratedContent = {
                id: crypto.randomUUID(),
                type: 'carousel',
                title: 'Carousel Post',
                content: 'Created carousel from uploaded images',
                created_at: new Date().toISOString()
              };

              setGeneratedContent(prev => [carouselContent, ...prev]);
              postToProfile(carouselContent);
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
                content: 'Video edited in Content Assistant',
                videoUrl: editedVideoUrl,
                created_at: new Date().toISOString()
              };
              
              setGeneratedContent(prev => [videoContent, ...prev]);
              postToProfile(videoContent);
              setShowVideoEditor(false);
              setSelectedVideoUrl('');
              toast.success('Video edited and saved!');
            }}
            onClose={() => {
              setShowVideoEditor(false);
              setSelectedVideoUrl('');
            }}
          />
        )}

        {/* Template Preview Modal */}
        {showTemplatePreview && selectedTemplateForPreview && (
          <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedTemplateForPreview.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedTemplateForPreview.preview_url && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedTemplateForPreview.preview_url}
                      alt={selectedTemplateForPreview.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplateForPreview.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">How to use:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Upload an image in the Editor tab</li>
                    <li>• Select this template from the grid</li>
                    <li>• Click "Apply Motion" to generate your video</li>
                    {selectedTemplateForPreview.start_end_frame && (
                      <li>• This advanced template supports start and end frame customization</li>
                    )}
                  </ul>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedMotionId(selectedTemplateForPreview.id);
                      setShowTemplatePreview(false);
                      setActiveTab('editor');
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Video Modal */}
        {showVideoModal && selectedVideoUrl && (
          <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
            <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black">
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                  onLoadedMetadata={(e) => {
                    // Focus the video element to enable keyboard controls
                    (e.target as HTMLVideoElement).focus();
                  }}
                >
                  <source src={selectedVideoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 z-10"
                  onClick={() => setShowVideoModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContentAssistant;
