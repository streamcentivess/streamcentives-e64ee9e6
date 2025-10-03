import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useStories } from '@/hooks/useStories';
import { StoryViewer } from '@/components/StoryViewer';
import { StoryCreator } from '@/components/StoryCreator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const StoriesRing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stories, loading, trackView, refetch } = useStories();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  // Group stories by creator
  const groupedStories = stories.reduce((acc, story) => {
    const creatorId = story.creator_id;
    if (!acc[creatorId]) {
      acc[creatorId] = [];
    }
    acc[creatorId].push(story);
    return acc;
  }, {} as Record<string, typeof stories>);

  const creatorGroups = Object.entries(groupedStories).map(([creatorId, creatorStories]) => ({
    creatorId,
    stories: creatorStories,
    profile: creatorStories[0]?.profile
  }));

  const handleStoryClick = (creatorIndex: number) => {
    setSelectedStoryIndex(creatorIndex);
  };

  const handleCloseViewer = () => {
    setSelectedStoryIndex(null);
  };

  const handleCreateSuccess = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 px-4 py-4 overflow-x-auto scrollbar-hide">
        {/* Add Story Button */}
        <button
          onClick={() => setShowCreator(true)}
          className="flex flex-col items-center gap-2 min-w-[80px] group"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-xs text-center text-muted-foreground group-hover:text-primary transition-colors">
            Your Story
          </span>
        </button>

        {/* Story Rings */}
        {creatorGroups.slice(0, 10).map((group, index) => (
          <button
            key={group.creatorId}
            onClick={() => handleStoryClick(index)}
            className="flex flex-col items-center gap-2 min-w-[80px] group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-500 p-0.5">
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage src={group.profile?.avatar_url} />
                  <AvatarFallback>{group.profile?.display_name?.[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-center line-clamp-1 w-full group-hover:text-primary transition-colors">
              {group.creatorId === user?.id ? 'You' : group.profile?.display_name}
            </span>
          </button>
        ))}

        {/* View All Button */}
        {creatorGroups.length > 10 && (
          <button
            onClick={() => navigate('/stories')}
            className="flex flex-col items-center gap-2 min-w-[80px] group"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
              <span className="text-xs font-semibold">+{creatorGroups.length - 10}</span>
            </div>
            <span className="text-xs text-center text-muted-foreground group-hover:text-primary transition-colors">
              View All
            </span>
          </button>
        )}
      </div>

      {/* Story Viewer */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={creatorGroups[selectedStoryIndex]?.stories || []}
          onClose={handleCloseViewer}
          onView={trackView}
        />
      )}

      {/* Story Creator */}
      <StoryCreator
        open={showCreator}
        onOpenChange={setShowCreator}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};
