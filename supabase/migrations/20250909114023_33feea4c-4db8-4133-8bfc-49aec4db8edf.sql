CREATE OR REPLACE FUNCTION public.update_leaderboard_on_listen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Upsert leaderboard entry
  INSERT INTO public.creator_fan_leaderboards (
    creator_user_id,
    fan_user_id,
    total_listens,
    total_xp_earned,
    last_activity_at
  )
  VALUES (
    NEW.creator_user_id,
    NEW.fan_user_id,
    1,
    10, -- Base XP per listen
    NEW.listened_at
  )
  ON CONFLICT (creator_user_id, fan_user_id)
  DO UPDATE SET
    total_listens = creator_fan_leaderboards.total_listens + 1,
    total_xp_earned = creator_fan_leaderboards.total_xp_earned + 10,
    last_activity_at = NEW.listened_at,
    updated_at = now();

  -- Update ranks for this creator's leaderboard
  WITH ranked_fans AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_xp_earned DESC, total_listens DESC) as new_rank
    FROM public.creator_fan_leaderboards
    WHERE creator_user_id = NEW.creator_user_id
  )
  UPDATE public.creator_fan_leaderboards
  SET rank_position = ranked_fans.new_rank
  FROM ranked_fans
  WHERE creator_fan_leaderboards.id = ranked_fans.id;

  RETURN NEW;
END;
$function$;