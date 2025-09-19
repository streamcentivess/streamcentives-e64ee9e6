import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentScheduler } from '@/components/ContentScheduler';
import { TemplatesManager } from '@/components/TemplatesManager';
import { BrandAssetsManager } from '@/components/BrandAssetsManager';
import { BulkUploadManager } from '@/components/BulkUploadManager';

const ContentCreatorStudio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Content Creator Studio
            </h1>
            <p className="text-muted-foreground">Streamline your content creation workflow</p>
          </div>
        </div>

        <Tabs defaultValue="scheduler" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scheduler">Content Scheduler</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="assets">Brand Assets</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduler" className="space-y-4">
            <ContentScheduler />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <TemplatesManager />
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <BrandAssetsManager />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <BulkUploadManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentCreatorStudio;