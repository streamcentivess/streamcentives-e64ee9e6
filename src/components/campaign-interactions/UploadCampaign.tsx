import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Check, FileVideo, Image as ImageIcon, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UploadCampaignProps {
  campaign: any;
  onComplete: () => void;
}

export const UploadCampaign = ({ campaign, onComplete }: UploadCampaignProps) => {
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploadRequirements, setUploadRequirements] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUploadRequirements();
  }, [campaign.id]);

  const fetchUploadRequirements = async () => {
    // Get upload requirements from campaign assets
    const { data } = await supabase
      .from('campaign_assets')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('asset_type', 'upload_template')
      .single();

    if (data) {
      setUploadRequirements(data.asset_data);
    } else {
      // Default requirements
      setUploadRequirements({
        allowed_types: ['image', 'video'],
        max_size_mb: 50,
        description: campaign.description || "Upload your content for this campaign",
        instructions: "Show yourself doing the action mentioned in the campaign title"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > (uploadRequirements?.max_size_mb || 50) * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: `File must be smaller than ${uploadRequirements?.max_size_mb || 50}MB`,
        variant: "destructive"
      });
      return;
    }

    // Check file type
    const allowedTypes = uploadRequirements?.allowed_types || ['image', 'video'];
    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 'other';
    
    if (!allowedTypes.includes(fileType)) {
      toast({
        title: "Invalid File Type",
        description: `Only ${allowedTypes.join(', ')} files are allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "File Required",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `campaign-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, uploadedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      // Complete campaign
      const { data, error } = await supabase.rpc('complete_campaign_interaction', {
        campaign_id_param: campaign.id,
        interaction_data_param: {
          type: 'upload',
          file_url: publicUrl,
          file_name: uploadedFile.name,
          file_type: uploadedFile.type,
          description: description,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      const result = data as { success: boolean; xp_awarded: number; error?: string };
      if (result.success) {
        setCompleted(true);
        toast({
          title: "Upload Successful!",
          description: `You've earned ${result.xp_awarded} XP for completing this upload campaign!`
        });
        onComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    if (file.type.startsWith('video/')) return <FileVideo className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  if (completed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Upload Complete!</h3>
          <p className="text-green-600">Your submission has been received and the campaign is completed!</p>
        </CardContent>
      </Card>
    );
  }

  if (!uploadRequirements) {
    return <div className="animate-pulse">Loading upload requirements...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Instructions</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {uploadRequirements.instructions}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload File</label>
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to select file or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max size: {uploadRequirements.max_size_mb}MB | 
                Types: {uploadRequirements.allowed_types.join(', ')}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept={uploadRequirements.allowed_types.includes('image') ? 'image/*' : '' + 
                     uploadRequirements.allowed_types.includes('video') ? ',video/*' : ''}
            />
          </div>

          {uploadedFile && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadedFile)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Add a description for your submission..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleUpload}
            disabled={uploading || !uploadedFile}
            className="w-full"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Submit Upload & Complete Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};