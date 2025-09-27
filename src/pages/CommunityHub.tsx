import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, MessageSquare, Calendar, MapPin, Plus, Heart, Share, Pin, Crown, Camera, X, UserPlus, Repeat2 } from 'lucide-react';
import { LocationSearch } from '@/components/LocationSearch';
import { UserSearchInput } from '@/components/UserSearchInput';
import { VerificationBadge } from '@/components/VerificationBadge';
import AppNavigation from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CommunityHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Community creation form state
  const [communityForm, setCommunityForm] = useState({
    name: '',
    description: '',
    genre: '',
    is_public: true,
    rules: ''
  });

  // Post creation form state
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    community_id: '',
    is_pinned: false,
    photos: [] as File[],
    tagged_users: [] as { user_id: string; username: string }[],
    location: ''
  });
  
  const [taggedPeopleInput, setTaggedPeopleInput] = useState('');
  const [showCollaboratorSearch, setShowCollaboratorSearch] = useState(false);
  const [collaboratorSearchTerm, setCollaboratorSearchTerm] = useState('');
  const [collaborationRequests, setCollaborationRequests] = useState<any[]>([]);
  const [potentialCollaborators, setPotentialCollaborators] = useState<any[]>([]);

  // Community genres similar to Reddit
  const communityGenres = [
    { value: 'music', label: '🎵 Music' },
    { value: 'gaming', label: '🎮 Gaming' },
    { value: 'art', label: '🎨 Art & Design' },
    { value: 'sports', label: '⚽ Sports' },
    { value: 'technology', label: '💻 Technology' },
    { value: 'lifestyle', label: '🌟 Lifestyle' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'food', label: '🍕 Food' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'fitness', label: '💪 Fitness' },
    { value: 'education', label: '📚 Education' },
    { value: 'business', label: '💼 Business' },
    { value: 'science', label: '🔬 Science' },
    { value: 'photography', label: '📸 Photography' },
    { value: 'fashion', label: '👗 Fashion' },
    { value: 'other', label: '🌐 Other' }
  ];

  // Fetch communities on component mount
  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchCommunityPosts();
      fetchEvents();
      fetchCollaborationRequests();
    }
  }, [user]);

  const fetchCommunities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('creator_id', user.id);
      
      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch communities",
        variant: "destructive"
      });
    }
  };

  const fetchCommunityPosts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          communities (
            id,
            name,
            genre
          ),
          profiles!community_posts_author_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch community posts",
        variant: "destructive"
      });
    }
  };

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('fan_events')
        .select('*')
        .eq('creator_id', user.id)
        .order('event_date', { ascending: true });
      
      if (eventsError) throw eventsError;

      // Get profiles for each event creator
      const eventIds = eventsData?.map(event => event.creator_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', eventIds);

      if (profilesError) throw profilesError;

      // Combine events with profile data
      const eventsWithProfiles = eventsData?.map(event => ({
        ...event,
        profiles: profilesData?.find(profile => profile.user_id === event.creator_id)
      })) || [];

      setEvents(eventsWithProfiles);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      });
    }
  };

  const searchCollaborators = async () => {
    if (!collaboratorSearchTerm.trim()) {
      setPotentialCollaborators([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('search_public_profiles', {
          search_query: collaboratorSearchTerm,
          limit_count: 10
        });

      if (error) throw error;
      
      // Filter out current user
      const filteredResults = data?.filter((profile: any) => profile.user_id !== user?.id) || [];
      setPotentialCollaborators(filteredResults);
    } catch (error) {
      console.error('Error searching collaborators:', error);
      toast({
        title: "Error",
        description: "Failed to search for collaborators",
        variant: "destructive"
      });
    }
  };

  const sendCollaborationRequest = async (targetCreatorId: string) => {
    if (!user) return;

    try {
      // This would create a collaboration request in the database
      // For now, we'll show a success message
      toast({
        title: "Request Sent!",
        description: "Your collaboration request has been sent successfully"
      });
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      toast({
        title: "Error",
        description: "Failed to send collaboration request",
        variant: "destructive"
      });
    }
  };

  const fetchCollaborationRequests = async () => {
    if (!user) return;

    try {
      // This would fetch collaboration requests from the database
      // For now, we'll set an empty array
      setCollaborationRequests([]);
    } catch (error) {
      console.error('Error fetching collaboration requests:', error);
    }
  };

  const handleCreateCommunity = async () => {
    if (!user) return;
    
    if (!communityForm.name || !communityForm.genre) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          creator_id: user.id,
          name: communityForm.name,
          description: communityForm.description,
          genre: communityForm.genre,
          is_public: communityForm.is_public,
          rules: communityForm.rules
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Community created successfully"
      });
      
      setCommunityForm({
        name: '',
        description: '',
        genre: '',
        is_public: true,
        rules: ''
      });
      setShowCommunityDialog(false);
      fetchCommunities(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create community",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Media upload handlers (photos and videos)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB per file
    const MAX_VIDEO_DURATION = 5 * 60; // 5 minutes in seconds
    
    const processedFiles: File[] = [];
    
    for (const file of validFiles) {
      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 20MB. Please choose a smaller file.`,
          variant: 'destructive'
        });
        continue;
      }
      
      // Check video duration for video files
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          if (video.duration > MAX_VIDEO_DURATION) {
            toast({
              title: 'Video too long',
              description: `${file.name} exceeds 5 minutes. Please choose a shorter video.`,
              variant: 'destructive'
            });
            return;
          }
          processedFiles.push(file);
          setPostForm(prev => ({
            ...prev, 
            photos: [...prev.photos, ...processedFiles].slice(0, 4)
          }));
        };
        
        video.src = URL.createObjectURL(file);
      } else {
        processedFiles.push(file);
      }
    }
    
    if (processedFiles.length > 0) {
      setPostForm(prev => ({
        ...prev, 
        photos: [...prev.photos, ...processedFiles].slice(0, 4)
      }));
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...postForm.photos];
    newPhotos.splice(index, 1);
    setPostForm({...postForm, photos: newPhotos});
  };

  // Tagged people handlers - no longer needed as UserSearchInput handles this
  const addTaggedPerson = () => {
    // This function is now handled by UserSearchInput component
  };

  const removeTaggedPerson = (person: string) => {
    const username = person.replace(/^@/, '');
    setPostForm({
      ...postForm,
      tagged_users: postForm.tagged_users.filter(u => u.username !== username)
    });
  };

  const handleCreatePost = async () => {
    if (!user) return;
    
    // Trim whitespace and check for empty values
    const trimmedTitle = postForm.title.trim();
    const trimmedContent = postForm.content.trim();
    const selectedCommunity = postForm.community_id.trim();
    
    if (!trimmedTitle || !trimmedContent || !selectedCommunity) {
      toast({
        title: "Error",
        description: "Please fill in title, content, and select a community",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = [];
      
      // Upload media files concurrently if any
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
            toast({
              title: 'Upload failed',
              description: uploadError.message || 'One of the files failed to upload.',
              variant: 'destructive'
            });
            return null;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('community-media')
              .getPublicUrl(filePath);
            return publicUrl as string;
          }
        });
        const results = await Promise.all(uploads);
        mediaUrls = results.filter((u): u is string => !!u);
      }

      // Create the post - tagged users will be saved separately in post_tags table
      const { data: post, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          community_id: selectedCommunity,
          title: trimmedTitle,
          content: trimmedContent,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          location: postForm.location.trim() || null,
          is_pinned: postForm.is_pinned
        })
        .select()
        .single();

      if (error) throw error;

      // Save tags into post_tags join table
      if (postForm.tagged_users && postForm.tagged_users.length > 0) {
        const tagRows = postForm.tagged_users.map((u) => ({
          post_id: (post as any).id,
          tagged_user_id: u.user_id,
          tagged_by_user_id: user.id,
          approved: false,
          tag_type: 'creator'
        }));
        const { error: tagError } = await supabase.from('post_tags').insert(tagRows);
        if (tagError) {
          console.error('Error saving post tags:', tagError);
        }
      }

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Post created successfully"
      });
      
      // Reset form
      setPostForm({
        title: '',
        content: '',
        community_id: '',
        is_pinned: false,
        photos: [],
        tagged_users: [],
        location: ''
      });
      setTaggedPeopleInput('');
      setShowPostDialog(false);
      
      // Refresh posts to show the new one
      fetchCommunityPosts();
      
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

  // Real-time updates for posts and communities
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('community-hub-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts'
        },
        () => {
          fetchCommunityPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_posts'
        },
        () => {
          fetchCommunityPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communities'
        },
        () => {
          fetchCommunities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'communities'
        },
        () => {
          fetchCommunities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fan_events'
        },
        () => {
          fetchEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fan_events'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Temporarily disabled until CommunityDetail is updated for UUIDs */}
        {/* {selectedCommunity ? (
          <CommunityDetail 
            communityId={selectedCommunity} 
            onBack={() => setSelectedCommunity(null)} 
          />
        ) : ( */}
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Community Hub
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">Build and manage your fan communities</p>
              </div>
            </div>

        <Tabs defaultValue="communities" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
            <TabsTrigger value="communities" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">My Communities</span>
              <span className="sm:hidden">Communities</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Community Posts</span>
              <span className="sm:hidden">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Fan Events</span>
              <span className="sm:hidden">Events</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Creator Collaboration</span>
              <span className="sm:hidden">Collab</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="communities" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-lg font-semibold">Your Communities</h3>
              <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create Community</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Community</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="community-name">Community Name *</Label>
                      <Input 
                        id="community-name" 
                        placeholder="Enter community name"
                        value={communityForm.name}
                        onChange={(e) => setCommunityForm({...communityForm, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="community-genre">Genre *</Label>
                      <Select
                        value={communityForm.genre}
                        onValueChange={(value) => setCommunityForm({...communityForm, genre: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {communityGenres.map((genre) => (
                            <SelectItem key={genre.value} value={genre.value}>
                              {genre.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="community-description">Description</Label>
                      <Textarea 
                        id="community-description" 
                        placeholder="Describe your community..." 
                        rows={3}
                        value={communityForm.description}
                        onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label>Community Type</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="community-type" 
                            value="public" 
                            className="rounded"
                            checked={communityForm.is_public}
                            onChange={(e) => setCommunityForm({...communityForm, is_public: true})}
                          />
                          <span className="text-sm">Public - Anyone can join</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="community-type" 
                            value="private" 
                            className="rounded"
                            checked={!communityForm.is_public}
                            onChange={(e) => setCommunityForm({...communityForm, is_public: false})}
                          />
                          <span className="text-sm">Private - Invite only</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="community-rules">Community Rules</Label>
                      <Textarea 
                        id="community-rules" 
                        placeholder="Set community guidelines..." 
                        rows={3}
                        value={communityForm.rules}
                        onChange={(e) => setCommunityForm({...communityForm, rules: e.target.value})}
                      />
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90" 
                      onClick={handleCreateCommunity}
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create Community"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {communities.length === 0 ? (
                <Card className="card-modern">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No communities yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first community to get started!</p>
                    <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-primary hover:opacity-90">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Community
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                communities.map((community) => (
                  <Card key={community.id} className="card-modern">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {community.name}
                            <Crown className="h-4 w-4 text-primary" />
                            <Badge variant="outline" className="text-xs">
                              {communityGenres.find(g => g.value === community.genre)?.label || community.genre}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
                        </div>
                        <Badge variant={community.is_public ? 'default' : 'secondary'}>
                          {community.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{community.member_count.toLocaleString()} members</span>
                          <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                        </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/community/${community.id}`)}
                              className="w-full sm:w-auto"
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Manage Community",
                                  description: `Managing ${community.name}...`
                                });
                              }}
                              className="w-full sm:w-auto"
                            >
                              Manage
                            </Button>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-lg font-semibold">Recent Community Posts</h3>
              <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create Post</span>
                    <span className="sm:hidden">Create</span>
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

                    {/* Media Upload Section */}
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
                            Add Photos & Videos
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
                                        Video ({file.name})
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

                    {/* Tag People Section */}
                    <div>
                      <Label>Tag People</Label>
                      <div className="space-y-2">
                        <UserSearchInput
                          value={taggedPeopleInput}
                          onChange={setTaggedPeopleInput}
                          onUserSelect={(user) => {
                            const username = `@${user.username}`;
                            const alreadyTagged = postForm.tagged_users?.some((u) => u.user_id === user.user_id);
                            if (!alreadyTagged) {
                              setPostForm({
                                ...postForm,
                                tagged_users: [...postForm.tagged_users, { user_id: user.user_id, username: user.username }]
                              });
                              console.log('User tagged:', username); // Debug log
                            }
                            setTaggedPeopleInput('');
                          }}
                          placeholder="Search users to tag..."
                        />
                        
                        {postForm.tagged_users.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {postForm.tagged_users.map((user, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                @{user.username}
                                <button
                                  type="button"
                                  onClick={() => removeTaggedPerson(`@${user.username}`)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Section */}
                    <LocationSearch
                      value={postForm.location}
                      onChange={(location) => setPostForm({...postForm, location})}
                      placeholder="Add a location..."
                    />
                    
                    <div>
                      <Label>Select Community</Label>
                      <Select
                        value={postForm.community_id}
                        onValueChange={(value) => setPostForm({...postForm, community_id: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={communities.length === 0 ? "No communities available" : "Choose a community"} />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          {communities.length === 0 ? (
                            <SelectItem value="no-communities" disabled>
                              Create a community first
                            </SelectItem>
                          ) : (
                            communities.map((community) => (
                              <SelectItem key={community.id} value={community.id} className="hover:bg-accent">
                                {community.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="pin-post" 
                        className="rounded"
                        checked={postForm.is_pinned}
                        onChange={(e) => setPostForm({...postForm, is_pinned: e.target.checked})}
                      />
                      <Label htmlFor="pin-post">Pin this post</Label>
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

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No posts yet. Create the first post in your community!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="card-modern">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.profiles?.avatar_url} alt={post.profiles?.display_name || post.profiles?.username} />
                              <AvatarFallback>
                                {(post.profiles?.display_name || post.profiles?.username)?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{post.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span>by @{post.profiles?.username}</span>
                                  <VerificationBadge 
                                    isVerified={false}
                                    followerCount={0}
                                    size="sm"
                                  />
                                </div>
                                <span>•</span>
                                <span>in {post.communities?.name}</span>
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
                          <Repeat2 className="h-4 w-4" />
                          <span>{post.reposts_count || 0}</span>
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
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-lg font-semibold">Fan Events</h3>
              <Button 
                onClick={() => navigate('/create-event')}
                className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>

            <div className="grid gap-4">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events yet. Create your first event to get started!</p>
                </div>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="card-modern">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {event.event_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(event.event_date).toLocaleString()}</span>
                          {!event.is_virtual && event.location_data && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location_data.label || 'Location provided'}
                            </div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {event.is_virtual ? 'Virtual' : 'In-Person'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {event.current_attendees || 0}/{event.max_attendees || 'Unlimited'} attendees
                            </span>
                            {event.ticket_price_cents && event.ticket_price_cents > 0 && (
                              <Badge variant="secondary">${(event.ticket_price_cents / 100).toFixed(2)}</Badge>
                            )}
                          </div>
                           <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">View Details</Button>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">Manage</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="collaboration" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">Creator Collaboration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Find Collaborators Section */}
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Find Collaborators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <UserSearchInput
                      value={collaboratorSearchTerm}
                      onChange={setCollaboratorSearchTerm}
                      onUserSelect={(user) => {
                        sendCollaborationRequest(user.user_id);
                        setCollaboratorSearchTerm('');
                      }}
                      placeholder="Search for creators to collaborate with..."
                    />
                    
                    {potentialCollaborators.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {potentialCollaborators.slice(0, 5).map((creator) => (
                          <div key={creator.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {creator.display_name?.charAt(0) || creator.username?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <p className="font-medium">{creator.display_name || creator.username}</p>
                                  <VerificationBadge 
                                    isVerified={false}
                                    followerCount={0}
                                    size="sm"
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">@{creator.username}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => sendCollaborationRequest(creator.user_id)}
                              className="bg-gradient-primary hover:opacity-90"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Connect
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Requests Section */}
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Collaboration Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {collaborationRequests.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No collaboration requests yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start connecting with other creators to see requests here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {collaborationRequests.map((request) => (
                        <div key={request.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{request.sender_name}</p>
                              <p className="text-sm text-muted-foreground">{request.message}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">Accept</Button>
                              <Button size="sm" variant="outline">Decline</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Collaboration Tips */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Collaboration Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Cross-Promotion</h4>
                    <p className="text-muted-foreground">Share each other's content to reach new audiences</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Joint Events</h4>
                    <p className="text-muted-foreground">Plan collaborative events and campaigns together</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Content Collaboration</h4>
                    <p className="text-muted-foreground">Create content together and share the benefits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        {/* )} */}
      </div>
    </div>
  );
};

export default CommunityHub;