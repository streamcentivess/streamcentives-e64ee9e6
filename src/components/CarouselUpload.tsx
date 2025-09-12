import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Play, 
  Image, 
  Video, 
  Plus,
  Share2,
  Zap,
  Clock,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CarouselUploadProps {
  onUploadComplete: () => void;
  onClose: () => void;
  applyProBoost?: boolean;
}

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
  duration?: number;
}

export const CarouselUpload: React.FC<CarouselUploadProps> = ({ 
  onUploadComplete, 
  onClose, 
  applyProBoost = false 
}) => {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [caption, setCaption] = useState('');
  const [crossPostToCommunity, setCrossPostToCommunity] = useState(applyProBoost);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length === 0) {
      toast.error('Please select valid image or video files');
      return;
    }

    if (mediaFiles.length + validFiles.length > 10) {
      toast.error('Maximum 10 files allowed in a carousel');
      return;
    }

    // Process each file
    validFiles.forEach((file) => {
      const id = crypto.randomUUID();
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      
      if (type === 'video') {
        // Check video duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          if (video.duration > 300) { // 5 minutes max
            toast.error(`Video "${file.name}" is too long. Maximum 5 minutes allowed.`);
            return;
          }
          
          const mediaFile: MediaFile = {
            id,
            file,
            type,
            preview: URL.createObjectURL(file),
            duration: video.duration
          };
          
          setMediaFiles(prev => [...prev, mediaFile]);
        };
        video.src = URL.createObjectURL(file);
      } else {
        // Image file
        const mediaFile: MediaFile = {
          id,
          file,
          type,
          preview: URL.createObjectURL(file)
        };
        
        setMediaFiles(prev => [...prev, mediaFile]);
      }
    });

    // Reset file input
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      // Cleanup object URLs
      const removed = prev.find(file => file.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadCarousel = async () => {
    if (!user || mediaFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const totalFiles = mediaFiles.length;

      // Upload each file
      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];
        const fileExt = mediaFile.file.name.split('.').pop();
        const fileName = `${user.id}/carousel/${Date.now()}-${i}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, mediaFile.file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);

        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 80); // 80% for uploads
      }

      // Create posts based on cross-posting preference
      const postsToInsert = [];
      const primaryContentUrl = uploadedUrls[0];
      const carouselData = uploadedUrls.length > 1 ? uploadedUrls : null;
      
      // Always create a personal profile post
      postsToInsert.push({
        user_id: user.id,
        content_type: mediaFiles[0].type,
        content_url: primaryContentUrl,
        caption: caption.trim() || null,
        is_community_post: false,
        is_cross_posted: crossPostToCommunity,
        carousel_urls: carouselData
      });

      // If cross-posting is enabled, also create a community post
      if (crossPostToCommunity) {
        postsToInsert.push({
          user_id: user.id,
          content_type: mediaFiles[0].type,
          content_url: primaryContentUrl,
          caption: caption.trim() || null,
          is_community_post: true,
          is_cross_posted: true,
          carousel_urls: carouselData
        });
      }

      setUploadProgress(90);

      // Insert posts
      const { data: insertedPosts, error: postError } = await supabase
        .from('posts')
        .insert(postsToInsert)
        .select('id');

      if (postError) throw postError;

      // Apply Pro boost if applicable
      if (applyProBoost && insertedPosts && insertedPosts.length > 0) {
        await supabase.functions.invoke('boost-content', {
          body: {
            contentType: 'carousel_post',
            contentIds: insertedPosts.map(p => p.id),
            userId: user.id
          }
        });
      }

      setUploadProgress(100);

      const successMessage = crossPostToCommunity 
        ? `Carousel posted successfully! ${mediaFiles.length} files shared on your profile and community feed! 🎉${applyProBoost ? ' (Pro Boosted)' : ''}`
        : `Carousel posted successfully! ${mediaFiles.length} files uploaded.`;
      
      toast.success(successMessage);
      
      // Cleanup and close
      mediaFiles.forEach(file => URL.revokeObjectURL(file.preview));
      onUploadComplete();
      
    } catch (error) {
      console.error('Error uploading carousel:', error);
      toast.error('Failed to upload carousel. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carousel Upload
            {applyProBoost && <Badge className="bg-primary">PRO BOOST</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-auto">
          {/* File Upload Area */}
          <Card>
            <CardContent className="p-6">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="carousel-upload"
                disabled={uploading || mediaFiles.length >= 10}
              />
              
              <label
                htmlFor="carousel-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  uploading || mediaFiles.length >= 10
                    ? 'opacity-50 cursor-not-allowed border-muted-foreground/25'
                    : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
                }`}
              >
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {mediaFiles.length === 0 
                    ? 'Click to upload images and videos' 
                    : `Add more files (${mediaFiles.length}/10)`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images: JPG, PNG, GIF • Videos: MP4, MOV (max 5 min)
                </p>
              </label>
            </CardContent>
          </Card>

          {/* Media Preview Grid */}
          {mediaFiles.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Media Files ({mediaFiles.length}/10)</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag to reorder • First item will be the cover
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {mediaFiles.map((mediaFile, index) => (
                    <div key={mediaFile.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        {mediaFile.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={mediaFile.preview}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute bottom-2 left-2 flex items-center gap-1">
                              <Video className="h-3 w-3 text-white" />
                              {mediaFile.duration && (
                                <span className="text-xs text-white bg-black/50 px-1 rounded">
                                  {formatDuration(mediaFile.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <img
                              src={mediaFile.preview}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Image className="h-4 w-4 text-white drop-shadow" />
                            </div>
                          </div>
                        )}
                        
                        {index === 0 && (
                          <Badge className="absolute top-2 right-2 text-xs">
                            Cover
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(mediaFile.id)}
                        disabled={uploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Caption and Options */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Caption</label>
              <Textarea
                placeholder="Write a caption for your carousel..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px]"
                disabled={uploading}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Share2 className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">Cross-post to Community Feed</p>
                  <p className="text-xs text-muted-foreground">
                    Share your carousel on both your profile and the community feed
                  </p>
                </div>
              </div>
              <Switch
                checked={crossPostToCommunity}
                onCheckedChange={setCrossPostToCommunity}
                disabled={uploading}
              />
            </div>

            {applyProBoost && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Zap className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-primary">Creator Pro Active</p>
                  <p className="text-muted-foreground">
                    Your carousel will receive algorithm boost and priority placement
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading carousel...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={uploadCarousel}
            disabled={uploading || mediaFiles.length === 0}
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Post Carousel ({mediaFiles.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};