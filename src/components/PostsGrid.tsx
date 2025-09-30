import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Play, Plus, Share2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ShareButton } from './ShareButton';
import { UniversalShareButton } from './UniversalShareButton';
import { ClickableMentions } from './ui/clickable-mentions';
import { useNavigate } from 'react-router-dom';
import CrossPostToggle from './CrossPostToggle';

interface Post {
  id: string;
  user_id: string;
  content_type: 'image' | 'video';
  content_url: string;
  caption: string;
  created_at: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
  post_likes: { id: string; user_id: string }[];
  post_comments: { 
    id: string; 
    content: string; 
    user_id: string;
    profiles: { display_name: string; username: string; avatar_url: string };
  }[];
}

interface PostsGridProps {
  userId: string;
  isOwnProfile: boolean;
}

export const PostsGrid: React.FC<PostsGridProps> = ({ userId, isOwnProfile }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const fetchPosts = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch user profile using safe function
      const { data: profileData, error: profileError } = await supabase.rpc('get_public_profile_safe', { 
        target_user_id: userId 
      });
      const userProfile = profileData?.[0];

      if (profileError) throw profileError;

      // Fetch likes and comments for each post
      const postsWithData = await Promise.all(
        (postsData || []).map(async (post) => {
          // Fetch likes
          const { data: likes } = await supabase
            .from('post_likes')
            .select('id, user_id')
            .eq('post_id', post.id);

          // Fetch comments
          const { data: comments } = await supabase
            .from('post_comments')
            .select('id, content, user_id')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          // Fetch profiles for comment authors
          const commentsWithProfiles = await Promise.all(
            (comments || []).map(async (comment) => {
              const { data: commentProfileResult } = await supabase.rpc('get_public_profile_safe', { 
                target_user_id: comment.user_id 
              });
              const commentProfile = commentProfileResult?.[0];

              return {
                ...comment,
                profiles: commentProfile || { display_name: 'Unknown', username: 'unknown', avatar_url: '' }
              };
            })
          );

          const profileSafe = userProfile || { display_name: 'Unknown', username: 'unknown', avatar_url: '' };

          return {
            ...post,
            content_type: post.content_type as 'image' | 'video',
            profiles: profileSafe,
            post_likes: likes || [],
            post_comments: commentsWithProfiles as any
          };
        })
      );

      setPosts(postsWithData as unknown as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    const userHasLiked = post?.post_likes.some(like => like.user_id === user.id);

    try {
      if (userHasLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });
      
      setNewComment('');
      fetchPosts();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
      
      setSelectedPost(null);
      fetchPosts();
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleProfileClick = (username: string) => {
    navigate(`/${username}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        {isOwnProfile ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">No posts yet. Share your first moment!</p>
            <CreatePostModal onPostCreated={fetchPosts} />
          </div>
        ) : (
          <p className="text-muted-foreground">No posts to display</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwnProfile && (
        <div className="flex justify-center">
          <CreatePostModal onPostCreated={fetchPosts} />
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {posts.map((post) => (
          <div
            key={post.id}
            className="aspect-square relative cursor-pointer group"
            onClick={() => setSelectedPost(post)}
          >
            {post.content_type === 'video' ? (
              <div className="relative w-full h-full">
                <video 
                  src={post.content_url} 
                  className="w-full h-full object-cover rounded"
                  muted
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </div>
            ) : (
              <img 
                src={post.content_url} 
                alt={post.caption || 'Post'} 
                className="w-full h-full object-cover rounded"
              />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center space-x-4 text-white">
                <div className="flex items-center space-x-1">
                  <Heart className="h-5 w-5" />
                  <span>{post.post_likes.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.post_comments.length}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Media */}
              <div className="aspect-square">
                {selectedPost.content_type === 'video' ? (
                  <video 
                    src={selectedPost.content_url} 
                    controls 
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <img 
                    src={selectedPost.content_url} 
                    alt={selectedPost.caption || 'Post'} 
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={selectedPost.profiles.avatar_url || '/placeholder.svg'} 
                    alt={selectedPost.profiles.display_name}
                    className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleProfileClick(selectedPost.profiles.username)}
                  />
                  <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleProfileClick(selectedPost.profiles.username)}>
                    <h3 className="font-semibold">{selectedPost.profiles.display_name}</h3>
                    <p className="text-sm text-muted-foreground">@{selectedPost.profiles.username}</p>
                  </div>
                </div>

                {selectedPost.caption && (
                  <ClickableMentions text={selectedPost.caption} className="text-sm" />
                )}

                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(selectedPost.id)}
                    className={`p-2 ${selectedPost.post_likes.some(like => like.user_id === user?.id) ? 'text-red-500' : ''}`}
                  >
                    <Heart className="h-5 w-5" />
                    <span className="ml-1">{selectedPost.post_likes.length}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="ml-1">{selectedPost.post_comments.length}</span>
                  </Button>
                  <UniversalShareButton
                    type="post"
                    itemId={selectedPost.id}
                    title={selectedPost.caption || 'Post'}
                    description={selectedPost.caption}
                    creatorName={selectedPost.profiles.display_name}
                    isOwnContent={selectedPost.user_id === user?.id}
                    customUrl={`${window.location.origin}/post/${selectedPost.id}`}
                    imageUrl={selectedPost.content_url}
                  />
                  {selectedPost.user_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePost(selectedPost.id)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Comments */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedPost.post_comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <img 
                        src={comment.profiles.avatar_url || '/placeholder.svg'} 
                        alt={comment.profiles.display_name}
                        className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleProfileClick(comment.profiles.username)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span 
                            className="font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleProfileClick(comment.profiles.username)}
                          >
                            {comment.profiles.display_name}
                          </span>
                        </div>
                        <ClickableMentions text={comment.content} className="text-sm" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                {user && (
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 min-h-[40px] max-h-[100px]"
                    />
                    <Button 
                      onClick={() => addComment(selectedPost.id)}
                      disabled={!newComment.trim()}
                    >
                      Post
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const CreatePostModal: React.FC<{ onPostCreated: () => void }> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [crossPostToCommunity, setCrossPostToCommunity] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        toast.error('Please select an image or video file');
        return;
      }
      
      // Check video duration (5 minute limit)
      if (selectedFile.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          if (video.duration > 300) { // 5 minutes = 300 seconds
            toast.error('Video must be 5 minutes or less');
            return;
          }
          setFile(selectedFile);
        };
        video.src = URL.createObjectURL(selectedFile);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('posts').getPublicUrl(fileName);

      // Create posts based on user's cross-posting preference
      const postsToInsert = [];
      
      // Always create a personal profile post
      postsToInsert.push({
        user_id: user.id,
        content_type: file.type.startsWith('video/') ? 'video' : 'image',
        content_url: data.publicUrl,
        caption: caption.trim() || null,
        is_community_post: false,
        is_cross_posted: crossPostToCommunity
      });

      // If cross-posting is enabled, also create a community post
      if (crossPostToCommunity) {
        postsToInsert.push({
          user_id: user.id,
          content_type: file.type.startsWith('video/') ? 'video' : 'image',
          content_url: data.publicUrl,
          caption: caption.trim() || null,
          is_community_post: true,
          is_cross_posted: true
        });
      }

      // Insert all posts
      await supabase.from('posts').insert(postsToInsert);

      const successMessage = crossPostToCommunity 
        ? 'Posts created successfully! Shared on your profile and community feed! 🎉'
        : 'Post created successfully!';
      
      toast.success(successMessage);
      setIsOpen(false);
      setCaption('');
      setFile(null);
      setCrossPostToCommunity(false);
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create New Post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Photo or Video
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Videos must be 5 minutes or less
            </p>
          </div>
          
          {file && (
            <div className="border rounded p-4">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.type.startsWith('video/') ? 'Video' : 'Image'} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Caption (Optional)
            </label>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="border-t pt-4">
            <CrossPostToggle
              enabled={crossPostToCommunity}
              onChange={setCrossPostToCommunity}
              disabled={uploading}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};