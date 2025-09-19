import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkUploadJob {
  id: string;
  job_name: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  status: 'processing' | 'completed' | 'failed';
  tags?: string[];
  category?: string;
  created_at: string;
  updated_at: string;
}

interface UploadFile {
  id: string;
  original_name: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'uploaded' | 'failed';
  error_message?: string;
}

export const BulkUploadManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [jobs, setJobs] = useState<BulkUploadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    job_name: '',
    category: '',
    tags: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('bulk-upload-manager', {
        body: { action: 'list_jobs' }
      });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load upload jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const startBulkUpload = async () => {
    if (!formData.job_name || selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a job name and select files",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      // Create bulk upload job
      const { data: job, error: jobError } = await supabase.functions.invoke('bulk-upload-manager', {
        body: {
          action: 'create_job',
          job_name: formData.job_name,
          total_files: selectedFiles.length,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          category: formData.category
        }
      });

      if (jobError) throw jobError;

      // Add files to the job
      const fileInfos = selectedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

      const { data: files, error: filesError } = await supabase.functions.invoke('bulk-upload-manager', {
        body: {
          action: 'add_files',
          job_id: job.id,
          files: fileInfos
        }
      });

      if (filesError) throw filesError;

      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileRecord = files[i];
        
        try {
          const fileBuffer = await file.arrayBuffer();
          
          await supabase.functions.invoke('bulk-upload-manager', {
            body: {
              action: 'process_file',
              job_id: job.id,
              file_id: fileRecord.id,
              original_name: file.name,
              file_data: Array.from(new Uint8Array(fileBuffer)),
              file_size: file.size,
              mime_type: file.type
            }
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
        }
      }

      toast({
        title: "Success",
        description: "Bulk upload started successfully"
      });

      setShowDialog(false);
      resetForm();
      setSelectedFiles([]);
      fetchJobs();
    } catch (error) {
      console.error('Error starting bulk upload:', error);
      toast({
        title: "Error",
        description: "Failed to start bulk upload",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      job_name: '',
      category: '',
      tags: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (job: BulkUploadJob) => {
    if (job.total_files === 0) return 0;
    return ((job.processed_files + job.failed_files) / job.total_files) * 100;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bulk Upload</h3>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              New Bulk Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Start Bulk Upload</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="job-name">Job Name *</Label>
                <Input 
                  id="job-name" 
                  placeholder="Enter job name"
                  value={formData.job_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="brand">Brand Assets</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input 
                    id="tags" 
                    placeholder="tag1, tag2, tag3"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bulk-files">Select Files *</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Drop files here or click to browse</p>
                  <input
                    type="file"
                    id="bulk-files"
                    multiple
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf"
                    onChange={handleFileSelect}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('bulk-files')?.click()}
                  >
                    Select Files
                  </Button>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 text-left">
                      <p className="text-sm font-medium mb-1">{selectedFiles.length} files selected:</p>
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {selectedFiles.map((file, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={startBulkUpload}
                disabled={uploading || selectedFiles.length === 0}
              >
                {uploading ? 'Starting Upload...' : 'Start Bulk Upload'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Recent Upload Jobs</h4>
        {jobs.map((job) => (
          <Card key={job.id} className="card-modern">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(job.status)}
                  {job.job_name}
                </CardTitle>
                {getStatusBadge(job.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {job.processed_files + job.failed_files} / {job.total_files} files
                    </span>
                  </div>
                  <Progress value={calculateProgress(job)} className="h-2" />
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="space-x-4">
                    <span>✓ {job.processed_files} uploaded</span>
                    {job.failed_files > 0 && <span className="text-red-500">✗ {job.failed_files} failed</span>}
                  </div>
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                {job.tags && job.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {job.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {jobs.length === 0 && (
          <Card className="card-modern">
            <CardContent className="p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No upload jobs yet. Start your first bulk upload!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};