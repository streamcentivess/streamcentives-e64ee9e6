import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Story } from '@/hooks/useStories';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onView: (storyId: string) => void;
}

export const StoryViewer = ({ stories, initialIndex = 0, onClose, onView }: StoryViewerProps) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    if (!currentStory) return;

    onView(currentStory.id);
    setProgress(0);

    if (currentStory.media_type === 'video' && videoRef.current) {
      videoRef.current.play();
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

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Story Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
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

      {/* Header */}
      <div className="absolute top-12 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={currentStory.profile?.avatar_url} />
            <AvatarFallback>{currentStory.profile?.display_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold">{currentStory.profile?.display_name}</p>
            <p className="text-xs opacity-75">
              {new Date(currentStory.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-white p-2 hover:bg-white/10 rounded-full">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center">
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
            muted
            playsInline
            onEnded={nextStory}
          />
        )}

        {/* Navigation Areas */}
        <button
          onClick={previousStory}
          className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-4 opacity-0 hover:opacity-100"
          disabled={currentStoryIndex === 0}
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>

        <button
          onClick={togglePause}
          className="absolute left-1/3 right-1/3 top-0 bottom-0 flex items-center justify-center"
        >
          {isPaused && (
            <div className="bg-black/50 p-4 rounded-full">
              <Play className="h-8 w-8 text-white" />
            </div>
          )}
        </button>

        <button
          onClick={nextStory}
          className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-4 opacity-0 hover:opacity-100"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-8 left-4 right-4 text-white text-center">
          <p className="text-sm bg-black/50 px-4 py-2 rounded-lg">{currentStory.caption}</p>
        </div>
      )}
    </div>
  );
};
