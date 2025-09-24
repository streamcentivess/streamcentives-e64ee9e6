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
  Star
} from 'lucide-react';
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
    { id: 'music', label: 'Music', icon: Music, color: 'from-pink-500 to-rose-500' },
    { id: 'gaming', label: 'Gaming', icon: Gamepad, color: 'from-purple-500 to-indigo-500' },
    { id: 'sports', label: 'Sports', icon: Trophy, color: 'from-amber-500 to-orange-500' },
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

          fetchDailyQuest();
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
                    ? `bg-gradient-to-r ${type.color} text-white shadow-2xl border-2 border-white/20`
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

        {/* Artist Discovery Card - Instagram/TikTok Level */}
        <AnimatePresence mode="wait">
          {currentArtist && (
            <motion.div
              key={currentArtist.artist_id}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="glass-card rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Artist Header */}
              <div className="p-8 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                  className="relative"
                >
                  <Avatar className="h-36 w-36 mx-auto ring-4 ring-brand-primary/20 shadow-2xl">
                    <AvatarImage src={currentArtist.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-black">
                      {(currentArtist.display_name || currentArtist.username)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-primary/20 to-brand-glow/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-3xl font-black text-gradient-primary mb-2">
                      {currentArtist.display_name || currentArtist.username}
                    </h3>
                    <p className="text-muted-foreground font-medium">@{currentArtist.username}</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-brand-primary" />
                      <span className="font-bold">{currentArtist.follower_count}</span>
                      <span className="text-muted-foreground">followers</span>
                    </div>
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-brand-secondary" />
                      <span className="font-bold">{currentArtist.content_count}</span>
                      <span className="text-muted-foreground">tracks</span>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-sm font-medium px-4 py-1 border-brand-primary/30 text-brand-primary">
                    {currentArtist.discovery_pool}
                  </Badge>
                </motion.div>

                {currentArtist.bio && (
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-muted-foreground leading-relaxed max-w-xs mx-auto"
                  >
                    {currentArtist.bio}
                  </motion.p>
                )}
              </div>

              {/* Content Player */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="px-8 pb-6"
              >
                <div className="glass-card rounded-3xl p-6">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEngagement}
                      disabled={hasEngaged}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        hasEngaged 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" 
                          : "bg-gradient-to-r from-brand-primary to-brand-glow text-white shadow-xl animate-pulse-glow"
                      }`}
                    >
                      <Play className="h-6 w-6" />
                    </motion.button>
                    
                    <div className="flex-1">
                      <div className="font-bold text-lg">Featured Track</div>
                      <div className="text-muted-foreground">
                        {hasEngaged ? "✨ Listened (30s) +20 XP" : "🎵 Listen for 30s to earn 20 XP"}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="p-8 pt-0 space-y-4"
              >
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollow}
                    disabled={hasFollowed}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      hasFollowed
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                        : "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xl hover:shadow-2xl"
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${hasFollowed ? "fill-current" : ""}`} />
                    {hasFollowed ? "Following" : "Follow (+50 XP)"}
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl glass-card border-2 border-border/20 transition-all duration-300 hover:border-brand-primary/30"
                  >
                    <Share className="h-6 w-6" />
                  </motion.button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={completeDiscovery}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-secondary text-white font-bold text-lg shadow-xl transition-all duration-300"
                >
                  Complete Discovery ✨
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State - No Artist */}
        {!currentArtist && (
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
