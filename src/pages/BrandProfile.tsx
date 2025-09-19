import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Globe, Users, Briefcase, MapPin, Calendar, Star, Share2, MessageSquare, Heart, Award, TrendingUp, Target, DollarSign, Link2, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserCampaignDisplay } from '@/components/UserCampaignDisplay';
import EnhancedSocialInteractions from '@/components/EnhancedSocialInteractions';
import { UniversalShareButton } from '@/components/UniversalShareButton';
import { SponsorPosts } from '@/components/SponsorPosts';
import { SmartLinkManager } from '@/components/SmartLinkManager';
import { UserSearchAndManage } from '@/components/UserSearchAndManage';

interface SponsorProfile {
  id: string;
  user_id: string;
  company_name: string;
  website_url?: string;
  company_description?: string;
  company_logo_url?: string;
  industry: string;
  budget_range_min?: number;
  budget_range_max?: number;
  target_audience?: string;
  partnership_goals?: any;
  location?: string;
  founded_year?: number;
  team_size?: string;
  created_at: string;
  updated_at: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  xp_reward: number;
  cash_reward: number;
  created_at: string;
  current_progress: number;
  max_participants: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  xp_cost?: number;
  cash_price?: number;
  cover_photo_url?: string;
  reward_category?: string;
  quantity_available: number;
  quantity_redeemed: number;
  is_active: boolean;
}

export default function BrandProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sponsorId = searchParams.get('sponsor_id');
  
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [supporters, setSupporters] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const isOwnProfile = user?.id === profile?.user_id;

  useEffect(() => {
    if (sponsorId) {
      fetchProfileData();
      fetchSocialStats();
      fetchSupporters();
    } else if (user) {
      // If no sponsor_id provided, show current user's profile if they're a sponsor
      fetchOwnProfileData();
      fetchSupporters();
    }
  }, [sponsorId, user]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', sponsorId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Fetch campaigns created by this sponsor
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('creator_id', sponsorId)
        .eq('status', 'active')
        .limit(10);

      if (campaignData) setCampaigns(campaignData);

      // Fetch rewards offered by this sponsor
      const { data: rewardData } = await supabase
        .from('rewards')
        .select('*')
        .eq('creator_id', sponsorId)
        .eq('is_active', true)
        .limit(10);

      if (rewardData) setRewards(rewardData);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load brand profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    // For now, return empty array since blocking functionality needs to be implemented
    setBlockedUsers([]);
  };

  const fetchOwnProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Fetch own campaigns
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('creator_id', user?.id)
        .limit(10);

      if (campaignData) setCampaigns(campaignData);

      // Fetch own rewards
      const { data: rewardData } = await supabase
        .from('rewards')
        .select('*')
        .eq('creator_id', user?.id)
        .limit(10);

      if (rewardData) setRewards(rewardData);

    } catch (error) {
      console.error('Error fetching own profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialStats = async () => {
    if (!profile?.user_id) return;

    try {
      // Check if current user follows this sponsor
      if (user?.id && user.id !== profile.user_id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id)
          .single();

        setIsFollowing(!!followData);
      }

      // Get follower count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.user_id);

      // Get following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.user_id);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);

    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id);
        
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.user_id
          });
        
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }

      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: `You are ${isFollowing ? 'no longer' : 'now'} following ${profile.company_name}`,
      });

    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const fetchSupporters = async () => {
    if (!profile?.user_id) return;

    try {
      // Get followers as supporters with proper mapping
      const { data: followersData } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at,
          profiles!follows_follower_id_fkey (
            user_id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Raw followers data:', followersData);

      // Map the data to match UserSearchAndManage expectations
      const mappedSupporters = (followersData || []).map(item => ({
        supporter_id: item.follower_id,
        created_at: item.created_at,
        profiles: item.profiles
      }));

      console.log('Mapped supporters:', mappedSupporters);
      setSupporters(mappedSupporters);

      // If own profile, also get blocked users
      if (isOwnProfile && user?.id) {
        // Note: You'd need to implement a blocked_users table for this
        // For now, keeping empty array
        setBlockedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching supporters:', error);
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'technology': return <Target className="h-4 w-4" />;
      case 'entertainment': return <Star className="h-4 w-4" />;
      case 'fashion': return <Heart className="h-4 w-4" />;
      case 'gaming': return <TrendingUp className="h-4 w-4" />;
      case 'food': return <Award className="h-4 w-4" />;
      default: return <Briefcase className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Brand Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">The brand profile you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <Card className="mb-6 overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={profile.company_logo_url} alt={profile.company_name} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {profile.company_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">{profile.company_name}</h1>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getIndustryIcon(profile.industry)}
                    {profile.industry}
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {profile.company_description}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website_url && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={profile.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        Website
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <span><strong>{followerCount}</strong> Followers</span>
                  <span><strong>{followingCount}</strong> Following</span>
                  <span><strong>{campaigns.length}</strong> Active Campaigns</span>
                  <span><strong>{rewards.length}</strong> Rewards Available</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {!isOwnProfile && user && (
                  <>
                    <Button 
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className="min-w-[120px]"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/inbox?sponsor_id=${profile.user_id}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
                {isOwnProfile && (
                  <Button 
                    onClick={() => navigate('/sponsor-dashboard')}
                    variant="outline"
                  >
                    Dashboard
                  </Button>
                )}
                <UniversalShareButton 
                  type="profile"
                  itemId={profile.user_id}
                  title={profile.company_name}
                  description={profile.company_description || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="smart-links">Smart Links</TabsTrigger>
            <TabsTrigger value="supporters">Supporters</TabsTrigger>
            <TabsTrigger value="haters">Haters</TabsTrigger>
            <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Company Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.budget_range_min && profile.budget_range_max && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Budget: ${profile.budget_range_min.toLocaleString()} - ${profile.budget_range_max.toLocaleString()}</span>
                    </div>
                  )}
                  {profile.target_audience && (
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Target Audience</p>
                        <p className="text-sm text-muted-foreground">{profile.target_audience}</p>
                      </div>
                    </div>
                  )}
                  {profile.partnership_goals && (
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Partnership Goals</p>
                        <p className="text-sm text-muted-foreground">{typeof profile.partnership_goals === 'string' ? profile.partnership_goals : 'Various partnership opportunities'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Activity Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Campaigns</span>
                    <span className="font-medium">{campaigns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rewards Available</span>
                    <span className="font-medium">{rewards.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Followers</span>
                    <span className="font-medium">{followerCount}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Social Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedSocialInteractions 
                    contentId={profile.user_id}
                    contentType="post"
                    targetUserId={profile.user_id}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <SponsorPosts />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Active Campaigns</h2>
              {isOwnProfile && (
                <Button onClick={() => navigate('/campaigns')}>
                  Manage Campaigns
                </Button>
              )}
            </div>
            
            {campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <CardDescription>{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline">{campaign.type}</Badge>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {campaign.xp_reward > 0 && (
                          <Badge variant="secondary">{campaign.xp_reward} XP</Badge>
                        )}
                        {campaign.cash_reward && campaign.cash_reward > 0 && (
                          <Badge variant="secondary">${campaign.cash_reward}</Badge>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {campaign.current_progress} / {campaign.max_participants} participants
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Campaigns</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Create your first campaign to start engaging with creators!" : "This brand hasn't created any campaigns yet."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Available Rewards</h2>
              {isOwnProfile && (
                <Button onClick={() => navigate('/manage-rewards')}>
                  Manage Rewards
                </Button>
              )}
            </div>
            
            {rewards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <Card key={reward.id} className="overflow-hidden">
                    {reward.cover_photo_url && (
                      <div className="aspect-video bg-muted">
                        <img 
                          src={reward.cover_photo_url} 
                          alt={reward.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{reward.title}</CardTitle>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline">{reward.reward_category || 'General'}</Badge>
                        <div className="text-sm text-muted-foreground">
                          {reward.quantity_available - reward.quantity_redeemed} available
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {reward.xp_cost && (
                          <Badge variant="secondary">{reward.xp_cost} XP</Badge>
                        )}
                        {reward.cash_price && (
                          <Badge variant="secondary">${reward.cash_price}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Rewards Available</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Create rewards to incentivize fan engagement!" : "This brand hasn't created any rewards yet."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="smart-links" className="space-y-6">
            {isOwnProfile ? (
              <SmartLinkManager />
            ) : (
              <div className="text-center py-12">
                <Link2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Smart Links</h3>
                <p className="text-sm text-muted-foreground">
                  This brand hasn't created any public smart links yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="supporters" className="space-y-6">
            {isOwnProfile ? (
              <UserSearchAndManage
                type="supporters"
                currentUsers={supporters}
                onUserAdded={fetchSupporters}
                onUserRemoved={fetchSupporters}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Brand Supporters</h2>
                  <Badge variant="outline">{supporters.length} Supporters</Badge>
                </div>
                
                {supporters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supporters.map((supporter: any) => (
                      <Card key={supporter.follower_id} className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={supporter.profiles?.avatar_url} />
                            <AvatarFallback>
                              {supporter.profiles?.display_name?.charAt(0) || supporter.profiles?.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{supporter.profiles?.display_name || supporter.profiles?.username}</h4>
                            <p className="text-sm text-muted-foreground">
                              @{supporter.profiles?.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Following since {new Date(supporter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Supporters Yet</h3>
                      <p className="text-muted-foreground">
                        This brand doesn't have any followers yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="haters" className="space-y-6">
            {isOwnProfile ? (
              <UserSearchAndManage
                type="haters"
                currentUsers={blockedUsers}
                onUserAdded={fetchBlockedUsers}
                onUserRemoved={fetchBlockedUsers}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Content Moderation</h3>
                  <p className="text-muted-foreground">
                    This information is only visible to the brand owner.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="partnerships" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Partnership Opportunities</h2>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Partnership Features Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced partnership management and collaboration tools will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}