import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, MapPin, Globe, Calendar, Star, Trophy, Gift, BarChart3, Users, Music, Settings, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MessageCreator from '@/components/MessageCreator';

interface Profile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  spotify_connected: boolean;
  created_at: string;
}

const UniversalProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Check if viewing own profile or another user's profile
  const viewingUserId = searchParams.get('userId');
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const targetUserId = viewingUserId || user?.id;
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } else {
        setProfile(data);
        // Check if current user is following this profile (if not own profile)
        if (!isOwnProfile && user) {
          checkFollowStatus();
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    // This would check a follows table - for now just mock it
    setFollowing(false);
  };

  const handleFollowToggle = async () => {
    if (!user || !profile || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      // Mock follow/unfollow logic - you'd implement actual follow system here
      setFollowing(!following);
      toast({
        title: "Success",
        description: following ? "Unfollowed user" : "Following user"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  // Remove unused handleMessage function - replaced with MessageCreator component

  const handleRoleSelection = (role: 'fan' | 'creator') => {
    setRoleModalOpen(false);
    if (role === 'fan') {
      navigate('/fan-dashboard');
    } else {
      navigate('/creator-dashboard');
    }
  };

  const connectSpotify = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-modify-public playlist-modify-private'
      }
    });

    if (error) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      setProfile(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);

      toast({
        title: "Success",
        description: "Avatar updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">We couldn't load your profile data.</p>
            <Button onClick={fetchProfile}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Universal Profile
          </h1>
          <div className="flex gap-2">
            <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  Switch Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Choose Your Dashboard</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors group"
                    onClick={() => handleRoleSelection('fan')}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30">
                        <Users className="h-12 w-12 mx-auto text-primary mb-2" />
                      </div>
                      <CardTitle>Fan Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Earn XP for streams and engagement</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Join campaigns and challenges</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Redeem exclusive rewards</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Compete on leaderboards</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-primary hover:opacity-90">
                        <Users className="h-4 w-4 mr-2" />
                        Enter Fan Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors group"
                    onClick={() => handleRoleSelection('creator')}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 group-hover:from-secondary/30 group-hover:to-accent/30">
                        <Music className="h-12 w-12 mx-auto text-primary mb-2" />
                      </div>
                      <CardTitle>Creator Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-sm">Create AI-powered campaigns</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-sm">Engage and reward fans</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-sm">Access detailed analytics</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-sm">Generate revenue streams</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-accent hover:opacity-90">
                        <Music className="h-4 w-4 mr-2" />
                        Enter Creator Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex-shrink-0 text-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 mx-auto">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-2xl">
                      {profile.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {profile.display_name || 'New User'}
                      </h2>
                      {profile.username && (
                        <p className="text-muted-foreground">@{profile.username}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Bronze Tier
                      </Badge>
                      {profile.spotify_connected && (
                        <Badge className="bg-[#1db954] hover:bg-[#1ed760] text-white">
                          <Music className="h-3 w-3 mr-1" />
                          Spotify Connected
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-4">
                    {isOwnProfile ? (
                      <Button 
                        onClick={() => navigate('/profile/edit')}
                        className="bg-gradient-primary hover:opacity-90"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          variant={following ? "outline" : "default"}
                          className={following ? "" : "bg-gradient-primary hover:opacity-90"}
                        >
                          {following ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Send Message</DialogTitle>
                            </DialogHeader>
                            <MessageCreator
                              recipientId={profile.user_id}
                              recipientName={profile.display_name || 'User'}
                            />
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">XP</div>
                  </div>
                </div>

                {/* Bio and Details */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {profile.bio && <p>{profile.bio}</p>}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Connect Spotify Button */}
                {!profile.spotify_connected && (
                  <Button 
                    onClick={connectSpotify}
                    className="mt-4 bg-[#1db954] hover:bg-[#1ed760] text-white"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Connect Spotify
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <p>No posts yet. Start sharing your music journey!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="campaigns" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No campaigns yet. Join some campaigns to start earning XP!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rewards" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No rewards yet. Earn XP to unlock amazing rewards!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <Card className="card-modern">
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Statistics will appear here as you engage with the platform.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UniversalProfile;