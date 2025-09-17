-- Add YouTube integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN youtube_connected boolean DEFAULT false,
ADD COLUMN youtube_username text,
ADD COLUMN youtube_channel_id text,
ADD COLUMN youtube_connected_at timestamp with time zone;

-- Create index on youtube_channel_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_youtube_channel_id ON public.profiles(youtube_channel_id);

-- Create youtube_accounts table to store YouTube OAuth tokens
CREATE TABLE IF NOT EXISTS public.youtube_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  youtube_channel_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  scope text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, youtube_channel_id)
);

-- Enable RLS on youtube_accounts
ALTER TABLE public.youtube_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for youtube_accounts
CREATE POLICY "Users can manage their own YouTube account" 
ON public.youtube_accounts 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_youtube_accounts_updated_at
  BEFORE UPDATE ON public.youtube_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();