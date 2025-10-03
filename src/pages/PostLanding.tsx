import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommentsDialog } from '@/components/CommentsDialog';
import { useSocialNotifications } from '@/hooks/useSocialNotifications';
import { useToast } from '@/hooks/use-toast';
import { HeartAnimation } from '@/components/ui/heart-animation';

interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  content_url: string | null;
  content_type: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
}

export default function PostLanding() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { createSocialNotification } = useSocialNotifications();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, user]);

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setShowSignUpPrompt(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const fetchPost = async () => {
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('user_id', postData.user_id)
        .single();

      const { count: likeCount } = await supabase
        .from('social_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('target_content_id', postId)
        .eq('interaction_type', 'like');

      const { count: commentCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      let isLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from('social_interactions')
          .select('id')
          .eq('target_content_id', postId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like')
          .maybeSingle();
        
        isLiked = !!likeData;
      }

      setPost({
        ...postData,
        profiles: profile,
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
        is_liked: isLiked
      } as Post);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      setShowSignUpPrompt(true);
      return;
    }

    if (!post) return;

    try {
      if (post.is_liked) {
        await supabase
          .from('social_interactions')
          .delete()
          .eq('target_content_id', post.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        setPost({
          ...post,
          is_liked: false,
          like_count: post.like_count - 1
        });
      } else {
        await supabase
          .from('social_interactions')
          .insert({
            user_id: user.id,
            target_content_id: post.id,
            target_user_id: post.user_id,
            interaction_type: 'like',
            content_type: 'post'
          });

        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);

        if (post.user_id !== user.id) {
          await createSocialNotification(
            post.user_id,
            'like',
            'post',
            post.id
          );
        }

        setPost({
          ...post,
          is_liked: true,
          like_count: post.like_count + 1
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleVideoEnded = () => {
    if (!user) {
      setVideoEnded(true);
      setShowSignUpPrompt(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div className="relative h-screen w-full">
        {post.content_type === 'video' ? (
          <video
            src={post.content_url || ''}
            className="absolute inset-0 w-full h-full object-cover"
            controls={!!user}
            autoPlay
            playsInline
            muted={!user}
            onEnded={handleVideoEnded}
          />
        ) : post.content_url ? (
          <img
            src={post.content_url}
            alt="Post content"
            className="max-h-screen w-auto object-contain"
          />
        ) : null}

        <div className="absolute bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-start gap-3 mb-4">
            <Avatar 
              className="h-12 w-12 cursor-pointer border-2 border-white"
              onClick={() => navigate(`/${post.profiles?.username || post.user_id}`)}
            >
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 
                className="font-bold text-white cursor-pointer hover:underline"
                onClick={() => navigate(`/${post.profiles?.username || post.user_id}`)}
              >
                {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
              </h3>
              <p className="text-sm text-white/80">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {post.caption && (
            <p className="text-white mb-4">{post.caption}</p>
          )}

          <div className="flex items-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" fill={post.is_liked ? "currentColor" : "none"} />
              <span>{post.like_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span>{post.comment_count}</span>
            </div>
          </div>
        </div>

        {user && (
          <div className="absolute right-4 bottom-32 flex flex-col gap-4">
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full h-14 w-14 bg-white/20 backdrop-blur hover:bg-white/30"
              onClick={handleLike}
            >
              <Heart className={`h-7 w-7 ${post.is_liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full h-14 w-14 bg-white/20 backdrop-blur hover:bg-white/30"
              onClick={() => setShowComments(true)}
            >
              <MessageCircle className="h-7 w-7 text-white" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full h-14 w-14 bg-white/20 backdrop-blur hover:bg-white/30"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Check out this post from ${post.profiles?.display_name}`,
                    url: window.location.href
                  });
                }
              }}
            >
              <Share2 className="h-7 w-7 text-white" />
            </Button>
          </div>
        )}

        {showSignUpPrompt && !user && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="max-w-md mx-4 p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Want to see more?</h2>
              <p className="text-muted-foreground mb-2">
                Join {post.profiles?.display_name || 'this creator'}'s community
              </p>
              <p className="text-lg mb-6">
                Sign up to like, comment, and connect with amazing creators
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate(`/auth/signup?returnTo=/post/${postId}`)}
                >
                  Sign Up Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/auth/signin?returnTo=/post/${postId}`)}
                >
                  Sign In
                </Button>
                {videoEnded && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowSignUpPrompt(false);
                      setVideoEnded(false);
                      const video = document.querySelector('video');
                      if (video) video.play();
                    }}
                  >
                    Watch Again
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {showHeartAnimation && <HeartAnimation isVisible={showHeartAnimation} />}
      </div>

      {user && (
        <CommentsDialog
          open={showComments}
          onOpenChange={setShowComments}
          postId={post.id}
          postOwnerId={post.user_id}
          onCommentAdded={fetchPost}
        />
      )}
    </div>
  );
}
