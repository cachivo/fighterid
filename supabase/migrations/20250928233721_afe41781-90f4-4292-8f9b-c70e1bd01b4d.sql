-- Drop the old function signature that uses discipline_type
DROP FUNCTION IF EXISTS public.create_fighter_profile_with_license(
  p_auth_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_country text,
  p_weight_class text,
  p_height_cm integer,
  p_weight_kg numeric,
  p_phone text,
  p_birthdate text,
  p_nickname text,
  p_reach_cm integer,
  p_discipline discipline_type,
  p_martial_arts text[],
  p_gym_name text,
  p_fighting_style text,
  p_stance text,
  p_level text,
  p_record_wins integer,
  p_record_losses integer,
  p_record_draws integer,
  p_record_type text,
  p_gender text,
  p_bio text
);

-- Create the corrected function with proper discipline type
CREATE OR REPLACE FUNCTION public.create_fighter_profile_with_license(
  p_first_name text,
  p_last_name text,
  p_country text,
  p_weight_class text,
  p_height_cm integer,
  p_weight_kg numeric,
  p_phone text DEFAULT NULL,
  p_birthdate text DEFAULT NULL,
  p_nickname text DEFAULT NULL,
  p_reach_cm integer DEFAULT NULL,
  p_discipline discipline DEFAULT 'MMA',
  p_martial_arts text DEFAULT NULL,
  p_gym_name text DEFAULT NULL,
  p_fighting_style text DEFAULT NULL,
  p_stance text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_record_wins integer DEFAULT 0,
  p_record_losses integer DEFAULT 0,
  p_record_draws integer DEFAULT 0,
  p_record_type text DEFAULT 'Amateur',
  p_gender text DEFAULT NULL,
  p_bio text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_fighter_id uuid;
  v_license_id uuid;
  v_license_number text;
  v_martial_arts_array text[];
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user already has a fighter profile
  SELECT fp.id INTO v_fighter_id
  FROM fighter_profiles fp
  JOIN app_user au ON au.id = fp.user_id
  WHERE au.auth_user_id = v_user_id;

  IF v_fighter_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an active fighter profile';
  END IF;

  -- Get or create app_user record
  INSERT INTO app_user (auth_user_id, email, handle)
  SELECT v_user_id, auth.email(), COALESCE(p_nickname, p_first_name || '_' || p_last_name)
  WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE auth_user_id = v_user_id)
  ON CONFLICT (auth_user_id) DO NOTHING;

  SELECT id INTO v_user_id FROM app_user WHERE auth_user_id = auth.uid();

  -- Parse martial arts string to array
  IF p_martial_arts IS NOT NULL AND p_martial_arts != '' THEN
    v_martial_arts_array := string_to_array(p_martial_arts, ',');
  ELSE
    v_martial_arts_array := ARRAY[]::text[];
  END IF;

  -- Create fighter profile
  INSERT INTO fighter_profiles (
    user_id, first_name, last_name, nickname, country, weight_class,
    height_cm, weight_kg, reach_cm, discipline, martial_arts,
    gym_name, fighting_style, stance, level, bio, gender,
    record_wins, record_losses, record_draws, record_type,
    birthdate
  ) VALUES (
    v_user_id, p_first_name, p_last_name, p_nickname, p_country, p_weight_class,
    p_height_cm, p_weight_kg, p_reach_cm, p_discipline, v_martial_arts_array,
    p_gym_name, p_fighting_style, p_stance, p_level, p_bio, p_gender,
    p_record_wins, p_record_losses, p_record_draws, p_record_type,
    CASE WHEN p_birthdate IS NOT NULL AND p_birthdate != '' THEN p_birthdate::date ELSE NULL END
  ) RETURNING id INTO v_fighter_id;

  -- Generate license number
  v_license_number := public.generate_license_number();

  -- Create fighter license
  INSERT INTO fighter_licenses (
    fighter_id, license_number, discipline, license_level, status
  ) VALUES (
    v_fighter_id, v_license_number, p_discipline,
    CASE WHEN p_level = 'Profesional' THEN 'PROFESSIONAL'::license_level ELSE 'AMATEUR'::license_level END,
    'PENDING_REVIEW'::license_status
  ) RETURNING id INTO v_license_id;

  -- Update fighter profile with license reference
  UPDATE fighter_profiles 
  SET 
    primary_license_id = v_license_id,
    license_number = v_license_number,
    license_status = 'active'
  WHERE id = v_fighter_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'fighter_id', v_fighter_id,
    'license_id', v_license_id,
    'license_number', v_license_number
  );
END;
$$;

-- Update admin function to use correct discipline casting
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v10(p_fighter_id uuid, p_profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_admin boolean := false;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user exists and is admin
  SELECT COALESCE(au.is_admin, false) INTO current_user_admin
  FROM public.app_user au 
  WHERE au.auth_user_id = current_user_id;

  IF NOT current_user_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Disable RLS for admin operations
  SET LOCAL row_security = OFF;

  -- Update the profile
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
    
    -- Handle record fields properly
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
    
    -- Set record_type properly
    record_type = CASE 
      WHEN p_profile_data ? 'record_wins' OR p_profile_data ? 'record_losses' OR p_profile_data ? 'record_draws' THEN
        CASE 
          WHEN (p_profile_data->>'record_type')::text = 'PROFESSIONAL' THEN 'Profesional'
          WHEN (p_profile_data->>'record_type')::text = 'AMATEUR' THEN 'Amateur'
          WHEN (p_profile_data->>'record_type')::text = 'MIXED' THEN 'Mixto'
          ELSE COALESCE((p_profile_data->>'record_type')::text, 'Amateur')
        END
      ELSE COALESCE(record_type, 'Amateur')
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
    
    -- Handle discipline properly - FIXED: use ::discipline not ::discipline_type
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' AND p_profile_data->>'discipline' IS NOT NULL 
           AND p_profile_data->>'discipline' != '' 
           AND p_profile_data->>'discipline' != 'null' 
           AND p_profile_data->>'discipline' IN ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro') THEN
        (p_profile_data->>'discipline')::discipline
      ELSE discipline
    END,
    
    updated_at = now()
  WHERE id = p_fighter_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter with ID % not found', p_fighter_id;
  END IF;
END;
$$;