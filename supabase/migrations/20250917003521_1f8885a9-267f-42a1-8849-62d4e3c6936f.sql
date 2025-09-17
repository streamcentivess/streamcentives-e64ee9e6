-- Fix security linter warning about security_invoker on the view
-- Remove security_invoker setting to let the view inherit security from underlying table

ALTER VIEW public.public_profiles RESET (security_invoker);

-- The view will now properly respect the RLS policies on the underlying profiles table
-- and only return data that users are authorized to see based on the profiles table RLS policies