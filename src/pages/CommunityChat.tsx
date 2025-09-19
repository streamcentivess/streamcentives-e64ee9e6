import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Image, Heart, MessageSquare, Share, Pin, Camera, X, Users, MapPin } from 'lucide-react';
import AppNavigation from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CommunityChat = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'posts'>('posts');
  const [loading, setLoading] = useState(false);

  // Post form state
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    photos: [] as File[],
    location: ''
  });

  useEffect(() => {
    if (communityId && user) {
      fetchCommunity();
      fetchPosts();
      setupRealtimeSubscriptions();
    }
  }, [communityId, user]);

  const fetchCommunity = async () => {
    if (!communityId) return;
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();
      
      if (error) throw error;
      setCommunity(data);
    } catch (error) {
      console.error('Error fetching community:', error);
      toast({
        title: "Error",
        description: "Failed to load community",
        variant: "destructive"
      });
    }
  };

  const fetchPosts = async () => {
    if (!communityId) return;
    
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!communityId) return;

    const postsChannel = supabase
      .channel(`community-posts-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB per file
    
    const processedFiles = validFiles.filter(file => {
      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 20MB. Please choose a smaller file.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });
    
    setPostForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...processedFiles].slice(0, 4)
    }));
  };

  const removePhoto = (index: number) => {
    setPostForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim() || !user || !communityId) {
      toast({
        title: "Error",
        description: "Please fill in title and content",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = [];
      
      // Upload media files if any
      if (postForm.photos.length > 0) {
        const uploads = postForm.photos.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `community-posts/${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('community-media')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('community-media')
              .getPublicUrl(filePath);
            return publicUrl;
          }
        });
        const results = await Promise.all(uploads);
        mediaUrls = results.filter((u): u is string => !!u);
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          community_id: communityId,
          title: postForm.title.trim(),
          content: postForm.content.trim(),
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          location: postForm.location.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Post created successfully"
      });
      
      setPostForm({
        title: '',
        content: '',
        photos: [],
        location: ''
      });
      setShowPostDialog(false);
      fetchPosts();
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/community-hub')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              {community.name}
            </h1>
            <p className="text-muted-foreground">{community.description}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button
            variant={activeTab === 'posts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('posts')}
          >
            <Image className="h-4 w-4 mr-2" />
            Posts
          </Button>
          <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 ml-auto">
                <Camera className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Community Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="post-title">Post Title</Label>
                  <Input 
                    id="post-title" 
                    placeholder="Enter post title"
                    value={postForm.title}
                    onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="post-content">Content</Label>
                  <Textarea 
                    id="post-content" 
                    placeholder="What's on your mind?" 
                    rows={4}
                    value={postForm.content}
                    onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <Label>Photos & Videos (Max 4)</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="media-upload"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('media-upload')?.click()}
                        disabled={postForm.photos.length >= 4}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Add Media
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {postForm.photos.length}/4 files
                      </span>
                    </div>
                    
                    {postForm.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {postForm.photos.map((file, index) => (
                          <div key={index} className="relative">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md"
                              />
                            ) : (
                              <div className="relative">
                                <video
                                  src={URL.createObjectURL(file)}
                                  className="w-full h-20 object-cover rounded-md"
                                  controls={false}
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                  <div className="text-white text-xs bg-black/70 px-2 py-1 rounded">
                                    Video
                                  </div>
                                </div>
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removePhoto(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="post-location">Location (Optional)</Label>
                  <Input 
                    id="post-location" 
                    placeholder="Add a location..."
                    value={postForm.location}
                    onChange={(e) => setPostForm({...postForm, location: e.target.value})}
                  />
                </div>
                
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  onClick={handleCreatePost}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <Card className="h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Community Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Real-time chat coming soon!</p>
                    <p className="text-sm">Use posts to share photos and start discussions for now.</p>
                  </div>
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Real-time chat coming soon..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled
                    />
                    <Button disabled>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="card-modern">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback>
                            {post.profiles?.display_name?.charAt(0) || post.profiles?.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{post.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>by @{post.profiles?.username}</span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {post.is_pinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{post.content}</p>
                    
                    {/* Media Display */}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {post.media_urls.slice(0, 4).map((url: string, index: number) => {
                          const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm');
                          return isVideo ? (
                            <video
                              key={index}
                              src={url}
                              className="w-full h-32 object-cover rounded-md cursor-pointer"
                              controls
                              preload="metadata"
                            />
                          ) : (
                            <img
                              key={index}
                              src={url}
                              alt={`Post media ${index + 1}`}
                              className="w-full h-32 object-cover rounded-md cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Location */}
                    {post.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-3 w-3" />
                        {post.location}
                      </div>
                    )}
                    
                    {/* Post Actions */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-primary">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-primary">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-primary">
                        <Share className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityChat;