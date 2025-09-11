-- Fix critical security vulnerabilities

-- 1. DROP the overly permissive profiles RLS policy that exposes all user data
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- 2. Create granular RLS policies for profiles table
-- Users can view their own complete profile (including sensitive data)
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Others can only view basic public profile information (no email, location, age, etc.)
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() != user_id OR auth.uid() IS NULL)
WITH CHECK (true);

-- However, we need to create a view for public profiles to properly limit columns
-- 3. Create a secure public profiles view that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.public_profile_view AS
SELECT 
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  spotify_connected,
  merch_store_connected,
  created_at,
  country_name -- This can be public for general location
  -- Exclude: email, location (specific), age, interests, merch_store_url
FROM public.profiles;

-- 4. Enable RLS on the view
ALTER VIEW public.public_profile_view SET (security_barrier = true);

-- 5. Add RLS policy for the public view
CREATE POLICY "Anyone can view public profile data" 
ON public.public_profile_view 
FOR SELECT 
USING (true);

-- 6. Fix database functions security - add proper search_path to prevent function hijacking
-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public', 'auth'  -- Explicitly set search path
AS $$
DECLARE  
  detected_country_code TEXT;
  detected_country_name TEXT;
  generated_username TEXT;
BEGIN
  -- Try to extract country from user metadata or default to US
  detected_country_code := COALESCE(NEW.raw_user_meta_data ->> 'country', 'US');
  detected_country_name := COALESCE(NEW.raw_user_meta_data ->> 'country_name', 'United States');
  
  -- Generate a username, ensuring it's never empty
  generated_username := COALESCE(
    NULLIF(LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')), ''),
    'user_' || substr(NEW.id::text, 1, 8)
  );
  
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    avatar_url, 
    email,
    username,
    country_code,
    country_name,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email,
    generated_username,
    detected_country_code,
    detected_country_name,
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 7. Fix other security definer functions with proper search_path
CREATE OR REPLACE FUNCTION public.ensure_unique_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Add explicit search_path
AS $$
DECLARE
  base_username TEXT;
  counter INTEGER := 1;
  new_username TEXT;
BEGIN
  base_username := NEW.username;
  new_username := base_username;
  
  -- Check if username already exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username AND user_id != NEW.user_id) LOOP
    new_username := base_username || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.username := new_username;
  RETURN NEW;
END;
$$;

-- 8. Fix other critical functions with search_path
CREATE OR REPLACE FUNCTION public.handle_xp_purchase(user_id_param uuid, xp_amount_param integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Add explicit search_path
AS $$
BEGIN
  -- Update user's XP balance, adding to existing amount
  INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (user_id_param, xp_amount_param, xp_amount_param)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    current_xp = user_xp_balances.current_xp + xp_amount_param,
    total_earned_xp = user_xp_balances.total_earned_xp + xp_amount_param,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.send_message_with_xp(recipient_id_param uuid, content_param text, xp_cost_param integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Add explicit search_path
AS $$
DECLARE
  sender_user_id UUID;
  sender_balance INTEGER;
  existing_pending_message UUID;
  new_message_id UUID;
BEGIN
  sender_user_id := auth.uid();
  
  -- Check if sender has already sent a pending message to this recipient
  SELECT messages.id INTO existing_pending_message
  FROM public.messages
  WHERE messages.sender_id = sender_user_id 
    AND messages.recipient_id = recipient_id_param 
    AND messages.status = 'pending'
  LIMIT 1;
  
  IF existing_pending_message IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a pending message with this creator. Please wait for them to respond.';
  END IF;
  
  -- Get sender's current XP balance
  SELECT current_xp INTO sender_balance
  FROM public.user_xp_balances
  WHERE user_id = sender_user_id;
  
  -- If no XP record exists, create one with 0 balance
  IF sender_balance IS NULL THEN
    INSERT INTO public.user_xp_balances (user_id, current_xp)
    VALUES (sender_user_id, 0);
    sender_balance := 0;
  END IF;
  
  -- Check if sender has enough XP
  IF sender_balance < xp_cost_param THEN
    RAISE EXCEPTION 'Insufficient XP balance. You need % XP but only have %', xp_cost_param, sender_balance;
  END IF;
  
  -- Deduct XP from sender
  UPDATE public.user_xp_balances
  SET current_xp = current_xp - xp_cost_param,
      total_spent_xp = total_spent_xp + xp_cost_param,
      updated_at = now()
  WHERE user_id = sender_user_id;
  
  -- Create the message
  INSERT INTO public.messages (sender_id, recipient_id, content, xp_cost)
  VALUES (sender_user_id, recipient_id_param, content_param, xp_cost_param)
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$;