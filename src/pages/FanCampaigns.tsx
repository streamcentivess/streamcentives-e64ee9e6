import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Target, Users, Calendar, MapPin, Music, Star, Trophy, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  xp_reward: number;
  cash_reward: number;
  start_date: string;
  end_date: string;
  status: string;
  creator_id: string;
  target_value: number;
  current_progress: number;
  max_participants: number;
  tags: string[];
  image_url: string;
  creator_profile?: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
  participant_count?: number;
  is_joined?: boolean;
}

const FanCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all active campaigns with creator profiles
      const { data: campaignData, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles:creator_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participation counts and user's join status
      const campaignIds = campaignData?.map(c => c.id) || [];
      let participationData: any[] = [];
      let userParticipation: any[] = [];

      if (campaignIds.length > 0) {
        // Get participant counts
        const { data: participationCounts } = await supabase
          .from('campaign_participants')
          .select('campaign_id')
          .in('campaign_id', campaignIds);

        // Get user's participations
        const { data: userParticipations } = await supabase
          .from('campaign_participants')
          .select('campaign_id')
          .eq('user_id', user.id)
          .in('campaign_id', campaignIds);

        participationData = participationCounts || [];
        userParticipation = userParticipations || [];
      }

      // Process campaigns with additional data
      const processedCampaigns = campaignData?.map(campaign => {
        const participantCount = participationData.filter(p => p.campaign_id === campaign.id).length;
        const isJoined = userParticipation.some(p => p.campaign_id === campaign.id);
        
        return {
          ...campaign,
          creator_profile: campaign.profiles as any,
          participant_count: participantCount,
          is_joined: isJoined
        };
      }) || [];

      setCampaigns(processedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCampaign = async (campaignId: string) => {
    if (!user) return;
    
    setJoinLoading(campaignId);
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          status: 'active',
          progress: 0
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Joined",
            description: "You've already joined this campaign!",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success!",
          description: "You've successfully joined the campaign!"
        });
        // Refresh campaigns to update join status
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error joining campaign:', error);
      toast({
        title: "Error",
        description: "Failed to join campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setJoinLoading(null);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.creator_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || campaign.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getCampaignTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'streaming': return <Music className="h-4 w-4" />;
      case 'social': return <Users className="h-4 w-4" />;
      case 'engagement': return <Star className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Ended';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/fan-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Browse Campaigns
              </h1>
              <p className="text-muted-foreground">Discover and join exciting campaigns from your favorite creators</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search campaigns by title, description, or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="merchandise">Merchandise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Available Campaigns ({filteredCampaigns.length})
            </h2>
          </div>

          {filteredCampaigns.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchQuery || selectedType !== 'all' ? 'No campaigns match your search' : 'No campaigns available'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || selectedType !== 'all' 
                    ? 'Try adjusting your search terms or filters'
                    : 'Check back later for new campaigns from creators'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="card-modern hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCampaignTypeIcon(campaign.type)}
                        <Badge variant="outline" className="text-xs">
                          {campaign.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          +{campaign.xp_reward} XP
                        </div>
                        {campaign.cash_reward > 0 && (
                          <div className="text-sm text-success">
                            +${campaign.cash_reward}
                          </div>
                        )}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Creator Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={campaign.creator_profile?.avatar_url} />
                        <AvatarFallback>
                          {(campaign.creator_profile?.display_name || campaign.creator_profile?.username || 'C').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {campaign.creator_profile?.display_name || campaign.creator_profile?.username || 'Creator'}
                        </div>
                        {campaign.creator_profile?.username && campaign.creator_profile.display_name && (
                          <div className="text-xs text-muted-foreground">
                            @{campaign.creator_profile.username}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {campaign.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.participant_count} joined
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(campaign.end_date)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {campaign.target_value > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{Math.round((campaign.current_progress / campaign.target_value) * 100)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((campaign.current_progress / campaign.target_value) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      {campaign.is_joined ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-gradient-primary hover:opacity-90"
                          onClick={() => handleJoinCampaign(campaign.id)}
                          disabled={joinLoading === campaign.id}
                        >
                          {joinLoading === campaign.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          ) : (
                            <Target className="h-4 w-4 mr-2" />
                          )}
                          Join Campaign
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Detail Modal */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCampaign && getCampaignTypeIcon(selectedCampaign.type)}
              {selectedCampaign?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Creator and Rewards */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedCampaign.creator_profile?.avatar_url} />
                    <AvatarFallback>
                      {(selectedCampaign.creator_profile?.display_name || 'C').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {selectedCampaign.creator_profile?.display_name || 'Creator'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Campaign Creator
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    +{selectedCampaign.xp_reward} XP
                  </div>
                  {selectedCampaign.cash_reward > 0 && (
                    <div className="text-lg text-success">
                      +${selectedCampaign.cash_reward}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Campaign Description</h4>
                <p className="text-muted-foreground">{selectedCampaign.description}</p>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Participants</div>
                  <div className="text-2xl font-bold">{selectedCampaign.participant_count}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Time Remaining</div>
                  <div className="text-lg font-semibold">{formatTimeRemaining(selectedCampaign.end_date)}</div>
                </div>
              </div>

              {/* Progress */}
              {selectedCampaign.target_value > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Campaign Progress</span>
                    <span className="text-sm">
                      {selectedCampaign.current_progress} / {selectedCampaign.target_value}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-gradient-primary h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((selectedCampaign.current_progress / selectedCampaign.target_value) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedCampaign.is_joined && (
                <Badge className="w-fit bg-success/20 text-success">
                  <Trophy className="h-3 w-3 mr-1" />
                  You're participating in this campaign!
                </Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FanCampaigns;