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

      console.log('Invoking edge function delete-story for', storyId);
      const { data, error } = await supabase.functions.invoke('delete-story', {
        body: { storyId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Story deletion error:', data.error);
        const errorMsg = data.error === 'Forbidden'
          ? 'You can only delete your own stories'
          : data.error === 'Story not found'
          ? 'Story not found'
          : data.error;
        throw new Error(errorMsg);
      }

      if (!data?.success) {
        throw new Error('Failed to delete story');
      }

      toast({
        title: 'Story deleted',
        description: 'Your story has been removed'
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : '';
      // Fallback: if the edge function is unavailable (not found), try client-side owner update
      const shouldFallback = message.includes('not found') || message.includes('404') || message.includes('delete-story');
      const isForbiddenOrMissing = message.includes('forbidden') || message.includes('story not found');

      if (user?.id && shouldFallback && !isForbiddenOrMissing) {
        console.warn('Edge function unavailable. Falling back to client-side update for', storyId);
        const { error: updateError } = await supabase
          .from('stories')
          .update({ is_active: false })
          .eq('id', storyId)
          .eq('creator_id', user.id);

        if (!updateError) {
          toast({ title: 'Story deleted', description: 'Your story has been removed' });
          return true;
        }

        console.error('Client-side deletion failed:', updateError);
      }

      console.error('Error deleting story:', err);
      toast({
        title: 'Failed to delete story',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive'
      });
      return false;
    }
  };

  return { createStory, deleteStory, uploading };
};
