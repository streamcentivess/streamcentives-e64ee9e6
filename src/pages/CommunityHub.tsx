import React, { useState } from 'react';
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
import { Users, MessageSquare, Calendar, MapPin, Plus, Heart, Share, Pin, Crown } from 'lucide-react';
import { CommunityDetail } from '@/components/CommunityDetail';

const CommunityHub = () => {
  const { user } = useAuth();
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);

  // Mock data
  const communities = [
    { 
      id: 1, 
      name: 'Official Fan Community', 
      description: 'Connect with fellow fans and get exclusive updates',
      members: 1234, 
      isPublic: true, 
      isOwner: true,
      recentActivity: '5 new posts today'
    },
    { 
      id: 2, 
      name: 'VIP Members Only', 
      description: 'Exclusive community for VIP subscribers',
      members: 89, 
      isPublic: false, 
      isOwner: true,
      recentActivity: '2 new posts today'
    }
  ];

  const communityPosts = [
    {
      id: 1,
      author: 'Sarah Fan',
      authorAvatar: '',
      content: 'Just listened to the new track on repeat! Amazing work as always 🎵',
      timestamp: '2 hours ago',
      likes: 23,
      comments: 5,
      isPinned: false
    },
    {
      id: 2,
      author: 'Music Lover',
      authorAvatar: '',
      content: 'Anyone else excited for the upcoming tour? Can\'t wait to see the live performance!',
      timestamp: '4 hours ago',
      likes: 18,
      comments: 12,
      isPinned: true
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {selectedCommunity ? (
          <CommunityDetail 
            communityId={selectedCommunity} 
            onBack={() => setSelectedCommunity(null)} 
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Community Hub
                </h1>
                <p className="text-muted-foreground">Build and manage your fan communities</p>
              </div>
            </div>

        <Tabs defaultValue="communities" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="communities">My Communities</TabsTrigger>
            <TabsTrigger value="posts">Community Posts</TabsTrigger>
            <TabsTrigger value="events">Fan Events</TabsTrigger>
            <TabsTrigger value="collaboration">Creator Collaboration</TabsTrigger>
          </TabsList>

          <TabsContent value="communities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Communities</h3>
              <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Community</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="community-name">Community Name</Label>
                      <Input id="community-name" placeholder="Enter community name" />
                    </div>
                    <div>
                      <Label htmlFor="community-description">Description</Label>
                      <Textarea id="community-description" placeholder="Describe your community..." rows={3} />
                    </div>
                    <div>
                      <Label>Community Type</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="community-type" value="public" className="rounded" />
                          <span className="text-sm">Public - Anyone can join</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="community-type" value="private" className="rounded" />
                          <span className="text-sm">Private - Invite only</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="community-rules">Community Rules</Label>
                      <Textarea id="community-rules" placeholder="Set community guidelines..." rows={3} />
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Create Community</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {communities.map((community) => (
                <Card key={community.id} className="card-modern">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {community.name}
                          {community.isOwner && <Crown className="h-4 w-4 text-primary" />}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
                      </div>
                      <Badge variant={community.isPublic ? 'default' : 'secondary'}>
                        {community.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{community.members.toLocaleString()} members</span>
                        <span>{community.recentActivity}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCommunity(community.id)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Navigate to community management page - placeholder for now
                            console.log('Manage community:', community.id);
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Community Posts</h3>
              <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Community Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="post-title">Post Title (Optional)</Label>
                      <Input id="post-title" placeholder="Enter post title" />
                    </div>
                    <div>
                      <Label htmlFor="post-content">Content</Label>
                      <Textarea id="post-content" placeholder="What's on your mind?" rows={4} />
                    </div>
                    <div>
                      <Label>Select Community</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Official Fan Community</option>
                        <option>VIP Members Only</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="pin-post" className="rounded" />
                      <Label htmlFor="pin-post">Pin this post</Label>
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">Post</Button>
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
                      <p className="text-sm">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-primary">
                          <Heart className="h-4 w-4" />
                          {post.likes}
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary">
                          <MessageSquare className="h-4 w-4" />
                          {post.comments}
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary">
                          <Share className="h-4 w-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Fan Events</h3>
              <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
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
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          <Button variant="outline" size="sm">Manage</Button>
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
        )}
      </div>
    </div>
  );
};

export default CommunityHub;