import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useCreateStory = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', file.type.startsWith('video') ? 'video' : 'image');

      const { data, error } = await supabase.functions.invoke('upload-story-media', {
        body: formData
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload media file',
        variant: 'destructive'
      });
      return null;
    }
  };

  const createStory = async (
    file: File,
    caption?: string,
    duration?: number
  ): Promise<boolean> => {
    setUploading(true);
    try {
      const mediaUrl = await uploadMedia(file);
      if (!mediaUrl) return false;

      const mediaType = file.type.startsWith('video') ? 'video' : 'image';

      const { data, error } = await supabase.functions.invoke('create-story', {
        body: {
          mediaUrl,
          mediaType,
          caption,
          durationSeconds: duration || (mediaType === 'video' ? 15 : 5)
        }
      });

      if (error) throw error;

      toast({
        title: 'Story created',
        description: 'Your story has been posted successfully'
      });

      return true;
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: 'Failed to create story',
        description: 'Please try again',
        variant: 'destructive'
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteStory = async (storyId: string): Promise<boolean> => {
    try {
      if (!user?.id) {
        toast({
          title: 'Not authenticated',
          description: 'You must be logged in to delete a story',
          variant: 'destructive'
        });
        return false;
      }

      const { data, error } = await supabase
        .from('stories')
        .update({ is_active: false })
        .eq('id', storyId)
        .eq('creator_id', user.id)
        .select('id')
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Story not found or you do not have permission to delete it');
      }

      toast({
        title: 'Story deleted',
        description: 'Your story has been removed'
      });

      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: 'Failed to delete story',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      return false;
    }
  };

  return { createStory, deleteStory, uploading };
};
