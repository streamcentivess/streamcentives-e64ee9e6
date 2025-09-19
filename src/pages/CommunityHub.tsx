import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { CommunityDetail } from '@/components/CommunityDetail';
import AppNavigation from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CommunityHub = () => {
  const { user } = useAuth();
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);
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
    tagged_people: [] as string[],
    location: ''
  });
  
  const [taggedPeopleInput, setTaggedPeopleInput] = useState('');

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
    setPostForm({...postForm, photos: [...postForm.photos, ...validFiles].slice(0, 4)}); // Max 4 media files
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...postForm.photos];
    newPhotos.splice(index, 1);
    setPostForm({...postForm, photos: newPhotos});
  };

  // Tagged people handlers
  const addTaggedPerson = () => {
    if (taggedPeopleInput.trim() && !postForm.tagged_people.includes(taggedPeopleInput.trim())) {
      setPostForm({
        ...postForm, 
        tagged_people: [...postForm.tagged_people, taggedPeopleInput.trim()]
      });
      setTaggedPeopleInput('');
    }
  };

  const removeTaggedPerson = (person: string) => {
    setPostForm({
      ...postForm,
      tagged_people: postForm.tagged_people.filter(p => p !== person)
    });
  };

  const communityPosts = [
    {
      id: 1,
      author: 'Sarah Fan',
      authorAvatar: '',
      title: 'Amazing new track!',
      content: 'Just listened to the new track on repeat! Amazing work as always 🎵',
      timestamp: '2 hours ago',
      likes: 23,
      comments: 5,
      reposts: 3,
      isPinned: false,
      photos: [],
      tagged_people: ['@musiclover92', '@fanclub_official'],
      location: 'Nashville, TN'
    },
    {
      id: 2,
      author: 'Music Lover',
      authorAvatar: '',
      title: 'Tour Excitement!',
      content: 'Anyone else excited for the upcoming tour? Can\'t wait to see the live performance!',
      timestamp: '4 hours ago',
      likes: 18,
      comments: 12,
      reposts: 7,
      isPinned: true,
      photos: [],
      tagged_people: ['@sarah_fan'],
      location: 'Los Angeles, CA'
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      name: 'Virtual Meet & Greet',
      date: '2024-03-20',
      time: '19:00',
      type: 'virtual',
      attendees: 45,
      maxAttendees: 50,
      ticketPrice: 25.00
    },
    {
      id: 2,
      name: 'Fan Meetup - NYC',
      date: '2024-03-25',
      time: '18:30',
      type: 'in-person',
      location: 'Central Park, NYC',
      attendees: 23,
      maxAttendees: 30,
      ticketPrice: 0
    }
  ];

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
                             onClick={() => {
                               // For now, just show a message since CommunityDetail expects number
                               toast({
                                 title: "Community View",
                                 description: `Opening ${community.name}...`
                               });
                             }}
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
                                  <video
                                    src={URL.createObjectURL(file)}
                                    className="w-full h-20 object-cover rounded-md"
                                    controls={false}
                                    muted
                                  />
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
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type username (e.g., @username)"
                            value={taggedPeopleInput}
                            onChange={(e) => setTaggedPeopleInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTaggedPerson())}
                          />
                          <Button type="button" variant="outline" onClick={addTaggedPerson}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {postForm.tagged_people.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {postForm.tagged_people.map((person, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {person}
                                <button
                                  type="button"
                                  onClick={() => removeTaggedPerson(person)}
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
                    <div>
                      <Label htmlFor="post-location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="post-location"
                          placeholder="Add a location..."
                          className="pl-10"
                          value={postForm.location}
                          onChange={(e) => setPostForm({...postForm, location: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Select Community</Label>
                      <Select
                        value={postForm.community_id}
                        onValueChange={(value) => setPostForm({...postForm, community_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a community" />
                        </SelectTrigger>
                        <SelectContent>
                          {communities.map((community) => (
                            <SelectItem key={community.id} value={community.id}>
                              {community.name}
                            </SelectItem>
                          ))}
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
                    
                    <Button className="w-full bg-gradient-primary hover:opacity-90">
                      Create Post
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {communityPosts.map((post) => (
                <Card key={post.id} className="card-modern">
                  <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={post.authorAvatar} alt={post.author} />
                              <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{post.author}</p>
                              <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                            </div>
                          </div>
                          {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
                        </div>
                        
                        {/* Post Title */}
                        {post.title && (
                          <h4 className="font-semibold text-base">{post.title}</h4>
                        )}
                        
                        {/* Post Content */}
                        <p className="text-sm">{post.content}</p>
                        
                        {/* Tagged People */}
                        {post.tagged_people && post.tagged_people.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">with</span>
                            {post.tagged_people.map((person, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {person}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Location */}
                        {post.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        
                        {/* Photos */}
                        {post.photos && post.photos.length > 0 && (
                          <div className={`grid gap-2 ${post.photos.length === 1 ? 'grid-cols-1' : 
                                        post.photos.length === 2 ? 'grid-cols-2' : 
                                        post.photos.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                            {post.photos.map((photo, index) => (
                              <div key={index} className={`${post.photos.length === 3 && index === 0 ? 'col-span-2' : ''}`}>
                                <img
                                  src={photo}
                                  alt={`Post photo ${index + 1}`}
                                  className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Interaction Buttons */}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
                          <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.comments}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                            <Repeat2 className="h-4 w-4" />
                            <span>{post.reposts}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-primary transition-colors">
                            <Share className="h-4 w-4" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-lg font-semibold">Fan Events</h3>
              <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create Event</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Fan Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="event-name">Event Name</Label>
                      <Input id="event-name" placeholder="Enter event name" />
                    </div>
                    <div>
                      <Label htmlFor="event-description">Description</Label>
                      <Textarea id="event-description" placeholder="Describe your event..." rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event-date">Event Date</Label>
                        <Input id="event-date" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="event-time">Time</Label>
                        <Input id="event-time" type="time" />
                      </div>
                    </div>
                    <div>
                      <Label>Event Type</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="event-type" value="virtual" className="rounded" />
                          <span className="text-sm">Virtual</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="event-type" value="in-person" className="rounded" />
                          <span className="text-sm">In-Person</span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-attendees">Max Attendees</Label>
                        <Input id="max-attendees" type="number" placeholder="50" />
                      </div>
                      <div>
                        <Label htmlFor="ticket-price">Ticket Price ($)</Label>
                        <Input id="ticket-price" type="number" placeholder="0.00" />
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Create Event</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {event.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(event.date + 'T' + event.time).toLocaleString()}</span>
                        {event.type === 'in-person' && event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'virtual' ? 'Virtual' : 'In-Person'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {event.attendees}/{event.maxAttendees} attendees
                          </span>
                          {event.ticketPrice > 0 && (
                            <Badge variant="secondary">${event.ticketPrice}</Badge>
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collaboration" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Creator Collaboration Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Connect and collaborate with other creators, plan joint events, and cross-promote content.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="bg-gradient-primary hover:opacity-90">
                      Find Collaborators
                    </Button>
                    <Button variant="outline">
                      Collaboration Requests
                    </Button>
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