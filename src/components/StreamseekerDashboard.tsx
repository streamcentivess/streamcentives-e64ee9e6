import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Shuffle, 
  Play, 
  Heart, 
  Share, 
  Music, 
  Gamepad, 
  Trophy, 
  Zap,
  Sparkles,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  Settings,
  Mic,
  Video,
  Target,
  Palette
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

interface SuggestedArtist {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  creator_type: string;
  spotify_connected: boolean;
  follower_count: number;
  content_count: number;
}

interface DailyQuest {
  discoveries_completed: number;
  total_xp_earned: number;
  quest_completed: boolean;
}

const StreamseekerDashboard = () => {
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [selectedContentType, setSelectedContentType] = useState('musician');
  const [currentArtists, setCurrentArtists] = useState<SuggestedArtist[]>([]);
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
    { 
      id: 'musician', 
      label: 'Musicians', 
      icon: Music, 
      gradient: 'from-pink-500 to-purple-600',
      description: 'Discover amazing artists and tracks'
    },
    { 
      id: 'podcaster', 
      label: 'Podcasters', 
      icon: Mic, 
      gradient: 'from-blue-500 to-indigo-600',
      description: 'Find interesting conversations and stories'
    },
    { 
      id: 'gamer', 
      label: 'Gamers', 
      icon: Target, 
      gradient: 'from-green-500 to-blue-600',
      description: 'Watch epic gaming content'
    },
    { 
      id: 'artist', 
      label: 'Visual Artists', 
      icon: Palette, 
      gradient: 'from-purple-500 to-indigo-600',
      description: 'Explore amazing visual art'
    },
    { 
      id: 'influencer', 
      label: 'Influencers', 
      icon: Star, 
      gradient: 'from-yellow-500 to-orange-600',
      description: 'Connect with amazing influencers'
    },
    { 
      id: 'other', 
      label: 'Other Creators', 
      icon: Sparkles, 
      gradient: 'from-gray-500 to-slate-600',
      description: 'Discover unique content creators'
    }
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

      // Use the new get_creators_by_category function
      const { data, error } = await supabase.rpc('get_creators_by_category', {
        category_filter: selectedContentType,
        fan_user_id: user.id,
        limit_count: 3
      });

      if (error) {
        console.error('Error fetching creators by category:', error);
        toast({
          title: "No Creators Found",
          description: `No ${contentTypes.find(t => t.id === selectedContentType)?.label.toLowerCase()} available right now. Try another category!`,
          variant: "default"
        });
        return;
      }

      if (data && data.length > 0) {
        // Transform the data to match our interface
        const artists = data.map(creator => ({
          user_id: creator.user_id,
          username: creator.username,
          display_name: creator.display_name,
          avatar_url: creator.avatar_url,
          bio: creator.bio,
          creator_type: creator.creator_type,
          spotify_connected: creator.spotify_connected,
          follower_count: creator.follower_count,
          content_count: creator.content_count
        }));
        
        setCurrentArtists(artists);
        
        toast({
          title: `${data.length} ${contentTypes.find(t => t.id === selectedContentType)?.label} Found!`,
          description: `Choose who to discover`,
          variant: "default"
        });
      } else {
        toast({
          title: "All Discovered!",
          description: `You've discovered all available ${contentTypes.find(t => t.id === selectedContentType)?.label.toLowerCase()} for now. Try another category!`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error in shuffleNewArtist:', error);
      toast({
        title: "Error",
        description: "Failed to get new creator suggestion",
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

  const handleFollow = async (artist: SuggestedArtist) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: artist.user_id
        });

      if (error) {
        console.error('Error following artist:', error);
        return;
      }

      toast({
        title: "Following!",
        description: `You're now following ${artist.display_name || artist.username}!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error in handleFollow:', error);
    }
  };

  const completeDiscovery = async (artist: SuggestedArtist, hasEngagedWithArtist: boolean = false, hasFollowedArtist: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const engagementDuration = engagementStartTime 
        ? Math.floor((Date.now() - engagementStartTime) / 1000)
        : 0;

      const { data, error } = await supabase.rpc('complete_streamseeker_discovery', {
        fan_user_id: user.id,
        artist_user_id: artist.user_id,
        content_type_param: selectedContentType,
        engagement_completed_param: hasEngagedWithArtist,
        followed_param: hasFollowedArtist,
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

          fetchDailyQuest();
          // Remove the discovered artist from the current list
          setCurrentArtists(prev => prev.filter(a => a.user_id !== artist.user_id));
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-background via-surface to-background"
    >
      {/* Hero Section - Instagram Story Style */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden hero-gradient p-8 text-center"
      >
        <div className="absolute inset-0 bg-grid-subtle opacity-20"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-glow flex items-center justify-center animate-pulse-glow">
              <Sparkles className="h-6 w-6 text-white animate-scale" />
            </div>
            <h1 className="text-5xl font-black text-gradient-primary">
              Streamseeker
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-muted-foreground font-medium"
          >
            Discover incredible creators and earn rewards for your engagement
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-6 text-sm text-muted-foreground/80"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Curated</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Rewarded</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Creator Verification Banner */}
      {role === 'creator' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto px-6 mb-8"
        >
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-6 border border-primary/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Get Verified as an Artist</h3>
                  <p className="text-muted-foreground">Complete your verification checklist to be discovered by fans</p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/streamseeker/admin')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Profile
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-md mx-auto px-6 pb-8 space-y-8">
        {/* Daily Quest Progress - TikTok Style */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="glass-card rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Daily Quest</h3>
                <p className="text-sm text-muted-foreground">Discover 3 artists</p>
              </div>
            </div>
            <Badge 
              variant={dailyQuest.quest_completed ? "default" : "secondary"} 
              className="text-sm font-bold px-3 py-1"
            >
              {dailyQuest.discoveries_completed}/3
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{Math.round((dailyQuest.discoveries_completed / 3) * 100)}%</span>
            </div>
            
            <div className="w-full bg-surface-elevated rounded-full h-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(dailyQuest.discoveries_completed / 3) * 100}%` }}
                transition={{ duration: 1, delay: 0.5, type: "spring" }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </motion.div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-right">
                <div className="text-2xl font-black text-gradient-primary">{dailyQuest.total_xp_earned}</div>
                <div className="text-xs text-muted-foreground">XP Earned</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Type Selection - Instagram Style Pills */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex gap-3 justify-center"
        >
          {contentTypes.map((type, index) => {
            const Icon = type.icon;
            const isSelected = selectedContentType === type.id;
            return (
              <motion.button
                key={type.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5, type: "spring" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedContentType(type.id)}
                className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  isSelected
                    ? `bg-gradient-to-r ${type.gradient} text-white shadow-2xl border-2 border-white/20`
                    : "glass-card text-muted-foreground hover:text-foreground border-2 border-transparent"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{type.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="activeType"
                    className="absolute inset-0 rounded-2xl bg-white/10"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Main Streamseek Button */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6, type: "spring" }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={shuffleNewArtist}
            disabled={loading}
            className="relative group bg-gradient-to-r from-brand-primary via-brand-glow to-brand-secondary text-white px-12 py-6 rounded-3xl font-black text-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-4">
              <motion.div
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
              >
                <Shuffle className="h-7 w-7" />
              </motion.div>
              <span>{loading ? "Discovering..." : "Streamseek"}</span>
            </div>
            
            {/* Animated background effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-brand-glow/50 to-brand-secondary/50"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
              }}
            />
          </motion.button>
        </motion.div>

        {/* Artist Discovery Cards - Show 3 profiles */}
        <AnimatePresence mode="wait">
          {currentArtists.length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="space-y-6"
            >
              {currentArtists.map((artist, index) => (
                <motion.div
                  key={artist.user_id}
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6, type: "spring", bounce: 0.3 }}
                  className="glass-card rounded-3xl overflow-hidden shadow-2xl"
                >
                  {/* Artist Header */}
                  <div className="p-6 text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.6, type: "spring" }}
                      className="relative"
                    >
                      <Avatar className="h-24 w-24 mx-auto ring-4 ring-brand-primary/20 shadow-2xl">
                        <AvatarImage src={artist.avatar_url} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-black">
                          {(artist.display_name || artist.username)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                      className="space-y-3"
                    >
                      <div>
                        <h3 className="text-xl font-black text-gradient-primary mb-1">
                          {artist.display_name || artist.username}
                        </h3>
                        <p className="text-muted-foreground text-sm">@{artist.username}</p>
                      </div>
                      
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-brand-primary" />
                          <span className="font-bold">{artist.follower_count}</span>
                        </div>
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <div className="flex items-center gap-1">
                          <Music className="h-3 w-3 text-brand-secondary" />
                          <span className="font-bold">{artist.content_count}</span>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="text-xs font-medium px-3 py-1 border-brand-primary/30 text-brand-primary">
                        {artist.creator_type ? artist.creator_type.charAt(0).toUpperCase() + artist.creator_type.slice(1) : 'Creator'}
                      </Badge>
                    </motion.div>

                    {artist.bio && (
                      <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                        className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto"
                      >
                        {artist.bio}
                      </motion.p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                    className="p-6 pt-0 space-y-3"
                  >
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFollow(artist)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        <Heart className="h-4 w-4" />
                        Follow (+50 XP)
                      </motion.button>
                      
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl glass-card border border-border/20 transition-all duration-300 hover:border-brand-primary/30"
                      >
                        <Share className="h-4 w-4" />
                      </motion.button>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => completeDiscovery(artist, false, false)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-secondary text-white font-bold text-sm shadow-xl transition-all duration-300"
                    >
                      Discover ✨
                    </motion.button>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State - No Artists */}
        {currentArtists.length === 0 && (
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-center py-16 space-y-8"
          >
            <motion.div 
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-8xl opacity-30 mb-4">🎵</div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="text-4xl">✨</div>
              </motion.div>
            </motion.div>
            
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-gradient-primary">
                Ready for your next discovery?
              </h3>
              <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
                Tap "Streamseek" above to find incredible independent creators and earn XP for engaging with their content!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StreamseekerDashboard;
