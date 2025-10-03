import { useState, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useStories } from '@/hooks/useStories';
import { StoryViewer } from '@/components/StoryViewer';
import { StoryCreator } from '@/components/StoryCreator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Stories = () => {
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Stories</h1>
            </div>
            <Button
              onClick={() => setShowCreator(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {creatorGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No stories available</p>
            <Button onClick={() => setShowCreator(true)}>
              Create your first story
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {creatorGroups.map((group, index) => (
              <button
                key={group.creatorId}
                onClick={() => handleStoryClick(index)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-500 p-0.5">
                    <Avatar className="w-full h-full border-2 border-background">
                      <AvatarImage src={group.profile?.avatar_url} />
                      <AvatarFallback>{group.profile?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  {group.creatorId === user?.id && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                      <Plus className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-center line-clamp-1 w-full group-hover:text-primary transition-colors">
                  {group.creatorId === user?.id ? 'Your Story' : group.profile?.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Story Viewer */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={creatorGroups[selectedStoryIndex]?.stories || []}
          onClose={handleCloseViewer}
          onView={trackView}
          onDelete={refetch}
        />
      )}

      {/* Story Creator */}
      <StoryCreator
        open={showCreator}
        onOpenChange={setShowCreator}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default Stories;
