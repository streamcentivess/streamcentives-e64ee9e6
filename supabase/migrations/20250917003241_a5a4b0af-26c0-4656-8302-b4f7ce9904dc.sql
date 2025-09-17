-- Fix remaining security linter warnings for functions missing search_path

-- Fix calculate_creator_daily_analytics function
CREATE OR REPLACE FUNCTION public.calculate_creator_daily_analytics(creator_user_id uuid, target_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.creator_analytics (
    creator_id,
    date,
    total_fans,
    new_fans,
    total_campaigns,
    active_campaigns,
    total_xp_awarded,
    total_cash_awarded,
    total_messages_received,
    total_message_revenue_cents
  )
  SELECT 
    creator_user_id,
    target_date,
    COALESCE(fan_counts.total_fans, 0),
    COALESCE(fan_counts.new_fans, 0),
    COALESCE(campaign_stats.total_campaigns, 0),
    COALESCE(campaign_stats.active_campaigns, 0),
    COALESCE(xp_stats.total_xp, 0),
    COALESCE(cash_stats.total_cash, 0),
    COALESCE(message_stats.message_count, 0),
    COALESCE(message_stats.revenue_cents, 0)
  FROM (
    SELECT 
      COUNT(*) as total_fans,
      COUNT(*) FILTER (WHERE DATE(f.created_at) = target_date) as new_fans
    FROM follows f
    WHERE f.following_id = creator_user_id
  ) fan_counts
  CROSS JOIN (
    SELECT 
      COUNT(*) as total_campaigns,
      COUNT(*) FILTER (WHERE c.status = 'active') as active_campaigns
    FROM campaigns c
    WHERE c.creator_id = creator_user_id
  ) campaign_stats
  CROSS JOIN (
    SELECT 
      COALESCE(SUM(cp.xp_earned), 0) as total_xp
    FROM campaign_participants cp
    JOIN campaigns c ON c.id = cp.campaign_id
    WHERE c.creator_id = creator_user_id
      AND DATE(cp.created_at) = target_date
  ) xp_stats
  CROSS JOIN (
    SELECT 
      COALESCE(SUM(cp.cash_earned), 0) as total_cash
    FROM campaign_participants cp
    JOIN campaigns c ON c.id = cp.campaign_id
    WHERE c.creator_id = creator_user_id
      AND DATE(cp.created_at) = target_date
  ) cash_stats
  CROSS JOIN (
    SELECT 
      COUNT(*) as message_count,
      COALESCE(SUM(m.xp_cost * 0.01), 0) as revenue_cents
    FROM messages m
    WHERE m.recipient_id = creator_user_id
      AND DATE(m.created_at) = target_date
  ) message_stats
  ON CONFLICT (creator_id, date) 
  DO UPDATE SET
    total_fans = EXCLUDED.total_fans,
    new_fans = EXCLUDED.new_fans,
    total_campaigns = EXCLUDED.total_campaigns,
    active_campaigns = EXCLUDED.active_campaigns,
    total_xp_awarded = EXCLUDED.total_xp_awarded,
    total_cash_awarded = EXCLUDED.total_cash_awarded,
    total_messages_received = EXCLUDED.total_messages_received,
    total_message_revenue_cents = EXCLUDED.total_message_revenue_cents,
    updated_at = now();
END;
$$;

-- Fix handle_universal_share function
CREATE OR REPLACE FUNCTION public.handle_universal_share(content_type_param text, content_id_param uuid, platform_param text, share_url_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_uuid UUID;
  existing_share RECORD;
  recent_share RECORD;
  xp_to_award INTEGER := 0;
  platform_xp_values JSONB := '{"twitter": 10, "facebook": 8, "instagram": 12, "sms": 5, "email": 6, "streamcentives": 15}';
  result JSON;
BEGIN
  -- Get authenticated user
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user already shared this content on this platform today
  SELECT * INTO existing_share 
  FROM public.share_activities 
  WHERE user_id = user_uuid 
    AND content_type = content_type_param 
    AND content_id = content_id_param 
    AND platform = platform_param 
    AND share_date = CURRENT_DATE;

  IF existing_share IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already shared on this platform today');
  END IF;

  -- Check for spam prevention (same content within 7 days)
  SELECT * INTO recent_share 
  FROM public.share_activities 
  WHERE user_id = user_uuid 
    AND content_type = content_type_param 
    AND content_id = content_id_param 
    AND platform = platform_param 
    AND created_at > (now() - interval '7 days');

  IF recent_share IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Must wait 7 days before resharing the same content on this platform');
  END IF;

  -- Calculate XP to award
  xp_to_award := COALESCE((platform_xp_values ->> platform_param)::INTEGER, 5);

  -- Insert share activity
  INSERT INTO public.share_activities (
    user_id, content_type, content_id, platform, share_url, xp_earned, share_date
  ) VALUES (
    user_uuid, content_type_param, content_id_param, platform_param, share_url_param, xp_to_award, CURRENT_DATE
  );

  -- Update user's XP balance
  INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (user_uuid, xp_to_award, xp_to_award)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    current_xp = user_xp_balances.current_xp + xp_to_award,
    total_earned_xp = user_xp_balances.total_earned_xp + xp_to_award,
    updated_at = now();

  result := json_build_object(
    'success', true, 
    'xp_earned', xp_to_award,
    'message', 'Shared successfully! Earned ' || xp_to_award || ' XP'
  );

  RETURN result;
END;
$$;