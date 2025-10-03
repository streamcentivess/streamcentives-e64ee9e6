import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';

interface Highlight {
  id: string;
  title: string;
  cover_image_url: string | null;
  items: number;
}

export function StoryHighlightsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHighlights();
    }
  }, [user]);

  const fetchHighlights = async () => {
    try {
      const { data: highlightsData } = await supabase
        .from('story_highlights')
        .select(`
          id,
          title,
          cover_image_url,
          items:story_highlight_items(count)
        `)
        .eq('creator_id', user?.id)
        .order('sort_order', { ascending: true });

      if (highlightsData) {
        const formatted = highlightsData.map((h: any) => ({
          ...h,
          items: h.items?.[0]?.count || 0
        }));
        setHighlights(formatted);
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHighlight = async () => {
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from('story_highlights')
        .insert({
          creator_id: user?.id,
          title: newTitle.trim()
        });

      if (error) throw error;

      toast({
        title: 'Highlight Created',
        description: 'Your new highlight collection has been created'
      });

      setNewTitle('');
      fetchHighlights();
    } catch (error: any) {
      console.error('Error creating highlight:', error);
      toast({
        title: 'Error',
        description: 'Failed to create highlight',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteHighlight = async (id: string) => {
    if (!confirm('Delete this highlight? All stories in it will be removed.')) return;

    try {
      const { error } = await supabase
        .from('story_highlights')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Highlight Deleted',
        description: 'The highlight has been removed'
      });

      fetchHighlights();
    } catch (error: any) {
      console.error('Error deleting highlight:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete highlight',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading highlights...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Story Highlights</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Highlight
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Highlight</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Highlight title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={50}
                />
                <Button
                  onClick={createHighlight}
                  disabled={creating || !newTitle.trim()}
                  className="w-full"
                >
                  Create Highlight
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {highlights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No highlights yet</p>
            <p className="text-sm">Create collections of your favorite stories</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {highlights.map((highlight) => (
              <div
                key={highlight.id}
                className="relative group rounded-lg overflow-hidden border"
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {highlight.cover_image_url ? (
                    <img
                      src={highlight.cover_image_url}
                      alt={highlight.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">📚</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold truncate">{highlight.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {highlight.items} {highlight.items === 1 ? 'story' : 'stories'}
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => deleteHighlight(highlight.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
