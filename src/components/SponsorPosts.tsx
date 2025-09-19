import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedRealtime } from "@/hooks/useOptimizedRealtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PostsGrid } from "@/components/PostsGrid";
import { Plus, Image, Video, AtSign, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SponsorPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [creators, setCreators] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    content: "",
    tagged_creators: []
  });

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchCreators();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_tags (
            tagged_user_id,
            profiles!post_tags_tagged_user_id_fkey (username, display_name)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      // Get creators from profiles (users who have created campaigns or are followed)
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .not('username', 'is', null)
        .limit(50);

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
    }
  };

  // Add real-time updates for posts
  useOptimizedRealtime({
    table: 'posts',
    filter: `user_id=eq.${user?.id}`,
    onUpdate: fetchPosts,
    enabled: !!user,
  });

  const parseCreatorTags = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    
    if (!matches) return [];
    
    return matches.map(match => {
      const username = match.substring(1); // Remove @
      return creators.find(c => c.username === username);
    }).filter(Boolean);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image or video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      let contentUrl = '';
      let contentType = 'text';

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        contentUrl = publicUrlData.publicUrl;
        contentType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          caption: formData.content,
          content_url: contentUrl,
          content_type: contentType,
          is_community_post: true, // Make sure sponsor posts appear in main feed
        }])
        .select()
        .single();

      if (postError) throw postError;

      // Parse and create creator tags
      const taggedCreators = parseCreatorTags(formData.content);
      
      if (taggedCreators.length > 0) {
        const tags = taggedCreators.map(creator => ({
          post_id: post.id,
          tagged_user_id: creator.user_id,
          tagged_by_user_id: user.id,
          tag_type: 'creator'
        }));

        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(tags);

        if (tagsError) console.error('Error creating tags:', tagsError);
      }

      toast({
        title: "Success!",
        description: "Post created successfully"
      });

      // Reset form and refresh posts
      setFormData({
        content: "",
        tagged_creators: []
      });
      handleRemoveFile();
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleTagCreator = (username: string) => {
    const currentContent = formData.content;
    const newContent = currentContent + (currentContent.endsWith(' ') ? '' : ' ') + `@${username} `;
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Post Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Social Feed</h2>
          <p className="text-muted-foreground">Share your partnerships and tag creators</p>
        </div>
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Post Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your latest partnership or announcement... Use @username to tag creators!"
                  rows={4}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Tip: Use @username to tag creators (e.g., @musicmaker)
                </p>
              </div>

              {/* Media Upload Section */}
              <div className="space-y-2">
                <Label>Upload Media (optional)</Label>
                {!selectedFile ? (
                  <div 
                    className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium mb-1">Upload Image or Video</p>
                    <p className="text-muted-foreground text-sm">
                      Click to select files (Max: 50MB)
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        Images
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Videos
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 z-10 h-6 w-6"
                        onClick={handleRemoveFile}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      {selectedFile.type.startsWith('video/') ? (
                        <video 
                          src={filePreview} 
                          controls 
                          className="w-full max-h-48 object-contain"
                        />
                      ) : (
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="w-full max-h-48 object-cover"
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Quick Creator Tag Buttons */}
              {creators.length > 0 && (
                <div className="space-y-2">
                  <Label>Quick Tag Creators</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {creators.slice(0, 10).map(creator => (
                      <Button
                        key={creator.user_id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTagCreator(creator.username)}
                      >
                        <AtSign className="h-3 w-3 mr-1" />
                        {creator.username}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreatePost(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts Feed */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Card key={post.id}>
              <CardContent className="p-4">
                {post.content_url && post.content_type === 'image' && (
                  <img 
                    src={post.content_url} 
                    alt="Post content" 
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                {post.content_url && post.content_type === 'video' && (
                  <video 
                    src={post.content_url} 
                    controls 
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <p className="text-sm mb-4">{post.caption}</p>
                {post.post_tags && post.post_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.post_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        @{tag.profiles?.username}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Share your partnerships and tag creators to showcase your collaborations
            </p>
            <Button onClick={() => setShowCreatePost(true)}>
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}