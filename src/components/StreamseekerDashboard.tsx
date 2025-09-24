import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shuffle, Play, Heart, Share, Calendar, Music, Gamepad, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SuggestedArtist {
  artist_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  discovery_pool: string;
  content_count: number;
  follower_count: number;
}

interface DailyQuest {
  discoveries_completed: number;
  total_xp_earned: number;
  quest_completed: boolean;
}

const StreamseekerDashboard = () => {
  const [selectedContentType, setSelectedContentType] = useState('music');
  const [currentArtist, setCurrentArtist] = useState<SuggestedArtist | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyQuest, setDailyQuest] = useState<DailyQuest>({ 
    discoveries_completed: 0, 
    total_xp_earned: 0, 
    quest_completed: false 
  });
  const [engagementStartTime, setEngagementStartTime] = useState<number | null>(null);
  const [hasEngaged, setHasEngaged] = useState(false);
  const [hasFollowed, setHasFollowed] = useState(false);
  const { toast } = useToast();

  const contentTypes = [
    { id: 'music', label: 'Music', icon: Music },
    { id: 'gaming', label: 'Gaming', icon: Gamepad },
    { id: 'sports', label: 'Sports', icon: Trophy },
  ];

  const fetchDailyQuest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('streamseeker_daily_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('quest_date', new Date().toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily quest:', error);
        return;
      }

      if (data) {
        setDailyQuest({
          discoveries_completed: data.discoveries_completed,
          total_xp_earned: data.total_xp_earned,
          quest_completed: data.quest_completed
        });
      }
    } catch (error) {
      console.error('Error in fetchDailyQuest:', error);
    }
  };

  const shuffleNewArtist = async () => {
    setLoading(true);
    setHasEngaged(false);
    setHasFollowed(false);
    setEngagementStartTime(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use Streamseeker",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.rpc('get_streamseeker_suggestions', {
        fan_user_id: user.id,
        content_type_param: selectedContentType,
        exclude_discovered: true
      });

      if (error) {
        console.error('Error fetching suggestion:', error);
        toast({
          title: "No New Artists",
          description: "No new artists available right now. Try again later!",
          variant: "default"
        });
        return;
      }

      if (data && data.length > 0) {
        setCurrentArtist(data[0]);
      } else {
        toast({
          title: "All Discovered!",
          description: "You've discovered all available artists for today. Great job!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error in shuffleNewArtist:', error);
      toast({
        title: "Error",
        description: "Failed to get new artist suggestion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEngagement = () => {
    if (!engagementStartTime) {
      setEngagementStartTime(Date.now());
      toast({
        title: "Great!",
        description: "Keep listening for 30 seconds to earn XP!",
        variant: "default"
      });

      // Auto-mark as engaged after 30 seconds
      setTimeout(() => {
        setHasEngaged(true);
        toast({
          title: "Engagement Complete!",
          description: "You've earned 20 XP for engaging with this content!",
          variant: "default"
        });
      }, 30000);
    }
  };

  const handleFollow = async () => {
    if (!currentArtist || hasFollowed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: currentArtist.artist_id
        });

      if (error) {
        console.error('Error following artist:', error);
        return;
      }

      setHasFollowed(true);
      toast({
        title: "Following!",
        description: `You're now following ${currentArtist.display_name || currentArtist.username}!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error in handleFollow:', error);
    }
  };

  const completeDiscovery = async () => {
    if (!currentArtist) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const engagementDuration = engagementStartTime 
        ? Math.floor((Date.now() - engagementStartTime) / 1000)
        : 0;

      const { data, error } = await supabase.rpc('complete_streamseeker_discovery', {
        fan_user_id: user.id,
        artist_user_id: currentArtist.artist_id,
        content_type_param: selectedContentType,
        engagement_completed_param: hasEngaged,
        followed_param: hasFollowed,
        engagement_duration_param: engagementDuration
      });

      if (error) {
        console.error('Error completing discovery:', error);
        return;
      }

      if (data) {
        const result = data as any;
        if (result.success) {
          toast({
            title: "Discovery Complete!",
            description: `You earned ${result.xp_earned} XP!`,
            variant: "default"
          });

          // Refresh daily quest data
          fetchDailyQuest();
          
          // Clear current artist
          setCurrentArtist(null);
        }
      }
    } catch (error) {
      console.error('Error in completeDiscovery:', error);
    }
  };

  useEffect(() => {
    fetchDailyQuest();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Daily Quest Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Discovery Quest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Progress: {dailyQuest.discoveries_completed}/3 discoveries
              </p>
              <p className="text-lg font-semibold">
                {dailyQuest.total_xp_earned} XP earned today
              </p>
            </div>
            <Badge variant={dailyQuest.quest_completed ? "default" : "secondary"}>
              {dailyQuest.quest_completed ? "Quest Complete!" : "In Progress"}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(dailyQuest.discoveries_completed / 3) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>What are you looking to discover?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.id}
                  variant={selectedContentType === type.id ? "default" : "outline"}
                  onClick={() => setSelectedContentType(type.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Shuffle Button */}
      <div className="text-center">
        <Button
          onClick={shuffleNewArtist}
          disabled={loading}
          size="lg"
          className="flex items-center gap-2"
        >
          <Shuffle className="h-5 w-5" />
          {loading ? "Discovering..." : "Discover New Talent"}
        </Button>
      </div>

      {/* Artist Discovery Card */}
      {currentArtist && (
        <Card>
          <CardHeader>
            <CardTitle>New Discovery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentArtist.avatar_url} />
                <AvatarFallback>
                  {(currentArtist.display_name || currentArtist.username)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold">
                  {currentArtist.display_name || currentArtist.username}
                </h3>
                <p className="text-muted-foreground mb-2">@{currentArtist.username}</p>
                <Badge variant="outline">{currentArtist.discovery_pool}</Badge>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{currentArtist.follower_count} followers</span>
                  <span>{currentArtist.content_count} tracks</span>
                </div>
              </div>
            </div>

            {currentArtist.bio && (
              <p className="text-muted-foreground">{currentArtist.bio}</p>
            )}

            {/* Mock Content Player */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleEngagement}
                  size="sm"
                  variant={hasEngaged ? "default" : "outline"}
                  disabled={hasEngaged}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <div className="font-medium">Featured Track</div>
                  <div className="text-sm text-muted-foreground">
                    {hasEngaged ? "✓ Listened (30s)" : "Listen to earn 20 XP"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleFollow}
                variant={hasFollowed ? "default" : "outline"}
                disabled={hasFollowed}
                className="flex items-center gap-2"
              >
                <Heart className={hasFollowed ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                {hasFollowed ? "Following" : "Follow (+50 XP)"}
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>

              <Button onClick={completeDiscovery} className="ml-auto">
                Complete Discovery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {!currentArtist && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <div className="text-6xl">🎵</div>
              <h3 className="text-xl font-semibold">Ready to discover new talent?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Click "Discover New Talent" to find amazing independent artists and earn XP for engaging with their content!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StreamseekerDashboard;