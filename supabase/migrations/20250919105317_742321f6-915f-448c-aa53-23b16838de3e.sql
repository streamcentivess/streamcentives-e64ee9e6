-- Content Scheduler Tables
CREATE TABLE IF NOT EXISTS public.scheduled_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'video', 'reel')),
  platforms TEXT[] NOT NULL,
  media_urls TEXT[],
  hashtags TEXT[],
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Templates Table
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('social_post', 'email', 'story', 'campaign')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand Assets Table
CREATE TABLE IF NOT EXISTS public.brand_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'banner', 'font', 'color_palette', 'image', 'video')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk Upload Jobs Table
CREATE TABLE IF NOT EXISTS public.bulk_upload_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  job_name TEXT NOT NULL,
  total_files INTEGER NOT NULL DEFAULT 0,
  processed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  tags TEXT[],
  category TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk Upload Files Table
CREATE TABLE IF NOT EXISTS public.bulk_upload_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.bulk_upload_jobs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  original_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets for content assets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('content-assets', 'content-assets', true),
  ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.scheduled_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_upload_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_content
CREATE POLICY "Users can manage their own scheduled content" ON public.scheduled_content
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for content_templates
CREATE POLICY "Users can manage their own templates" ON public.content_templates
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view public templates" ON public.content_templates
  FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

-- RLS Policies for brand_assets
CREATE POLICY "Users can manage their own brand assets" ON public.brand_assets
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for bulk_upload_jobs
CREATE POLICY "Users can manage their own bulk upload jobs" ON public.bulk_upload_jobs
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for bulk_upload_files
CREATE POLICY "Users can manage their own bulk upload files" ON public.bulk_upload_files
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Storage policies for content-assets bucket
CREATE POLICY "Users can upload content assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view content assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-assets');

CREATE POLICY "Users can update their content assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'content-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their content assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'content-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for brand-assets bucket  
CREATE POLICY "Users can upload brand assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'brand-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view brand assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-assets');

CREATE POLICY "Users can update their brand assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'brand-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their brand assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'brand-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_content_creator_id ON public.scheduled_content(creator_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_time ON public.scheduled_content(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_content_templates_creator_id ON public.content_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_public ON public.content_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_brand_assets_creator_id ON public.brand_assets(creator_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_creator_id ON public.bulk_upload_jobs(creator_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_files_job_id ON public.bulk_upload_files(job_id);

-- Function to update usage count for templates
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.content_templates 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = template_id AND creator_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;