-- Fix security warnings for functions without search_path

-- Fix increment_story_view_count function
CREATE OR REPLACE FUNCTION increment_story_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories
  SET view_count = view_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix expire_old_stories function
CREATE OR REPLACE FUNCTION expire_old_stories()
RETURNS void AS $$
BEGIN
  UPDATE public.stories
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;