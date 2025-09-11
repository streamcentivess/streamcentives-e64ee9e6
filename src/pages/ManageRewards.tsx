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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Upload, Edit, Trash2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  cover_photo_url: string | null;
  rarity: string;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
}

const ManageRewards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

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
  });

  useEffect(() => {
    if (user) {
      fetchRewards();
    }
  }, [user]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-muted text-muted-foreground';
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
                Manage Rewards
              </h1>
              <p className="text-muted-foreground">Create and manage rewards for your fans</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Reward
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editingReward ? 'Edit Reward' : 'Create New Reward'}
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
                      placeholder="e.g., Signed Album"
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
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                        <SelectItem value="experience">Experience</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="access">Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="xp_cost">XP Cost</Label>
                    <Input
                      id="xp_cost"
                      type="number"
                      value={formData.xp_cost}
                      onChange={(e) => handleInputChange('xp_cost', e.target.value)}
                      placeholder="e.g., 1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cash_price">Cash Price ($)</Label>
                    <Input
                      id="cash_price"
                      type="number"
                      step="0.01"
                      value={formData.cash_price}
                      onChange={(e) => handleInputChange('cash_price', e.target.value)}
                      placeholder="e.g., 25.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity Available *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity_available}
                      onChange={(e) => handleInputChange('quantity_available', e.target.value)}
                      placeholder="e.g., 50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rarity">Rarity</Label>
                    <Select value={formData.rarity} onValueChange={(value) => handleInputChange('rarity', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your reward..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_photo_upload">Cover Photo</Label>
                  <div className="flex flex-col gap-2">
                    <Input
                      id="cover_photo_upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverPhotoUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a cover image for your reward (PNG, JPG - Max 10MB)
                    </p>
                    {uploadingCover && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Uploading cover photo...
                      </div>
                    )}
                    {formData.cover_photo_url && (
                      <div className="mt-2">
                        <img 
                          src={formData.cover_photo_url} 
                          alt="Cover preview" 
                          className="w-32 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file_upload">Media File (Optional)</Label>
                  <div className="flex flex-col gap-2">
                    <Input
                      id="file_upload"
                      type="file"
                      accept=".mp3,.mp4,.png,.jpg,.jpeg,.mov,.wav,.m4a"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload media: MP3, MP4, PNG, JPG, MOV, WAV, M4A (Max 50MB)
                    </p>
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Uploading media...
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Or Enter URLs</Label>
                  <div className="grid gap-2">
                    <Input
                      id="cover_photo_url"
                      value={formData.cover_photo_url}
                      onChange={(e) => handleInputChange('cover_photo_url', e.target.value)}
                      placeholder="Cover photo URL (https://example.com/cover.jpg)"
                    />
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="Media file URL (https://example.com/media.mp4)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="e.g., merchandise, limited, signed"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                    {editingReward ? 'Update' : 'Create'} Reward
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rewards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <Card key={reward.id} className="card-modern">
              <CardContent className="p-4">
                {reward.image_url && (
                  <div className="aspect-video bg-surface rounded-lg mb-4 overflow-hidden">
                    <img
                      src={reward.image_url}
                      alt={reward.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{reward.title}</h3>
                    <Badge className={getRarityColor(reward.rarity)}>
                      {reward.rarity}
                    </Badge>
                  </div>

                  {reward.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {reward.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <span className="capitalize">{reward.type}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Available:</span>
                      <span>{reward.quantity_available - reward.quantity_redeemed} / {reward.quantity_available}</span>
                    </div>

                    {reward.xp_cost && (
                      <div className="flex justify-between text-sm">
                        <span>XP Cost:</span>
                        <span className="font-medium text-primary">{reward.xp_cost} XP</span>
                      </div>
                    )}

                    {reward.cash_price && (
                      <div className="flex justify-between text-sm">
                        <span>Cash Price:</span>
                        <span className="font-medium text-success">${reward.cash_price}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                        {reward.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(reward)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleRewardStatus(reward.id, reward.is_active)}
                    >
                      {reward.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(reward.id)}
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

        {rewards.length === 0 && !showCreateForm && (
          <Card className="card-modern">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rewards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first reward to engage with your fans
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Reward
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManageRewards;