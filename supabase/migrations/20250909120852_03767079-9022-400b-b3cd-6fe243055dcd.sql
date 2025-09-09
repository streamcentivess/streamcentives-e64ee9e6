-- Restrict visibility of user_follow_stats to authenticated users only
-- Views do not support RLS, so we manage access via privileges

-- Revoke all privileges from PUBLIC and anon
REVOKE ALL PRIVILEGES ON TABLE public.user_follow_stats FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.user_follow_stats FROM anon;

-- Ensure no write access for any regular roles
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_follow_stats FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_follow_stats FROM anon;

-- Grant read-only access to authenticated users and service role
GRANT SELECT ON TABLE public.user_follow_stats TO authenticated;
GRANT SELECT ON TABLE public.user_follow_stats TO service_role;