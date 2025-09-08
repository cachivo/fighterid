-- Create improved admin update function with better authentication handling
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v8(p_fighter_id uuid, p_profile_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  current_user_admin boolean := false;
  admin_user_record RECORD;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Enhanced admin check with better error handling
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User not logged in';
  END IF;
  
  -- Check if current user exists and is admin with detailed logging
  SELECT au.is_admin, au.id, au.email INTO admin_user_record
  FROM public.app_user au 
  WHERE au.auth_user_id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for auth ID: %. Please ensure user profile exists.', current_user_id;
  END IF;
  
  current_user_admin := COALESCE(admin_user_record.is_admin, false);

  -- If not admin, deny access with detailed info
  IF NOT current_user_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles. User: % (%), Is Admin: %', 
      admin_user_record.email, current_user_id, current_user_admin;
  END IF;

  -- Log the update attempt
  RAISE NOTICE 'Admin update initiated by: % (%) for fighter: %', 
    admin_user_record.email, current_user_id, p_fighter_id;

  -- Temporarily disable RLS for admin operations
  SET LOCAL row_security = OFF;

  -- Update the profile with comprehensive field handling
  UPDATE public.fighter_profiles
  SET 
    -- Basic info
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
    
    -- CRITICAL: Handle record fields with proper defaults
    record_wins = CASE 
      WHEN p_profile_data ? 'record_wins' THEN
        GREATEST(0, COALESCE((p_profile_data->>'record_wins')::integer, 0))
      ELSE record_wins
    END,
    record_losses = CASE 
      WHEN p_profile_data ? 'record_losses' THEN
        GREATEST(0, COALESCE((p_profile_data->>'record_losses')::integer, 0))
      ELSE record_losses
    END,
    record_draws = CASE 
      WHEN p_profile_data ? 'record_draws' THEN
        GREATEST(0, COALESCE((p_profile_data->>'record_draws')::integer, 0))
      ELSE record_draws
    END,
    
    -- Set record_type to 'PROFESSIONAL' when updating any record stats
    record_type = CASE 
      WHEN p_profile_data ? 'record_wins' OR p_profile_data ? 'record_losses' OR p_profile_data ? 'record_draws' THEN
        COALESCE((p_profile_data->>'record_type')::text, 'PROFESSIONAL')
      ELSE COALESCE(record_type, 'AMATEUR')
    END,
    
    -- Physical attributes
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
    
    reach_cm = CASE 
      WHEN p_profile_data ? 'reach_cm' AND p_profile_data->>'reach_cm' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'reach_cm')::integer
      ELSE reach_cm
    END,
    
    -- Fighting info
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' AND p_profile_data->>'fighting_style' NOT IN ('', 'null') THEN
        (p_profile_data->>'fighting_style')::text
      ELSE fighting_style
    END,
    
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' AND p_profile_data->>'gym_name' NOT IN ('', 'null') THEN
        (p_profile_data->>'gym_name')::text
      ELSE gym_name
    END,
    
    bio = CASE 
      WHEN p_profile_data ? 'bio' AND p_profile_data->>'bio' NOT IN ('', 'null') THEN
        (p_profile_data->>'bio')::text
      ELSE bio
    END,
    
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter with ID % not found or update failed', p_fighter_id;
  END IF;
  
  -- Success logging
  RAISE NOTICE 'Successfully updated fighter % - Wins: %, Losses: %, Draws: %, Type: %', 
    p_fighter_id, 
    GREATEST(0, COALESCE((p_profile_data->>'record_wins')::integer, 0)),
    GREATEST(0, COALESCE((p_profile_data->>'record_losses')::integer, 0)),
    GREATEST(0, COALESCE((p_profile_data->>'record_draws')::integer, 0)),
    CASE 
      WHEN p_profile_data ? 'record_wins' OR p_profile_data ? 'record_losses' OR p_profile_data ? 'record_draws' THEN
        'PROFESSIONAL'
      ELSE 'AMATEUR'
    END;
    
END;
$function$;