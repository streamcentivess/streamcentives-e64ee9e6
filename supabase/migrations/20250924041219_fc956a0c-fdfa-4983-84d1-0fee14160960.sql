-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'creator', 'fan', 'sponsor');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create streamseeker admin actions table
CREATE TABLE public.streamseeker_admin_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    artist_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- 'approve', 'reject', 'request_changes'
    previous_status TEXT,
    new_status TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin actions
ALTER TABLE public.streamseeker_admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin actions
CREATE POLICY "Admins can view all actions"
ON public.streamseeker_admin_actions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create actions"
ON public.streamseeker_admin_actions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Artists can view actions on their profile
CREATE POLICY "Artists can view their own actions"
ON public.streamseeker_admin_actions
FOR SELECT
USING (auth.uid() = artist_id);

-- Function for admin approval/rejection
CREATE OR REPLACE FUNCTION public.admin_review_streamseeker_artist(
    artist_user_id UUID,
    action_type_param TEXT,
    admin_notes_param TEXT DEFAULT NULL,
    rejection_reason_param TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    admin_user_id UUID;
    artist_record public.streamseeker_artists;
    new_status TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check if user is admin
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Get current artist record
    SELECT * INTO artist_record
    FROM public.streamseeker_artists
    WHERE user_id = artist_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Artist not found');
    END IF;
    
    -- Determine new status based on action
    CASE action_type_param
        WHEN 'approve' THEN
            new_status := 'approved';
            notification_title := 'Streamseeker Application Approved!';
            notification_message := 'Congratulations! Your Streamseeker application has been approved. You can now be discovered by fans.';
        WHEN 'reject' THEN
            new_status := 'rejected';
            notification_title := 'Streamseeker Application Update';
            notification_message := 'Your Streamseeker application needs some changes: ' || COALESCE(rejection_reason_param, 'Please check your profile and try again.');
        WHEN 'request_changes' THEN
            new_status := 'pending';
            notification_title := 'Streamseeker Application - Changes Requested';
            notification_message := 'Please make the following changes to your Streamseeker profile: ' || COALESCE(rejection_reason_param, 'Check your profile for required updates.');
        ELSE
            RETURN json_build_object('success', false, 'error', 'Invalid action type');
    END CASE;
    
    -- Update artist status
    UPDATE public.streamseeker_artists
    SET eligibility_status = new_status,
        approved_at = CASE WHEN action_type_param = 'approve' THEN now() ELSE NULL END,
        updated_at = now()
    WHERE user_id = artist_user_id;
    
    -- Log admin action
    INSERT INTO public.streamseeker_admin_actions (
        admin_id, artist_id, action_type, previous_status, new_status,
        admin_notes, rejection_reason
    ) VALUES (
        admin_user_id, artist_user_id, action_type_param, 
        artist_record.eligibility_status, new_status,
        admin_notes_param, rejection_reason_param
    );
    
    -- Create notification for artist
    INSERT INTO public.notifications (
        user_id, type, title, message, priority
    ) VALUES (
        artist_user_id, 'streamseeker_review', notification_title, 
        notification_message, 'high'
    );
    
    RETURN json_build_object(
        'success', true,
        'action', action_type_param,
        'previous_status', artist_record.eligibility_status,
        'new_status', new_status,
        'artist_id', artist_user_id
    );
END;
$$;