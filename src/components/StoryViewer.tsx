import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Heart, Share2, Send, Volume2, VolumeX } from 'lucide-react';
import { Story } from '@/hooks/useStories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCreateStory } from '@/hooks/useCreateStory';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onView: (storyId: string) => void;
  onDelete?: () => void;
}

export const StoryViewer = ({ stories, initialIndex = 0, onClose, onView, onDelete }: StoryViewerProps) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const { deleteStory } = useCreateStory();
  const { user } = useAuth();
  const currentStory = stories[currentStoryIndex];

  // Lock body scroll and pause background media
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Pause all background videos and audio
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    
    videos.forEach(v => {
      if (v !== videoRef.current) v.pause();
    });
    audios.forEach(a => a.pause());

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  useEffect(() => {
    if (!currentStory) return;

    onView(currentStory.id);
    setProgress(0);
    setReplyMessage('');
    setIsLiked(false);
    setShowSoundPrompt(false);

    if (currentStory.media_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.muted = false;
      video.volume = 1;
      
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay with sound blocked, fallback to muted
          video.muted = true;
          setIsMuted(true);
          setShowSoundPrompt(true);
          video.play().catch(() => {});
        });
      }
    }
  }, [currentStoryIndex]);

  useEffect(() => {
    if (isPaused || !currentStory) return;

    const duration = currentStory.duration_seconds * 1000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStoryIndex, isPaused]);

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      isPaused ? videoRef.current.play() : videoRef.current.pause();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    console.log('[StoryViewer] Deleting story:', currentStory.id);
    
    try {
      const success = await deleteStory(currentStory.id);
      console.log('[StoryViewer] Delete result:', success);
      
      if (success) {
        // Optimistic UI update - immediately close and notify parent
        setShowDeleteDialog(false);
        onDelete?.(); // Remove from parent's array first
        onClose(); // Then close viewer
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      setShowSoundPrompt(false);
    }
  };

  const handleLike = async () => {
    if (!user?.id || !currentStory || isLiked) return;
    
    setIsLiked(true);
    
    try {
      await supabase.from('social_interactions').insert({
        user_id: user.id,
        target_user_id: currentStory.creator_id,
        target_content_id: currentStory.id,
        content_type: 'story',
        interaction_type: 'like'
      });
      
      // Show a visual heart animation
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.style.cssText = 'position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(0); font-size: 4rem; z-index: 10000; pointer-events: none; animation: heartPop 0.6s ease-out forwards;';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 600);
      
      toast.success('Liked!');
    } catch (error) {
      console.error('Like error:', error);
      setIsLiked(false);
    }
  };

  const handleTapCenter = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300) {
      // Double tap detected
      handleLike();
    } else {
      // Single tap - toggle pause
      togglePause();
    }
    
    lastTapRef.current = now;
  };

  const handleShare = async () => {
    if (!currentStory) return;
    
    const shareData = {
      title: `Story by ${currentStory.profile?.display_name}`,
      text: currentStory.caption || 'Check out this story!',
      url: window.location.origin + `/stories/${currentStory.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        
        if (user?.id) {
          await supabase.from('social_interactions').insert({
            user_id: user.id,
            target_user_id: currentStory.creator_id,
            target_content_id: currentStory.id,
            content_type: 'story',
            interaction_type: 'share'
          });
        }
        toast.success('Shared!');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSendReply = async () => {
    if (!user?.id || !replyMessage.trim() || !currentStory) return;

    try {
      // Send as free DM request (0 XP cost)
      const { error: messageError } = await supabase.rpc('send_message_with_xp', {
        recipient_id_param: currentStory.creator_id,
        content_param: replyMessage.trim(),
        xp_cost_param: 0
      });
      
      if (messageError) throw messageError;
      
      // Best-effort insert into story_replies
      await supabase.from('story_replies').insert({
        story_id: currentStory.id,
        sender_id: user.id,
        recipient_id: currentStory.creator_id,
        message: replyMessage.trim()
      });
      
      toast.success('Reply sent!');
      setReplyMessage('');
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Failed to send reply');
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const isOwnStory = user?.id === currentStory?.creator_id;

  if (!currentStory) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Story Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 z-20 p-2 pointer-events-none" style={{ paddingTop: 'env(safe-area-inset-top, 0.5rem)' }}>
        {stories.map((_, index) => (
          <Progress
            key={index}
            value={
              index < currentStoryIndex ? 100 : index === currentStoryIndex ? progress : 0
            }
            className="h-1 flex-1"
          />
        ))}
      </div>

      {/* Header - Top Left (Rebuilt) */}
      <div
        className="absolute left-4 z-50 pointer-events-auto flex items-center gap-2"
        style={{ top: 'calc(env(safe-area-inset-top, 0.5rem) + 2.5rem)' }}
        onClickCapture={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            console.log('[StoryViewer] Close clicked');
            onClose();
          }}
          className="text-white p-2 hover:bg-white/10 rounded-full"
          aria-label="Close stories"
          title="Close"
        >
          <X className="h-6 w-6" />
        </button>
        {isOwnStory && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[StoryViewer] Delete icon clicked', currentStory.id);
              setShowDeleteDialog(true);
            }}
            disabled={isDeleting}
            aria-label="Delete story"
            title="Delete story"
            className="text-white p-2 hover:bg-white/10 rounded-full disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Header - Top Right (Profile) */}
      <div className="absolute right-4 z-50 pointer-events-auto flex items-center gap-3" style={{ top: 'calc(env(safe-area-inset-top, 0.5rem) + 2.5rem)' }} onClickCapture={(e) => e.stopPropagation()}>
        <div className="text-white text-right select-none">
          <p className="font-semibold text-sm">{currentStory.profile?.display_name}</p>
          <p className="text-xs opacity-75">{getRelativeTime(currentStory.created_at)}</p>
        </div>
        <Avatar className="h-10 w-10 border-2 border-white pointer-events-none">
          <AvatarImage src={currentStory.profile?.avatar_url} />
          <AvatarFallback>{currentStory.profile?.display_name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      {/* Story Content */}
      <div className={cn("absolute inset-0", showDeleteDialog && "pointer-events-none")}>
        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            onEnded={nextStory}
          />
        )}

        {/* Tap Navigation Areas */}
        <button
          onClick={previousStory}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          style={{ top: 'calc(env(safe-area-inset-top, 0.5rem) + 56px)' }}
          disabled={showDeleteDialog || currentStoryIndex === 0}
        />

        <button
          onClick={handleTapCenter}
          className="absolute left-1/3 right-1/3 top-0 bottom-0 z-10"
          style={{ top: 'calc(env(safe-area-inset-top, 0.5rem) + 56px)' }}
          disabled={showDeleteDialog}
        />

        <button
          onClick={nextStory}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          style={{ top: 'calc(env(safe-area-inset-top, 0.5rem) + 56px)' }}
          disabled={showDeleteDialog}
        />
      </div>

      {/* Volume Control */}
      {currentStory.media_type === 'video' && (
        <button
          onClick={toggleMute}
          className="absolute right-4 bottom-32 z-40 text-white p-3 bg-black/50 hover:bg-black/70 rounded-full"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 1rem) + 8rem)' }}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Sound Prompt */}
      {showSoundPrompt && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-black/75 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
          Tap for sound 🔊
        </div>
      )}

      {/* Bottom Interaction Bar */}
      {!isOwnStory && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 space-y-3"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}
        >
          {/* Caption */}
          {currentStory.caption && (
            <p className="text-white text-sm mb-2">{currentStory.caption}</p>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLike}
              className={cn(
                "text-white hover:bg-white/10 rounded-full",
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleShare}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <Share2 className="h-6 w-6" />
            </Button>

            <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Input
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Send message..."
                maxLength={500}
                className="bg-transparent border-0 text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSendReply}
                disabled={!replyMessage.trim()}
                className="text-white hover:bg-white/10 rounded-full h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Caption for own stories */}
      {isOwnStory && currentStory.caption && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/60 to-transparent text-white"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 2rem)' }}
        >
          <p className="text-sm select-none">{currentStory.caption}</p>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body
  );
};
