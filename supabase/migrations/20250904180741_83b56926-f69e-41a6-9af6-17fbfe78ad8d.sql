-- Actualizar función admin_update_fighter_profile para incluir discipline y level
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo admins pueden usar esta función
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Actualizar el perfil con los datos proporcionados, incluyendo discipline y level
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = COALESCE((p_profile_data->>'nickname')::text, nickname),
    country = COALESCE((p_profile_data->>'country')::text, country),
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    height_cm = COALESCE((p_profile_data->>'height_cm')::integer, height_cm),
    weight_kg = COALESCE((p_profile_data->>'weight_kg')::numeric, weight_kg),
    reach_cm = COALESCE((p_profile_data->>'reach_cm')::integer, reach_cm),
    fighting_style = COALESCE((p_profile_data->>'fighting_style')::text, fighting_style),
    bio = COALESCE((p_profile_data->>'bio')::text, bio),
    avatar_url = COALESCE((p_profile_data->>'avatar_url')::text, avatar_url),
    discipline = COALESCE((p_profile_data->>'discipline')::discipline_type, discipline),
    level = COALESCE((p_profile_data->>'level')::text, level),
    record_wins = COALESCE((p_profile_data->>'record_wins')::integer, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::integer, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::integer, record_draws),
    elo_rating = COALESCE((p_profile_data->>'elo_rating')::integer, elo_rating),
    updated_at = now()
  WHERE id = p_fighter_id;
END;
$function$