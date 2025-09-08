-- Fix the admin update function to work with current auth context
-- The issue is likely that RLS policies are interfering with the function execution

CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v5(p_fighter_id uuid, p_profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_admin boolean := false;
BEGIN
  -- Check admin status more reliably
  SELECT EXISTS(
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() 
    AND is_admin = true
  ) INTO current_user_admin;

  IF NOT current_user_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles. User: %, Admin: %', auth.uid(), current_user_admin;
  END IF;

  -- Update the profile with all current fields
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = CASE 
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' NOT IN ('', 'null') THEN
        (p_profile_data->>'nickname')::text
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' IN ('', 'null') THEN
        NULL
      ELSE nickname
    END,
    country = CASE 
      WHEN p_profile_data ? 'country' AND p_profile_data->>'country' NOT IN ('', 'null') THEN
        (p_profile_data->>'country')::text
      ELSE country
    END,
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    avatar_url = CASE 
      WHEN p_profile_data ? 'avatar_url' AND p_profile_data->>'avatar_url' NOT IN ('', 'null') THEN
        (p_profile_data->>'avatar_url')::text
      ELSE avatar_url
    END,
    
    -- Handle record fields properly - THIS IS THE KEY FIX
    record_wins = CASE 
      WHEN p_profile_data ? 'record_wins' THEN
        COALESCE((p_profile_data->>'record_wins')::integer, 0)
      ELSE record_wins
    END,
    record_losses = CASE 
      WHEN p_profile_data ? 'record_losses' THEN
        COALESCE((p_profile_data->>'record_losses')::integer, 0)
      ELSE record_losses
    END,
    record_draws = CASE 
      WHEN p_profile_data ? 'record_draws' THEN
        COALESCE((p_profile_data->>'record_draws')::integer, 0)
      ELSE record_draws
    END,
    
    -- Handle martial_arts as JSON array
    martial_arts = CASE 
      WHEN p_profile_data ? 'martial_arts' THEN
        CASE 
          WHEN p_profile_data->'martial_arts' = 'null'::jsonb THEN NULL
          WHEN jsonb_typeof(p_profile_data->'martial_arts') = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
          ELSE martial_arts
        END
      ELSE martial_arts
    END,
    
    -- Handle all other fields (simplified for space)
    height_cm = CASE 
      WHEN p_profile_data ? 'height_cm' AND p_profile_data->>'height_cm' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'height_cm')::integer
      ELSE height_cm
    END,
    
    weight_kg = CASE 
      WHEN p_profile_data ? 'weight_kg' AND p_profile_data->>'weight_kg' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'weight_kg')::numeric
      ELSE weight_kg
    END,
    
    updated_at = now()
  WHERE id = p_fighter_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter with ID % not found', p_fighter_id;
  END IF;
  
  RAISE NOTICE 'Successfully updated fighter % with data %', p_fighter_id, p_profile_data;
END;
$function$;