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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 text-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Streamseeker
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover amazing independent creators and earn rewards for your engagement
          </p>
          <p className="text-sm text-muted-foreground/80">
            Try Streamseeker as your new way to discover incredible creators
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-8">
        {/* Daily Quest Progress - Compact */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Daily Quest</span>
            <Badge variant={dailyQuest.quest_completed ? "default" : "secondary"} className="text-xs">
              {dailyQuest.discoveries_completed}/3
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="w-full bg-muted/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(dailyQuest.discoveries_completed / 3) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{dailyQuest.total_xp_earned}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>
        </div>

        {/* Content Type Pills */}
        <div className="flex gap-2 mb-6 justify-center">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedContentType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedContentType === type.id
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-card/80 text-muted-foreground hover:bg-card hover:scale-105 border border-border/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Main Streamseek Button */}
        <div className="text-center mb-6">
          <button
            onClick={shuffleNewArtist}
            disabled={loading}
            className="group relative bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <Shuffle className={`h-6 w-6 transition-transform duration-300 ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
              {loading ? "Discovering..." : "Streamseek"}
            </div>
          </button>
        </div>

        {/* Artist Discovery Card - Instagram Story Style */}
        {currentArtist && (
          <div className="relative bg-gradient-to-b from-card/80 to-card/60 backdrop-blur-lg rounded-3xl overflow-hidden shadow-2xl border border-border/50">
            {/* Artist Header */}
            <div className="p-6 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-primary/20 shadow-xl">
                <AvatarImage src={currentArtist.avatar_url} className="object-cover" />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {(currentArtist.display_name || currentArtist.username)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  {currentArtist.display_name || currentArtist.username}
                </h3>
                <p className="text-muted-foreground">@{currentArtist.username}</p>
                
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>{currentArtist.follower_count} followers</span>
                  <span>•</span>
                  <span>{currentArtist.content_count} tracks</span>
                </div>
                
                <Badge variant="outline" className="mt-2">
                  {currentArtist.discovery_pool}
                </Badge>
              </div>

              {currentArtist.bio && (
                <p className="text-muted-foreground mt-4 max-w-xs mx-auto leading-relaxed">
                  {currentArtist.bio}
                </p>
              )}
            </div>

            {/* Content Player */}
            <div className="px-6 pb-4">
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleEngagement}
                    disabled={hasEngaged}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      hasEngaged 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" 
                        : "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-110 shadow-lg"
                    }`}
                  >
                    <Play className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <div className="font-medium">Featured Track</div>
                    <div className="text-sm text-muted-foreground">
                      {hasEngaged ? "✓ Listened (30s) +20 XP" : "Listen for 30s to earn 20 XP"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleFollow}
                  disabled={hasFollowed}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all duration-300 ${
                    hasFollowed
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                      : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:scale-105 shadow-lg"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${hasFollowed ? "fill-current" : ""}`} />
                  {hasFollowed ? "Following" : "Follow (+50 XP)"}
                </button>
                
                <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-card/80 hover:bg-card border border-border/50 transition-all duration-300 hover:scale-105">
                  <Share className="h-5 w-5" />
                </button>
              </div>

              <button 
                onClick={completeDiscovery}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent to-secondary text-accent-foreground font-medium hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Complete Discovery
              </button>
            </div>
          </div>
        )}

        {/* Getting Started - No Artist */}
        {!currentArtist && (
          <div className="text-center py-12 space-y-6">
            <div className="relative">
              <div className="text-8xl opacity-20 animate-pulse">🎵</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl animate-bounce">✨</div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ready for your next discovery?
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Tap "Streamseek" above to find incredible independent creators and earn XP for engaging with their content!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamseekerDashboard;