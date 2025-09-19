-- Drop existing function first
DROP FUNCTION IF EXISTS public.search_public_profiles(text, integer, integer);

-- Create social interaction notifications system
CREATE OR REPLACE FUNCTION public.create_social_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  actor_name TEXT;
BEGIN
  -- Get actor's display name
  SELECT COALESCE(display_name, username, 'Someone') INTO actor_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;

  -- Handle different interaction types
  CASE NEW.interaction_type
    WHEN 'like' THEN
      notification_title := 'New Like';
      notification_message := actor_name || ' liked your ' || NEW.content_type;
    WHEN 'comment' THEN
      notification_title := 'New Comment';
      notification_message := actor_name || ' commented on your ' || NEW.content_type;
    WHEN 'repost' THEN
      notification_title := 'Content Reposted';
      notification_message := actor_name || ' reposted your ' || NEW.content_type;
    WHEN 'share' THEN
      notification_title := 'Content Shared';
      notification_message := actor_name || ' shared your ' || NEW.content_type;
    ELSE
      notification_title := 'New Interaction';
      notification_message := actor_name || ' interacted with your content';
  END CASE;

  -- Create notification for content owner
  IF NEW.target_user_id IS NOT NULL AND NEW.target_user_id != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id, type, title, message, data, priority
    ) VALUES (
      NEW.target_user_id,
      'social_interaction',
      notification_title,
      notification_message,
      jsonb_build_object(
        'interaction_type', NEW.interaction_type,
        'content_type', NEW.content_type,
        'content_id', NEW.target_content_id,
        'actor_id', NEW.user_id,
        'actor_name', actor_name
      ),
      'normal'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for social interaction notifications
DROP TRIGGER IF EXISTS trigger_social_notification ON public.social_interactions;
CREATE TRIGGER trigger_social_notification
  AFTER INSERT ON public.social_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_social_notification();

-- Create profile view tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL,
  viewed_user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT, -- 'discovery', 'profile_modal', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profile_views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Create policy for profile views
CREATE POLICY "Users can create profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Profile owners can view their profile views"
ON public.profile_views
FOR SELECT
USING (auth.uid() = viewed_user_id);

-- Create function to safely search public profiles
CREATE OR REPLACE FUNCTION public.search_public_profiles(
  search_query TEXT,
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  spotify_connected BOOLEAN,
  merch_store_connected BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.country_name,
    p.created_at,
    p.spotify_connected,
    p.merch_store_connected
  FROM public.profiles p
  WHERE (
    p.username ILIKE '%' || search_query || '%' OR
    p.display_name ILIKE '%' || search_query || '%' OR
    p.bio ILIKE '%' || search_query || '%'
  )
  AND p.username IS NOT NULL
  ORDER BY 
    CASE 
      WHEN p.username ILIKE search_query || '%' THEN 1
      WHEN p.display_name ILIKE search_query || '%' THEN 2
      ELSE 3
    END,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;