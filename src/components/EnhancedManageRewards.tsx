import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedRealtime } from '@/hooks/useOptimizedRealtime';
import { 
  ArrowLeft, Plus, Upload, Edit, Trash2, Package, Heart, Eye, 
  ShoppingCart, TrendingUp, Filter, Search, Star, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { toast as sonnerToast } from 'sonner';

interface Reward {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_cost: number | null;
  cash_price: number | null;
  currency: string;
  quantity_available: number;
  quantity_redeemed: number;
  image_url: string | null;
  cover_photo_url?: string | null;
  rarity: string;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
}

interface RedemptionWithReward {
  id: string;
  reward: Reward;
  user_id: string;
  status: string;
  can_be_listed: boolean;
  is_listed_on_marketplace: boolean;
  marketplace_listing_id: string | null;
  created_at: string;
}

const EnhancedManageRewards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hapticImpact } = useMobileCapabilities();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<RedemptionWithReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState('created');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showListingDialog, setShowListingDialog] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionWithReward | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [listingPriceXP, setListingPriceXP] = useState('');
  const [listingDescription, setListingDescription] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'merchandise',
    xp_cost: '',
    cash_price: '',
    quantity_available: '',
    image_url: '',
    cover_photo_url: '',
    rarity: 'common',
    tags: '',
    delivery_type: 'manual',
    instant_delivery: false,
    creator_xp_only: false,
    external_url: '',
  });

  useEffect(() => {
    if (user) {
      fetchRewards();
      fetchUserRedemptions();
    }
  }, [user]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*, cover_photo_url')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: "Error",
        description: "Failed to load rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards (
            *
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRedemptions(data || []);
    } catch (error) {
      console.error('Error fetching user redemptions:', error);
    }
  };

  const handleCreateListing = async (redemption: RedemptionWithReward) => {
    await hapticImpact();
    setSelectedRedemption(redemption);
    setListingDescription(redemption.reward.description || '');
    setShowListingDialog(true);
  };

  const submitListing = async () => {
    if (!selectedRedemption || (!listingPrice && !listingPriceXP)) {
      toast({
        title: "Error",
        description: "Please set either cash price or XP price",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-marketplace-listing', {
        body: {
          redemptionId: selectedRedemption.id,
          askingPriceCents: listingPrice ? Math.round(parseFloat(listingPrice) * 100) : null,
          askingPriceXP: listingPriceXP ? parseInt(listingPriceXP) : null,
          description: listingDescription
        }
      });

      if (error) throw error;

      if (data.success) {
        sonnerToast.success('Listing created successfully!');
        setShowListingDialog(false);
        setListingPrice('');
        setListingPriceXP('');
        setListingDescription('');
        setSelectedRedemption(null);
        fetchUserRedemptions();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
    }
  };

  const categories = [
    { id: 'all', name: 'All Types', count: rewards.length },
    { id: 'merchandise', name: 'Merchandise', count: rewards.filter(r => r.type === 'merchandise').length },
    { id: 'experience', name: 'Experience', count: rewards.filter(r => r.type === 'experience').length },
    { id: 'digital', name: 'Digital', count: rewards.filter(r => r.type === 'digital').length },
    { id: 'access', name: 'Access', count: rewards.filter(r => r.type === 'access').length }
  ];

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'text-green-600';
      case 'like_new': return 'text-blue-600';
      case 'good': return 'text-yellow-600';
      case 'fair': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be under 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type (only images for cover photos)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Cover photo must be an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max for cover photos)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Cover photo size must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `covers/${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_photo_url: publicUrl }));

      toast({
        title: "Success",
        description: "Cover photo uploaded successfully",
      });
    } catch (error) {
      console.error('Cover photo upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload cover photo",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'merchandise',
      xp_cost: '',
      cash_price: '',
      quantity_available: '',
      image_url: '',
      cover_photo_url: '',
      rarity: 'common',
      tags: '',
      delivery_type: 'manual',
      instant_delivery: false,
      creator_xp_only: false,
      external_url: '',
    });
    setShowCreateForm(false);
    setEditingReward(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.quantity_available) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.xp_cost && !formData.cash_price) {
      toast({
        title: "Error",
        description: "Please set either XP cost or cash price",
        variant: "destructive",
      });
      return;
    }

    try {
      const rewardData = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        xp_cost: formData.xp_cost ? parseInt(formData.xp_cost) : null,
        cash_price: formData.cash_price ? parseFloat(formData.cash_price) : null,
        quantity_available: parseInt(formData.quantity_available),
        image_url: formData.image_url || null,
        rarity: formData.rarity,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        creator_id: user?.id,
        delivery_type: formData.delivery_type,
        instant_delivery: formData.delivery_type !== 'manual',
        creator_xp_only: formData.creator_xp_only,
        external_url: formData.external_url || null,
      };

      let error;
      if (editingReward) {
        const { error: updateError } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingReward.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('rewards')
          .insert([rewardData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Reward ${editingReward ? 'updated' : 'created'} successfully`,
      });

      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast({
        title: "Error",
        description: "Failed to save reward",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (reward: Reward) => {
    setFormData({
      title: reward.title,
      description: reward.description || '',
      type: reward.type,
      xp_cost: reward.xp_cost?.toString() || '',
      cash_price: reward.cash_price?.toString() || '',
      quantity_available: reward.quantity_available.toString(),
      image_url: reward.image_url || '',
      cover_photo_url: reward.cover_photo_url || '',
      rarity: reward.rarity,
      tags: reward.tags?.join(', ') || '',
      delivery_type: (reward as any).delivery_type || 'manual',
      instant_delivery: (reward as any).instant_delivery || false,
      creator_xp_only: (reward as any).creator_xp_only || false,
      external_url: (reward as any).external_url || '',
    });
    setEditingReward(reward);
    setShowCreateForm(true);
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reward deleted successfully",
      });

      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast({
        title: "Error",
        description: "Failed to delete reward",
        variant: "destructive",
      });
    }
  };

  const toggleRewardStatus = async (rewardId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !currentStatus })
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Reward ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchRewards();
    } catch (error) {
      console.error('Error updating reward status:', error);
      toast({
        title: "Error",
        description: "Failed to update reward status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
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
              <h1 className="text-2xl font-bold mb-2">Enhanced Marketplace Management</h1>
              <p className="text-muted-foreground">Create rewards and manage your marketplace listings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="created" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Created Rewards ({rewards.length})
            </TabsTrigger>
            <TabsTrigger value="owned" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Owned Rewards ({userRedemptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search rewards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Reward
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="whitespace-nowrap"
                      >
                        {category.name}
                        <Badge variant="secondary" className="ml-1">
                          {category.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Grid */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Created Rewards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRewards.map((reward) => (
                  <Card key={reward.id} className="overflow-hidden">
                    <div className="relative">
                      {(reward.cover_photo_url || reward.image_url) && (
                        <img 
                          src={reward.cover_photo_url || reward.image_url} 
                          alt={reward.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <Badge className={`absolute top-2 left-2 ${getRarityColor(reward.rarity)}`}>
                        {reward.rarity}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-background/80"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold line-clamp-2">{reward.title}</h3>
                          <div className="text-right">
                            {reward.cash_price && (
                              <p className="font-bold text-lg">${reward.cash_price}</p>
                            )}
                            {reward.xp_cost && (
                              <p className="text-sm text-muted-foreground">
                                or {reward.xp_cost.toLocaleString()} XP
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {reward.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {reward.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {reward.type}
                            </Badge>
                            <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                              {reward.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            {reward.quantity_available - reward.quantity_redeemed}/{reward.quantity_available}
                          </div>
                        </div>
                        
                        {reward.tags && (
                          <div className="flex gap-1 flex-wrap">
                            {reward.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(reward)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="owned" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Your Owned Rewards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userRedemptions.map((redemption) => (
                  <Card key={redemption.id} className="overflow-hidden">
                    <div className="relative">
                      {(redemption.reward.cover_photo_url || redemption.reward.image_url) && (
                        <img 
                          src={redemption.reward.cover_photo_url || redemption.reward.image_url} 
                          alt={redemption.reward.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <Badge className={`absolute top-2 left-2 ${getRarityColor(redemption.reward.rarity)}`}>
                        {redemption.reward.rarity}
                      </Badge>
                      {redemption.is_listed_on_marketplace && (
                        <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                          Listed
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold line-clamp-2">{redemption.reward.title}</h3>
                        
                        {redemption.reward.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {redemption.reward.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {redemption.reward.type}
                          </Badge>
                          <Badge variant={redemption.status === 'completed' ? 'default' : 'secondary'}>
                            {redemption.status}
                          </Badge>
                        </div>
                        
                        {redemption.reward.tags && (
                          <div className="flex gap-1 flex-wrap">
                            {redemption.reward.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          {redemption.status === 'completed' && 
                           redemption.can_be_listed && 
                           !redemption.is_listed_on_marketplace && (
                            <Button 
                              className="flex-1"
                              onClick={() => handleCreateListing(redemption)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              List for Sale
                            </Button>
                          )}
                          {redemption.is_listed_on_marketplace && (
                            <Button variant="outline" className="flex-1" disabled>
                              Listed on Marketplace
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Listing Dialog */}
        <Dialog open={showListingDialog} onOpenChange={setShowListingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>List Reward for Sale</DialogTitle>
            </DialogHeader>
            
            {selectedRedemption && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedRedemption.reward.cover_photo_url || selectedRedemption.reward.image_url || '/placeholder.svg'} 
                    alt={selectedRedemption.reward.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium">{selectedRedemption.reward.title}</h3>
                    <Badge className={getRarityColor(selectedRedemption.reward.rarity)}>
                      {selectedRedemption.reward.rarity}
                    </Badge>
                  </div>
                </div>
                
                <Tabs defaultValue="cash" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cash">Cash Price</TabsTrigger>
                    <TabsTrigger value="xp">XP Price</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cash" className="space-y-4">
                    <div>
                      <Label htmlFor="cash-price">Price ($)</Label>
                      <Input
                        id="cash-price"
                        type="number"
                        step="0.01"
                        placeholder="Enter price in USD"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="xp" className="space-y-4">
                    <div>
                      <Label htmlFor="xp-price">Price (XP)</Label>
                      <Input
                        id="xp-price"
                        type="number"
                        placeholder="Enter XP amount"
                        value={listingPriceXP}
                        onChange={(e) => setListingPriceXP(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div>
                  <Label htmlFor="listing-description">Description (Optional)</Label>
                  <Textarea
                    id="listing-description"
                    placeholder="Add details about your listing..."
                    value={listingDescription}
                    onChange={(e) => setListingDescription(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={submitListing}
                    className="flex-1 bg-gradient-primary text-white"
                  >
                    Create Listing
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowListingDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EnhancedManageRewards;
