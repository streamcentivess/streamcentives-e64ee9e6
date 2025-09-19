import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Plus, Palette, Image, FileText, Download, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BrandAsset {
  id: string;
  name: string;
  asset_type: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  is_primary: boolean;
  metadata: any;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export const BrandAssetsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<BrandAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    asset_type: '',
    is_primary: false,
    file: null as File | null
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('brand-assets-manager', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast({
        title: "Error",
        description: "Failed to load brand assets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.asset_type || (!formData.file && !editingAsset)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      if (editingAsset && !formData.file) {
        // Update existing asset metadata only
        const { data, error } = await supabase.functions.invoke('brand-assets-manager', {
          body: {
            action: 'update',
            id: editingAsset.id,
            name: formData.name,
            asset_type: formData.asset_type,
            is_primary: formData.is_primary
          }
        });

        if (error) throw error;
      } else if (formData.file) {
        // Upload new file
        const fileBuffer = await formData.file.arrayBuffer();
        
        const { data, error } = await supabase.functions.invoke('brand-assets-manager', {
          body: {
            action: 'upload',
            asset_name: formData.name,
            asset_type: formData.asset_type,
            name: formData.file.name,
            file_data: Array.from(new Uint8Array(fileBuffer)),
            file_size: formData.file.size,
            mime_type: formData.file.type,
            is_primary: formData.is_primary
          }
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Asset ${editingAsset ? 'updated' : 'uploaded'} successfully`
      });

      setShowDialog(false);
      resetForm();
      fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({
        title: "Error",
        description: "Failed to save asset",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      const { error } = await supabase.functions.invoke('brand-assets-manager', {
        body: { action: 'delete', id: assetId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Asset deleted successfully"
      });

      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      asset_type: '',
      is_primary: false,
      file: null
    });
    setEditingAsset(null);
  };

  const openEditDialog = (asset: BrandAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type,
      is_primary: asset.is_primary,
      file: null
    });
    setShowDialog(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'logo':
      case 'banner':
      case 'image':
        return <Image className="h-6 w-6 text-white" />;
      case 'font':
        return <FileText className="h-6 w-6 text-white" />;
      case 'color_palette':
        return <Palette className="h-6 w-6 text-white" />;
      default:
        return <Image className="h-6 w-6 text-white" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Brand Assets</h3>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAsset ? 'Edit' : 'Upload'} Brand Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input 
                  id="asset-name" 
                  placeholder="Enter asset name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="asset-type">Asset Type *</Label>
                <Select value={formData.asset_type} onValueChange={(value) => setFormData(prev => ({ ...prev, asset_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="font">Font</SelectItem>
                    <SelectItem value="color_palette">Color Palette</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="asset-file">Upload File {!editingAsset && '*'}</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Drop files here or click to upload</p>
                  <input
                    type="file"
                    id="asset-file"
                    className="hidden"
                    accept="image/*,video/*,.pdf,.ttf,.otf,.woff,.woff2"
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('asset-file')?.click()}
                  >
                    Select File
                  </Button>
                  {formData.file && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.file.name} ({formatFileSize(formData.file.size)})
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="primary-asset"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked as boolean }))}
                />
                <Label htmlFor="primary-asset">Set as primary asset for this type</Label>
              </div>
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={handleSubmit}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : editingAsset ? 'Update Asset' : 'Upload Asset'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="card-modern">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    {getAssetIcon(asset.asset_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{asset.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(asset.file_size || 0)}
                      </p>
                      {asset.is_primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {asset.asset_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                {(asset.asset_type === 'image' || asset.asset_type === 'logo' || asset.asset_type === 'banner') && (
                  <div className="w-full h-24 bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={asset.file_url} 
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(asset.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(asset)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {assets.length === 0 && (
          <Card className="card-modern col-span-full">
            <CardContent className="p-8 text-center">
              <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No brand assets yet. Upload your first asset!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};