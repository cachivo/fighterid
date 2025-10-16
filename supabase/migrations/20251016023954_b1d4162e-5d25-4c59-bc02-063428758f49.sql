-- Fix request_fighter_license function to handle arrays and type conversions properly

CREATE OR REPLACE FUNCTION public.request_fighter_license(
  p_fighter_profile_data jsonb,
  p_license_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_user_id uuid;
  v_fighter_profile_id uuid;
  v_license_id uuid;
  v_result jsonb;
  v_martial_arts text[];
BEGIN
  -- Get app_user_id from current user
  SELECT id INTO v_app_user_id FROM public.app_user WHERE auth_user_id = auth.uid();
  
  IF v_app_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if user already has a fighter profile
  SELECT id INTO v_fighter_profile_id 
  FROM public.fighter_profiles 
  WHERE user_id = v_app_user_id AND active = true
  LIMIT 1;

  IF v_fighter_profile_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User already has an active fighter profile'
    );
  END IF;

  -- Process martial_arts correctly - handle both array and string formats
  IF jsonb_typeof(p_fighter_profile_data->'martial_arts') = 'array' THEN
    -- If it's already an array, extract it properly
    IF jsonb_array_length(p_fighter_profile_data->'martial_arts') > 0 THEN
      v_martial_arts := ARRAY(SELECT jsonb_array_elements_text(p_fighter_profile_data->'martial_arts'));
    ELSE
      v_martial_arts := ARRAY[]::text[];
    END IF;
  ELSIF (p_fighter_profile_data->>'martial_arts') IS NOT NULL AND (p_fighter_profile_data->>'martial_arts') != '' THEN
    -- If it's a string (backward compatibility), split by comma
    v_martial_arts := string_to_array((p_fighter_profile_data->>'martial_arts')::text, ',');
  ELSE
    v_martial_arts := ARRAY[]::text[];
  END IF;

  -- Insert fighter profile
  INSERT INTO public.fighter_profiles (
    user_id,
    first_name,
    last_name,
    nickname,
    country,
    birthdate,
    birthplace,
    document_type,
    document_image_url,
    height_cm,
    weight_kg,
    reach_cm,
    blood_type,
    weight_class,
    discipline,
    fighting_style,
    stance,
    level,
    gym_name,
    martial_arts,
    record_wins,
    record_losses,
    record_draws,
    record_type,
    medical_conditions,
    medical_allergies,
    insurance_company,
    insurance_policy,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relation,
    bio,
    avatar_url
  )
  VALUES (
    v_app_user_id,
    p_fighter_profile_data->>'first_name',
    p_fighter_profile_data->>'last_name',
    NULLIF(p_fighter_profile_data->>'nickname', ''),
    COALESCE(p_fighter_profile_data->>'country', 'HN'),
    (p_fighter_profile_data->>'birthdate')::date,
    NULLIF(p_fighter_profile_data->>'birthplace', ''),
    NULLIF(p_fighter_profile_data->>'document_type', ''),
    NULLIF(p_fighter_profile_data->>'document_image_url', ''),
    (p_fighter_profile_data->>'height_cm')::integer,
    (p_fighter_profile_data->>'weight_kg')::numeric,
    (p_fighter_profile_data->>'reach_cm')::integer,
    NULLIF(p_fighter_profile_data->>'blood_type', ''),
    p_fighter_profile_data->>'weight_class',
    (p_fighter_profile_data->>'discipline')::discipline,
    NULLIF(p_fighter_profile_data->>'fighting_style', ''),
    NULLIF(p_fighter_profile_data->>'stance', ''),
    NULLIF(p_fighter_profile_data->>'level', ''),
    NULLIF(p_fighter_profile_data->>'gym_name', ''),
    v_martial_arts,
    COALESCE((p_fighter_profile_data->>'record_wins')::integer, 0),
    COALESCE((p_fighter_profile_data->>'record_losses')::integer, 0),
    COALESCE((p_fighter_profile_data->>'record_draws')::integer, 0),
    NULLIF(p_fighter_profile_data->>'record_type', ''),
    NULLIF(p_fighter_profile_data->>'medical_conditions', ''),
    NULLIF(p_fighter_profile_data->>'medical_allergies', ''),
    NULLIF(p_fighter_profile_data->>'insurance_company', ''),
    NULLIF(p_fighter_profile_data->>'insurance_policy', ''),
    p_fighter_profile_data->>'emergency_contact_name',
    p_fighter_profile_data->>'emergency_contact_phone',
    NULLIF(p_fighter_profile_data->>'emergency_contact_relation', ''),
    NULLIF(p_fighter_profile_data->>'bio', ''),
    NULLIF(p_fighter_profile_data->>'avatar_url', '')
  )
  RETURNING id INTO v_fighter_profile_id;

  -- Insert fighter license
  INSERT INTO public.fighter_licenses (
    fighter_id,
    license_number,
    license_level,
    discipline,
    status,
    created_by
  )
  VALUES (
    v_fighter_profile_id,
    p_license_data->>'license_number',
    (p_license_data->>'license_level')::license_level,
    (p_license_data->>'discipline')::discipline,
    'PENDING_REVIEW'::license_status,
    auth.uid()
  )
  RETURNING id INTO v_license_id;

  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'fighter_profile_id', v_fighter_profile_id,
    'license_id', v_license_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating fighter profile: %', SQLERRM;
END;
$$;