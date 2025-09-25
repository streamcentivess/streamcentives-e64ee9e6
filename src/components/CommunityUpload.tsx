import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Video, 
  Image as ImageIcon, 
  X, 
  Sparkles,
  Send
} from 'lucide-react';

interface CommunityUploadProps {
  onUploadComplete?: () => void;
}

const CommunityUpload: React.FC<CommunityUploadProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image or video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;

    try {
      setUploading(true);

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      // Create post record with normalized content type
      let normalizedContentType = 'image'; // default
      
      // Map MIME types to database allowed values
      if (selectedFile.type.startsWith('image/')) {
        normalizedContentType = 'image';
      } else if (selectedFile.type.startsWith('video/')) {
        normalizedContentType = 'video';
      } else {
        // For other types, default to image
        normalizedContentType = 'image';
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content_url: publicUrlData.publicUrl,
          content_type: normalizedContentType,
          caption: caption || null,
          is_community_post: true,
          is_cross_posted: false
        });

      if (postError) throw postError;

      toast({
        title: "Posted Successfully! 🎉",
        description: "Your content has been shared with the community"
      });

      // Reset form
      setCaption('');
      handleRemoveFile();
      
      // Notify parent component
      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload your content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mb-6 border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg bg-gradient-primary bg-clip-text text-transparent">
            Share with Community
          </h3>
        </div>

        {!selectedFile ? (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Upload your content</p>
              <p className="text-muted-foreground text-sm">
                Drag and drop or click to select images or videos
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: 50MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Images
              </div>
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                Videos
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="relative rounded-xl overflow-hidden bg-black">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-8 w-8"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {selectedFile.type.startsWith('video/') ? (
                <video 
                  src={previewUrl || undefined} 
                  controls 
                  className="w-full max-h-64 object-contain"
                />
              ) : (
                <img 
                  src={previewUrl || undefined} 
                  alt="Preview" 
                  className="w-full max-h-64 object-cover"
                />
              )}
            </div>

            {/* Caption Input */}
            <Textarea
              placeholder="Add a caption to your post... ✨"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none"
              rows={3}
            />

            {/* Upload Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-white font-semibold"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Share with Community
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityUpload;