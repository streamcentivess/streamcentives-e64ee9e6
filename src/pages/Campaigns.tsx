import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useOptimizedRealtime } from '@/hooks/useOptimizedRealtime';
import { useDebounced } from '@/hooks/useDebounced';
import { SkeletonGrid, SkeletonCard } from '@/components/ui/skeleton-loader';
import { CampaignCard } from '@/components/CampaignCard';

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
    username: string | null;
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

  // Optimized campaign fetching with better performance
  const fetchCampaigns = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch campaigns with basic query
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch stats for each campaign in parallel
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
        description: "Failed to load campaigns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Debounced filter function for better performance
  const debouncedFilterCampaigns = useDebounced(() => {
    filterCampaigns();
  }, 300);

  // Memoized filtered campaigns for performance
  const memoizedFilteredCampaigns = useMemo(() => {
    return filteredCampaigns;
  }, [filteredCampaigns]);

  // Optimized real-time subscription
  useOptimizedRealtime({
    table: 'campaigns',
    filter: `creator_id=eq.${user?.id}`,
    onUpdate: fetchCampaigns,
    debounceMs: 500,
    enabled: !!user?.id,
  });

  useOptimizedRealtime({
    table: 'campaign_participants',
    onUpdate: fetchCampaigns,
    debounceMs: 300,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user, fetchCampaigns]);

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
    debouncedFilterCampaigns();
  }, [campaigns, searchTerm, selectedType, selectedStatus, dateFilter, activeTab, debouncedFilterCampaigns]);

  const filterCampaigns = () => {
    let filtered = campaigns;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(campaign => campaign.type === selectedType);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === selectedStatus);
    }

    // Apply active tab filter
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(campaign => campaign.status === 'active');
        break;
      case 'completed':
        filtered = filtered.filter(campaign => campaign.status === 'completed');
        break;
      case 'draft':
        filtered = filtered.filter(campaign => campaign.status === 'draft');
        break;
      case 'paused':
        filtered = filtered.filter(campaign => campaign.status === 'paused');
        break;
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(campaign => {
        const campaignDate = new Date(campaign.start_date);
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
    
    if (!user) return;

    try {
      setUploading(true);

      // Upload files if selected
      let coverImageUrl = formData.image_url;
      let contentUrl = formData.content_url;

      if (coverImageFile) {
        coverImageUrl = await uploadFile(coverImageFile, 'posts', 'campaign-covers');
      }

      if (contentFile) {
        contentUrl = await uploadFile(contentFile, 'posts', 'campaign-content');
      }

      const campaignData = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        xp_reward: parseInt(formData.xp_reward) || 0,
        cash_reward: parseFloat(formData.cash_reward) || 0,
        target_metric: formData.target_metric || null,
        target_value: parseInt(formData.target_value) || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        max_participants: parseInt(formData.max_participants) || null,
        image_url: coverImageUrl || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        creator_id: user.id,
      };

      let campaignResult;
      if (editingCampaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
        
        if (error) throw error;
        campaignResult = { data: editingCampaign };
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert([campaignData])
          .select()
          .single();
        
        if (error) throw error;
        campaignResult = { data };
      }

      // Store content URL if uploaded
      if (contentUrl && campaignResult.data) {
        await supabase
          .from('campaign_assets')
          .insert({
            campaign_id: campaignResult.data.id,
            asset_type: contentFile ? getFileTypeDisplay(contentFile.type).toLowerCase() : 'url',
            asset_data: { url: contentUrl, filename: contentFile?.name }
          });
      }

      // Reset form
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

      toast({
        title: "Success",
        description: `Campaign ${editingCampaign ? 'updated' : 'created'} successfully!`,
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to save campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const fetchParticipants = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Participant interface without profiles for now
      const validParticipants = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        joined_at: item.joined_at,
        progress: item.progress,
        xp_earned: item.xp_earned,
        cash_earned: item.cash_earned,
        status: item.status,
        completion_date: item.completion_date,
        profiles: null // Will be fetched separately if needed
      })) as Participant[];
      
      setParticipants(prev => ({ ...prev, [campaignId]: validParticipants }));
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Error",
        description: "Failed to fetch participants",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    fetchParticipants(campaign.id);
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
        description: "Campaign deleted successfully!",
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
        description: `Campaign ${newStatus === 'active' ? 'resumed' : 'paused'} successfully!`,
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonGrid count={6} columns={3} />
      </div>
    );
  }

  if (selectedCampaign) {
    const campaignParticipants = participants[selectedCampaign.id] || [];
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCampaign(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{selectedCampaign.title}</CardTitle>
                  <Badge variant={selectedCampaign.status === 'active' ? 'default' : 'secondary'} className="mt-2">
                    {selectedCampaign.status}
                  </Badge>
                </div>
                {selectedCampaign.image_url && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden">
                    <img 
                      src={selectedCampaign.image_url} 
                      alt={selectedCampaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{selectedCampaign.participant_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Participants</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{selectedCampaign.completed_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">{selectedCampaign.total_xp_distributed || 0}</div>
                    <div className="text-sm text-muted-foreground">XP Distributed</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">${selectedCampaign.total_cash_distributed || 0}</div>
                    <div className="text-sm text-muted-foreground">Cash Distributed</div>
                  </div>
                </div>
              </div>

              {selectedCampaign.description && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedCampaign.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participants ({campaignParticipants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignParticipants.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No participants yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {campaignParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            {participant.profiles?.display_name?.charAt(0) || 
                             participant.profiles?.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {participant.profiles?.display_name || participant.profiles?.username || 'Anonymous'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined {new Date(participant.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={participant.status === 'completed' ? 'default' : 'secondary'}>
                          {participant.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Progress: {participant.progress}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your fan engagement campaigns
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Campaign Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="streaming">Streaming</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="vote">Voting</SelectItem>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Campaign Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter campaign title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Campaign Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="streaming">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Streaming Campaign
                        </div>
                      </SelectItem>
                      <SelectItem value="social">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Social Media Campaign
                        </div>
                      </SelectItem>
                      <SelectItem value="vote">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Voting Campaign
                        </div>
                      </SelectItem>
                      <SelectItem value="merchandise">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Merchandise Campaign
                        </div>
                      </SelectItem>
                      <SelectItem value="upload">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Campaign
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="xp_reward">XP Reward</Label>
                    <Input
                      id="xp_reward"
                      type="number"
                      value={formData.xp_reward}
                      onChange={(e) => handleInputChange('xp_reward', e.target.value)}
                      placeholder="0"
                      min="0"
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
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={uploading}>
                  {uploading ? 'Uploading...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Campaign Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              {memoizedFilteredCampaigns.length} campaign{memoizedFilteredCampaigns.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <SkeletonGrid count={6} columns={3} />
          ) : memoizedFilteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {activeTab === 'all' ? 'No campaigns yet' : `No ${activeTab} campaigns`}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {activeTab === 'all' 
                    ? "Create your first campaign to start engaging with your fans!"
                    : `You don't have any ${activeTab} campaigns at the moment.`
                  }
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memoizedFilteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={toggleCampaignStatus}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Campaigns;