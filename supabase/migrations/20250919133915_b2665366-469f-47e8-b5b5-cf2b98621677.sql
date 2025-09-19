-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  rules TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  avatar_url TEXT,
  banner_url TEXT,
  CONSTRAINT unique_community_name_per_creator UNIQUE(creator_id, name)
);

-- Create community_members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_posts table  
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Communities are publicly viewable" 
ON public.communities FOR SELECT 
USING (is_public = true OR EXISTS (
  SELECT 1 FROM public.community_members 
  WHERE community_id = communities.id AND user_id = auth.uid()
));

CREATE POLICY "Users can create communities" 
ON public.communities FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their communities" 
ON public.communities FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their communities" 
ON public.communities FOR DELETE 
USING (auth.uid() = creator_id);

-- Community members policies
CREATE POLICY "Community members are viewable by community members" 
ON public.community_members FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.community_members cm2
  WHERE cm2.community_id = community_members.community_id 
  AND cm2.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.communities c
  WHERE c.id = community_members.community_id AND c.is_public = true
));

CREATE POLICY "Users can join public communities" 
ON public.community_members FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.communities c 
  WHERE c.id = community_id AND c.is_public = true
));

CREATE POLICY "Users can leave communities" 
ON public.community_members FOR DELETE 
USING (auth.uid() = user_id);

-- Community posts policies
CREATE POLICY "Community posts are viewable by community members" 
ON public.community_posts FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.community_members 
  WHERE community_id = community_posts.community_id AND user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.communities c
  WHERE c.id = community_posts.community_id AND c.is_public = true
));

CREATE POLICY "Community members can create posts" 
ON public.community_posts FOR INSERT 
WITH CHECK (auth.uid() = author_id AND EXISTS (
  SELECT 1 FROM public.community_members 
  WHERE community_id = community_posts.community_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their own posts" 
ON public.community_posts FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
ON public.community_posts FOR DELETE 
USING (auth.uid() = author_id);

-- Function to update member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update member count
CREATE TRIGGER update_community_member_count_trigger
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Automatically add creator as admin member when community is created
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_creator_as_admin_trigger
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION add_creator_as_admin();