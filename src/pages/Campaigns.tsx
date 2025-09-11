import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Search, Calendar, Users, Trophy, DollarSign, Edit, Trash2, Play, Pause, BarChart3, Target, Eye, Gift, Upload, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_reward: number;
  cash_reward: number | null;
  target_metric: string | null;
  target_value: number | null;
  current_progress: number;
  start_date: string;
  end_date: string | null;
  status: string;
  max_participants: number | null;
  image_url: string | null;
  tags: string[] | null;
  created_at: string;
  participant_count?: number;
  completed_count?: number;
  total_xp_distributed?: number;
  total_cash_distributed?: number;
}

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  progress: number;
  xp_earned: number;
  cash_earned: number;
  status: string;
  completion_date: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Campaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'streaming',
    xp_reward: '',
    cash_reward: '',
    target_metric: '',
    target_value: '',
    start_date: '',
    end_date: '',
    max_participants: '',
    image_url: '',
    content_url: '',
    tags: '',
    merch_product_name: '',
    merch_product_url: '',
    merch_discount_code: '',
  });

  // File upload states
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  // Check URL parameter to auto-show create form
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setShowCreateForm(true);
      // Clean up URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, selectedType, selectedStatus, dateFilter, activeTab]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch stats for each campaign
      const campaignsWithStats = await Promise.all(
        (data || []).map(async (campaign) => {
          const { data: stats } = await supabase.rpc('get_campaign_stats', {
            campaign_id_param: campaign.id
          });
          return { ...campaign, ...stats?.[0] };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          profiles!campaign_participants_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('campaign_id', campaignId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setParticipants(prev => ({ ...prev, [campaignId]: (data as any) || [] }));
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive",
      });
    }
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    // Filter by active tab
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(c => c.status === 'active');
        break;
      case 'completed':
        filtered = filtered.filter(c => c.status === 'completed');
        break;
      case 'draft':
        filtered = filtered.filter(c => c.status === 'draft');
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(campaign => campaign.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === selectedStatus);
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(campaign => {
        const campaignDate = new Date(campaign.start_date);
        const filterDate = new Date(dateFilter);
        return campaignDate >= filterDate;
      });
    }

    setFilteredCampaigns(filtered);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'streaming',
      xp_reward: '',
      cash_reward: '',
      target_metric: '',
      target_value: '',
      start_date: '',
      end_date: '',
      max_participants: '',
      image_url: '',
      content_url: '',
      tags: '',
      merch_product_name: '',
      merch_product_url: '',
      merch_discount_code: '',
    });
    setCoverImageFile(null);
    setContentFile(null);
    setShowCreateForm(false);
    setEditingCampaign(null);
  };

  // File upload handlers
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a PNG or JPEG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setCoverImageFile(file);
  };

  const handleContentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video duration for video files
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        
        if (duration > 300) { // 5 minutes = 300 seconds
          toast({
            title: "Video too long",
            description: "Please select a video shorter than 5 minutes.",
            variant: "destructive",
          });
          return;
        }
        
        setContentFile(file);
      };
      
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('image/')) {
      // Validate image size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setContentFile(file);
    } else if (file.type.startsWith('audio/')) {
      // No size limit for audio files as requested
      setContentFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image, video, or audio file.",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File, bucketName: string, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const getFileTypeDisplay = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    return 'File';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.xp_reward || !formData.start_date) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const campaignData = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        xp_reward: parseInt(formData.xp_reward),
        cash_reward: formData.cash_reward ? parseFloat(formData.cash_reward) : null,
        target_metric: formData.target_metric || null,
        target_value: formData.target_value ? parseInt(formData.target_value) : null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        image_url: formData.image_url || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        creator_id: user?.id,
      };

      let error;
      if (editingCampaign) {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('campaigns')
          .insert([campaignData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign ${editingCampaign ? 'updated' : 'created'} successfully`,
      });

      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setFormData({
      title: campaign.title,
      description: campaign.description || '',
      type: campaign.type,
      xp_reward: campaign.xp_reward.toString(),
      cash_reward: campaign.cash_reward?.toString() || '',
      target_metric: campaign.target_metric || '',
      target_value: campaign.target_value?.toString() || '',
      start_date: new Date(campaign.start_date).toISOString().slice(0, 16),
      end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().slice(0, 16) : '',
      max_participants: campaign.max_participants?.toString() || '',
      image_url: campaign.image_url || '',
      content_url: '',
      tags: campaign.tags?.join(', ') || '',
      merch_product_name: '',
      merch_product_url: '',
      merch_discount_code: '',
    });
    setEditingCampaign(campaign);
    setShowCreateForm(true);
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign ${newStatus}`,
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  const viewParticipants = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    fetchParticipants(campaign.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success';
      case 'completed': return 'bg-primary/20 text-primary';
      case 'paused': return 'bg-warning/20 text-warning';
      case 'draft': return 'bg-muted/20 text-muted-foreground';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'streaming': return '🎵';
      case 'social_media': return '📱';
      case 'engagement': return '💬';
      case 'merchandise': return '👕';
      case 'event': return '🎪';
      case 'challenge': return '🏆';
      default: return '🎯';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedCampaign) {
    const campaignParticipants = participants[selectedCampaign.id] || [];
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCampaign(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {selectedCampaign.title}
              </h1>
              <p className="text-muted-foreground">Campaign Participants</p>
            </div>
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="text-2xl font-bold">{selectedCampaign.participant_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{selectedCampaign.completed_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="xp-orb"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">XP Distributed</p>
                    <p className="text-2xl font-bold">{selectedCampaign.total_xp_distributed || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cash Rewards</p>
                    <p className="text-2xl font-bold">${selectedCampaign.total_cash_distributed || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Participants List */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-4 rounded-lg bg-surface border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.profiles?.avatar_url || ''} />
                        <AvatarFallback>
                          {participant.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{participant.profiles?.display_name || 'Anonymous User'}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(participant.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(participant.status)}>
                        {participant.status}
                      </Badge>
                      <div className="mt-1">
                        <p className="text-sm">Progress: {participant.progress}%</p>
                        <p className="text-sm text-muted-foreground">
                          {participant.xp_earned} XP earned
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {campaignParticipants.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No participants yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Campaign Manager
              </h1>
              <p className="text-muted-foreground">Manage your fan engagement campaigns</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
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
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
              placeholder="Filter by date"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Campaigns ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({campaigns.filter(c => c.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({campaigns.filter(c => c.status === 'completed').length})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({campaigns.filter(c => c.status === 'draft').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Create/Edit Form */}
            {showCreateForm && (
              <Card className="card-modern mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="e.g., Stream Challenge"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="streaming">Streaming</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="engagement">Engagement</SelectItem>
                            <SelectItem value="merchandise">Merchandise</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="challenge">Challenge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="xp_reward">XP Reward *</Label>
                        <Input
                          id="xp_reward"
                          type="number"
                          value={formData.xp_reward}
                          onChange={(e) => handleInputChange('xp_reward', e.target.value)}
                          placeholder="e.g., 100"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cash_reward">Cash Reward ($)</Label>
                        <Input
                          id="cash_reward"
                          type="number"
                          step="0.01"
                          value={formData.cash_reward}
                          onChange={(e) => handleInputChange('cash_reward', e.target.value)}
                          placeholder="e.g., 10.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start_date">Start Date *</Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={formData.start_date}
                          onChange={(e) => handleInputChange('start_date', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          id="end_date"
                          type="datetime-local"
                          value={formData.end_date}
                          onChange={(e) => handleInputChange('end_date', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max_participants">Max Participants</Label>
                        <Input
                          id="max_participants"
                          type="number"
                          value={formData.max_participants}
                          onChange={(e) => handleInputChange('max_participants', e.target.value)}
                          placeholder="Leave empty for unlimited"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target_value">Target Value</Label>
                        <Input
                          id="target_value"
                          type="number"
                          value={formData.target_value}
                          onChange={(e) => handleInputChange('target_value', e.target.value)}
                          placeholder="e.g., 1000 streams"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your campaign..."
                        rows={3}
                      />
                    </div>

                    {/* Campaign Cover Photo */}
                    <div className="space-y-2">
                      <Label>Campaign Cover Photo</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleCoverImageSelect}
                          className="hidden"
                          id="cover-upload"
                        />
                        <label htmlFor="cover-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {coverImageFile ? coverImageFile.name : 'Upload Cover Photo'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPEG up to 10MB
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Content Upload */}
                    <div className="space-y-2">
                      <Label>Campaign Content</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,video/mp4,video/mov,audio/mp3,audio/mpeg"
                          onChange={handleContentFileSelect}
                          className="hidden"
                          id="content-upload"
                        />
                        <label htmlFor="content-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {contentFile ? contentFile.name : 'Upload Content'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Photos (PNG, JPEG), Videos (MP4, MOV - max 5 min), Audio (MP3)
                            </p>
                            {contentFile && (
                              <p className="text-xs text-primary">
                                {getFileTypeDisplay(contentFile.type)} • {(contentFile.size / (1024 * 1024)).toFixed(1)}MB
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="e.g., music, challenge, weekly"
                      />
                    </div>

                    {/* Merchandise Campaign Fields */}
                    {formData.type === 'merchandise' && (
                      <div className="col-span-2 space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Merchandise Details
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="merch_product_name">Product Name</Label>
                            <Input
                              id="merch_product_name"
                              value={formData.merch_product_name}
                              onChange={(e) => handleInputChange('merch_product_name', e.target.value)}
                              placeholder="e.g., Limited Edition T-Shirt"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="merch_product_url">Product URL</Label>
                            <Input
                              id="merch_product_url"
                              value={formData.merch_product_url}
                              onChange={(e) => handleInputChange('merch_product_url', e.target.value)}
                              placeholder="https://your-store.com/product"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="merch_discount_code">Discount Code (Optional)</Label>
                          <Input
                            id="merch_discount_code"
                            value={formData.merch_discount_code}
                            onChange={(e) => handleInputChange('merch_discount_code', e.target.value)}
                            placeholder="e.g., FAN20 for 20% off"
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Link this campaign to specific merchandise in your connected store to track sales and reward fans for purchases.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                        {editingCampaign ? 'Update' : 'Create'} Campaign
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="card-modern">
                  <CardContent className="p-4">
                    {campaign.image_url && (
                      <div className="aspect-video bg-surface rounded-lg mb-4 overflow-hidden">
                        <img
                          src={campaign.image_url}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{campaign.title}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>

                      {campaign.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {campaign.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Type:</span>
                          <span className="capitalize flex items-center gap-1">
                            {getTypeIcon(campaign.type)} {campaign.type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Participants:</span>
                          <span>{campaign.participant_count || 0}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span>XP Reward:</span>
                          <span className="font-medium text-primary">{campaign.xp_reward} XP</span>
                        </div>

                        {campaign.cash_reward && (
                          <div className="flex justify-between text-sm">
                            <span>Cash Reward:</span>
                            <span className="font-medium text-success">${campaign.cash_reward}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span>Start Date:</span>
                          <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
                        </div>

                        {campaign.end_date && (
                          <div className="flex justify-between text-sm">
                            <span>End Date:</span>
                            <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewParticipants(campaign)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        {campaign.status === 'active' || campaign.status === 'paused' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                          >
                            {campaign.status === 'active' ? (
                              <Pause className="h-3 w-3 mr-1" />
                            ) : (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            {campaign.status === 'active' ? 'Pause' : 'Resume'}
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(campaign.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCampaigns.length === 0 && (
              <Card className="card-modern">
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                  <p className="text-muted-foreground mb-4">
                    {campaigns.length === 0 
                      ? 'Create your first campaign to engage with your fans'
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                  {campaigns.length === 0 && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Campaigns;