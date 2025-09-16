import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, MapPin, Heart, MessageSquare, Share, ArrowLeft } from 'lucide-react';

interface CommunityDetailProps {
  communityId: number;
  onBack: () => void;
}

export const CommunityDetail: React.FC<CommunityDetailProps> = ({ communityId, onBack }) => {
  // Mock data for the specific community
  const communityData = {
    1: {
      name: 'Official Fan Community',
      description: 'Connect with fellow fans and get exclusive updates',
      members: 1234,
      isPublic: true,
      posts: [
        {
          id: 1,
          author: 'Sarah Fan',
          authorAvatar: '',
          content: 'Just listened to the new track on repeat! Amazing work as always 🎵',
          timestamp: '2 hours ago',
          likes: 23,
          comments: 5,
        },
        {
          id: 2,
          author: 'Music Lover',
          authorAvatar: '',
          content: 'Anyone else excited for the upcoming tour? Can\'t wait to see the live performance!',
          timestamp: '4 hours ago',
          likes: 18,
          comments: 12,
        }
      ]
    },
    2: {
      name: 'VIP Members Only',
      description: 'Exclusive community for VIP subscribers',
      members: 89,
      isPublic: false,
      posts: [
        {
          id: 3,
          author: 'VIP Fan',
          authorAvatar: '',
          content: 'Thanks for the exclusive content drop! 🔥',
          timestamp: '1 hour ago',
          likes: 15,
          comments: 3,
        }
      ]
    }
  };

  const community = communityData[communityId as keyof typeof communityData];

  if (!community) {
    return (
      <div className="text-center py-8">
        <p>Community not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{community.name}</h1>
      </div>

      {/* Community Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {community.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
            </div>
            <Badge variant={community.isPublic ? 'default' : 'secondary'}>
              {community.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{community.members.toLocaleString()} members</span>
            <span>{community.posts.length} posts today</span>
          </div>
        </CardContent>
      </Card>

      {/* Community Posts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Posts</h3>
        {community.posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
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
    </div>
  );
};