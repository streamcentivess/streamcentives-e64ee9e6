-- Add Spotify integration fields to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN spotify_artist_url TEXT,
ADD COLUMN spotify_artist_id TEXT,
ADD COLUMN required_listen_duration_seconds INTEGER DEFAULT 30;