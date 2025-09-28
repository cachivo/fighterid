-- Fix discipline type conflict in create_fighter_profile_with_license function
-- Change p_discipline parameter from discipline_type to discipline

DROP FUNCTION IF EXISTS public.create_fighter_profile_with_license(text, text, text, text, text, text, integer, numeric, integer, integer, integer, text, text, text, discipline_type, text, text, text, text, text, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_fighter_profile_with_license(
  p_first_name text,
  p_last_name text,
  p_country text DEFAULT 'HN',
  p_weight_class text DEFAULT 'Lightweight',
  p_record_type text DEFAULT 'Amateur',
  p_level text DEFAULT 'Amateur',
  p_record_wins integer DEFAULT 0,
  p_record_losses integer DEFAULT 0,
  p_record_draws integer DEFAULT 0,
  p_height_cm integer DEFAULT NULL,
  p_weight_kg numeric DEFAULT NULL,
  p_nickname text DEFAULT NULL,
  p_martial_arts text DEFAULT NULL,
  p_gym_name text DEFAULT NULL,
  p_discipline discipline DEFAULT 'MMA',
  p_fighting_style text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_document_type text DEFAULT NULL,
  p_document_number text DEFAULT NULL,
  p_birthdate text DEFAULT NULL,
  p_birthplace text DEFAULT NULL,
  p_blood_type text DEFAULT NULL,
  p_medical_conditions text DEFAULT NULL,
  p_medical_allergies text DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL,
  p_emergency_contact_relation text DEFAULT NULL,
  p_insurance_company text DEFAULT NULL,
  p_insurance_policy text DEFAULT NULL
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
  v_app_user_id uuid;
  v_license_number text;
  martial_arts_array text[];
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get app_user id
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_user_id = v_user_id;

  IF v_app_user_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if user already has a fighter profile
  SELECT id INTO v_fighter_id
  FROM public.fighter_profiles
  WHERE user_id = v_app_user_id;

  IF v_fighter_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a fighter profile';
  END IF;

  -- Convert martial arts string to array if provided
  IF p_martial_arts IS NOT NULL AND p_martial_arts != '' THEN
    martial_arts_array := string_to_array(p_martial_arts, ',');
  ELSE
    martial_arts_array := ARRAY[]::text[];
  END IF;

  -- Create fighter profile
  INSERT INTO public.fighter_profiles (
    user_id, first_name, last_name, nickname, country, weight_class,
    height_cm, weight_kg, record_wins, record_losses, record_draws,
    martial_arts, gym_name, discipline, fighting_style, bio,
    document_type, document_number, birthplace, blood_type,
    medical_conditions, medical_allergies, emergency_contact_name,
    emergency_contact_phone, emergency_contact_relation,
    insurance_company, insurance_policy, record_type, level,
    birthdate
  ) VALUES (
    v_app_user_id, p_first_name, p_last_name, NULLIF(p_nickname, ''), 
    p_country, p_weight_class, p_height_cm, p_weight_kg,
    p_record_wins, p_record_losses, p_record_draws,
    martial_arts_array, NULLIF(p_gym_name, ''), p_discipline, 
    NULLIF(p_fighting_style, ''), NULLIF(p_bio, ''),
    NULLIF(p_document_type, ''), NULLIF(p_document_number, ''),
    NULLIF(p_birthplace, ''), NULLIF(p_blood_type, ''),
    NULLIF(p_medical_conditions, ''), NULLIF(p_medical_allergies, ''),
    NULLIF(p_emergency_contact_name, ''), NULLIF(p_emergency_contact_phone, ''),
    NULLIF(p_emergency_contact_relation, ''), NULLIF(p_insurance_company, ''),
    NULLIF(p_insurance_policy, ''), p_record_type, p_level,
    CASE 
      WHEN p_birthdate IS NOT NULL AND p_birthdate != '' THEN p_birthdate::date
      ELSE NULL 
    END
  ) RETURNING id INTO v_fighter_id;

  -- Generate license number
  v_license_number := public.generate_license_number();

  -- Create fighter license
  INSERT INTO public.fighter_licenses (
    fighter_id, license_number, discipline, license_level,
    status, is_primary, created_by
  ) VALUES (
    v_fighter_id, v_license_number, p_discipline, 
    CASE 
      WHEN p_level = 'Profesional' THEN 'PROFESSIONAL'::license_level
      WHEN p_level = 'Amateur' THEN 'AMATEUR'::license_level
      ELSE 'AMATEUR'::license_level
    END,
    'PENDING_REVIEW'::license_status, true, v_user_id
  ) RETURNING id INTO v_license_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'fighter_id', v_fighter_id,
    'license_id', v_license_id,
    'license_number', v_license_number,
    'message', 'Fighter profile and license created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create fighter profile and license'
    );
END;
$$;