import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Image, 
  Video, 
  Mic, 
  Phone, 
  X, 
  Upload,
  Zap,
  Coins,
  AlertCircle,
  FileImage,
  FileVideo
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceChatInterface } from './VoiceChatInterface';

interface EnhancedMessageComposerProps {
  recipientId: string;
  recipientName: string;
  conversationId?: string;
  onMessageSent?: () => void;
  xpCost?: number;
}

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  url: string;
  uploadProgress: number;
  uploaded: boolean;
}

export const EnhancedMessageComposer: React.FC<EnhancedMessageComposerProps> = ({
  recipientId,
  recipientName,
  conversationId,
  onMessageSent,
  xpCost = 10
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchUserXP();
  }, [user]);

  const fetchUserXP = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_xp_balances')
        .select('xp_balance')
        .eq('user_id', user.id)
        .single();
      
      setUserXP(data?.xp_balance || 0);
    } catch (error) {
      console.error('Error fetching user XP:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a supported media file`);
        return;
      }

      // Check file size (50MB limit for videos, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Max size: ${isVideo ? '50MB' : '10MB'}`);
        return;
      }

      const mediaFile: MediaFile = {
        id: crypto.randomUUID(),
        file,
        type: isImage ? 'image' : 'video',
        url: URL.createObjectURL(file),
        uploadProgress: 0,
        uploaded: false
      };

      setMediaFiles(prev => [...prev, mediaFile]);
      uploadMediaFile(mediaFile);
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const uploadMediaFile = async (mediaFile: MediaFile) => {
    setIsUploading(true);
    
    try {
      const fileExt = mediaFile.file.name.split('.').pop();
      const fileName = `${user?.id}/messages/${Date.now()}-${Math.random()}.${fileExt}`;
      
      // Create a simulated upload with progress
      const uploadSimulation = setInterval(() => {
        setMediaFiles(prev => prev.map(file => 
          file.id === mediaFile.id 
            ? { ...file, uploadProgress: Math.min(file.uploadProgress + 10, 90) }
            : file
        ));
      }, 200);

      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, mediaFile.file);

      clearInterval(uploadSimulation);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      setMediaFiles(prev => prev.map(file => 
        file.id === mediaFile.id 
          ? { 
              ...file, 
              uploadProgress: 100, 
              uploaded: true,
              url: urlData.publicUrl 
            }
          : file
      ));

      toast.success(`${mediaFile.type === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error(`Failed to upload ${mediaFile.file.name}`);
      
      // Remove failed upload
      setMediaFiles(prev => prev.filter(file => file.id !== mediaFile.id));
    } finally {
      setIsUploading(false);
    }
  };

  const removeMediaFile = (fileId: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleSendMessage = async () => {
    if (!user || (!message.trim() && mediaFiles.length === 0)) {
      toast.error('Please enter a message or attach media');
      return;
    }

    // Check if user has enough XP
    if (userXP < xpCost) {
      toast.error(`Insufficient XP. You need ${xpCost} XP to send this message.`);
      return;
    }

    // Check if any files are still uploading
    if (mediaFiles.some(file => !file.uploaded)) {
      toast.error('Please wait for all files to finish uploading');
      return;
    }

    setIsSending(true);

    try {
      // Prepare media URLs
      const mediaUrls = mediaFiles.map(file => file.url);
      const mediaTypes = mediaFiles.map(file => file.type);

      // Send message to database
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          conversation_id: conversationId || crypto.randomUUID(),
          content: message.trim(),
          xp_cost: xpCost,
          status: 'pending', // Messages go to requests first
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          media_types: mediaTypes.length > 0 ? mediaTypes : null
        });

      if (error) throw error;

      // Deduct XP from user
      await supabase.functions.invoke('update-user-xp', {
        body: {
          userId: user.id,
          xpAmount: -xpCost
        }
      });

      toast.success('Message sent to requests! It will appear in their inbox if approved.');
      
      // Reset form
      setMessage('');
      setMediaFiles([]);
      setUserXP(prev => prev - xpCost);
      
      if (onMessageSent) {
        onMessageSent();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setMessage(prev => prev ? `${prev} ${text}` : text);
    setShowVoiceRecorder(false);
  };

  const hasInsufficientXP = userXP < xpCost;
  const canSend = (message.trim() || mediaFiles.length > 0) && 
                 !isUploading && 
                 !isSending && 
                 !hasInsufficientXP &&
                 mediaFiles.every(file => file.uploaded);

  if (showVoiceChat) {
    return (
      <div className="space-y-4">
        <VoiceChatInterface
          conversationId={conversationId || ''}
          recipientName={recipientName}
          onEndCall={() => setShowVoiceChat(false)}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* XP Cost Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={hasInsufficientXP ? "destructive" : "secondary"}>
              <Coins className="h-3 w-3 mr-1" />
              Cost: {xpCost} XP
            </Badge>
            <Badge variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              Balance: {userXP} XP
            </Badge>
          </div>
          
          {hasInsufficientXP && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              Insufficient XP
            </div>
          )}
        </div>

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <VoiceRecorder 
                onTranscription={handleVoiceTranscription}
                showTranscription={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Media Files */}
        {mediaFiles.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Attachments ({mediaFiles.length})</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mediaFiles.map((file) => (
                <div key={file.id} className="relative border rounded-lg overflow-hidden">
                  {file.type === 'image' ? (
                    <img 
                      src={file.url} 
                      alt="Upload preview"
                      className="w-full h-20 object-cover"
                    />
                  ) : (
                    <div className="w-full h-20 bg-muted flex items-center justify-center">
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMediaFile(file.id)}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {!file.uploaded && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                      <Progress value={file.uploadProgress} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${recipientName}...`}
            className="min-h-[100px] resize-none"
            disabled={isSending}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              disabled={isSending}
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceChat(true)}
              disabled={isSending}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!canSend}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isSending ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>

        {/* Cost Notice */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          💡 Messages cost {xpCost} XP and go to requests first. If approved, you can continue chatting for free!
        </div>
      </CardContent>
    </Card>
  );
};