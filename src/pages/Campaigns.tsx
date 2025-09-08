import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, Users, Target, Music, Share2, Trophy, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  title: string;
  description: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  type: 'streaming' | 'social' | 'engagement' | 'purchase';
  xpReward: number;
  participants: number;
  maxParticipants?: number;
  endDate: string;
  status: 'active' | 'ending_soon' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

// Mock data - replace with real API calls
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Stream "Midnight Dreams" 100 Times',
    description: 'Help push our new single to the top of the charts! Stream "Midnight Dreams" and earn XP for every play.',
    creator: {
      name: 'Luna Rodriguez',
      avatar: '/placeholder-artist.jpg',
      verified: true
    },
    type: 'streaming',
    xpReward: 500,
    participants: 1247,
    maxParticipants: 2000,
    endDate: '2025-01-15',
    status: 'active',
    difficulty: 'easy',
    tags: ['music', 'streaming', 'new-release']
  },
  {
    id: '2',
    title: 'Share Our Concert Announcement',
    description: 'Help spread the word about our upcoming world tour! Share our concert announcement on your social media.',
    creator: {
      name: 'The Electric Beats',
      avatar: '/placeholder-band.jpg',
      verified: true
    },
    type: 'social',
    xpReward: 250,
    participants: 567,
    endDate: '2025-01-10',
    status: 'ending_soon',
    difficulty: 'easy',
    tags: ['social', 'concert', 'promotion']
  },
  {
    id: '3',
    title: 'Ultimate Fan Challenge',
    description: 'Complete multiple tasks: stream 5 songs, share 3 posts, and buy merchandise to become an ultimate fan!',
    creator: {
      name: 'DJ Cosmic',
      avatar: '/placeholder-dj.jpg',
      verified: true
    },
    type: 'engagement',
    xpReward: 1500,
    participants: 234,
    maxParticipants: 500,
    endDate: '2025-01-20',
    status: 'active',
    difficulty: 'hard',
    tags: ['challenge', 'multi-task', 'exclusive']
  },
  {
    id: '4',
    title: 'Pre-order New Album',
    description: 'Be among the first to pre-order our upcoming album "Digital Dreams" and get exclusive early access!',
    creator: {
      name: 'Neon Pulse',
      avatar: '/placeholder-artist2.jpg',
      verified: false
    },
    type: 'purchase',
    xpReward: 750,
    participants: 89,
    maxParticipants: 1000,
    endDate: '2025-01-25',
    status: 'active',
    difficulty: 'medium',
    tags: ['pre-order', 'album', 'early-access']
  }
];

const Campaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    filterCampaigns();
  }, [searchTerm, selectedType, selectedDifficulty, activeTab]);

  const filterCampaigns = () => {
    let filtered = campaigns;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(campaign => campaign.type === selectedType);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(campaign => campaign.difficulty === selectedDifficulty);
    }

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === activeTab);
    }

    setFilteredCampaigns(filtered);
  };

  const joinCampaign = async (campaignId: string) => {
    // Mock join logic - replace with real API call
    toast({
      title: "Campaign Joined!",
      description: "You've successfully joined the campaign. Start earning XP now!",
    });
    
    // Update local state to reflect joined status
    // In real app, this would be handled by your API
  };

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'streaming': return <Music className="h-5 w-5" />;
      case 'social': return <Share2 className="h-5 w-5" />;
      case 'engagement': return <Target className="h-5 w-5" />;
      case 'purchase': return <Trophy className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/20 text-success';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'hard': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success';
      case 'ending_soon': return 'bg-warning/20 text-warning';
      case 'completed': return 'bg-muted/20 text-muted-foreground';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Campaign Discovery
                </h1>
                <p className="text-sm text-muted-foreground">
                  Join campaigns to earn XP and support your favorite creators
                </p>
              </div>
            </div>
            
            {user && (
              <Button onClick={() => navigate('/creator-dashboard')} className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, creators, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Campaign Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="streaming">Streaming</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Campaigns</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="ending_soon">Ending Soon</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Campaign Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="card-modern group hover:scale-105 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCampaignIcon(campaign.type)}
                        <Badge variant="outline" className={getDifficultyColor(campaign.difficulty)}>
                          {campaign.difficulty}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-lg leading-tight">
                      {campaign.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>
                    
                    {/* Creator Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={campaign.creator.avatar} />
                        <AvatarFallback>{campaign.creator.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {campaign.creator.name}
                          {campaign.creator.verified && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              ✓
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Campaign Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reward:</span>
                        <p className="font-semibold text-primary">
                          {campaign.xpReward.toLocaleString()} XP
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Participants:</span>
                        <p className="font-semibold">
                          {campaign.participants.toLocaleString()}
                          {campaign.maxParticipants && `/${campaign.maxParticipants.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    
                    {/* End Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {campaign.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Join Button */}
                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90"
                      onClick={() => joinCampaign(campaign.id)}
                      disabled={campaign.status === 'completed'}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {campaign.status === 'completed' ? 'Campaign Ended' : 'Join Campaign'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredCampaigns.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to find more campaigns.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Campaigns;