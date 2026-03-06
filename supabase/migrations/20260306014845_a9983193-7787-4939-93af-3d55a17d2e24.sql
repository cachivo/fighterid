CREATE OR REPLACE FUNCTION public.admin_create_fighter_profile(
  p_profile_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fighter_id uuid;
  v_license_number text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create fighter profiles';
  END IF;

  v_license_number := COALESCE(
    (p_profile_data->>'license_number')::text,
    public.generate_license_number()
  );

  INSERT INTO public.fighter_profiles (
    first_name, last_name, nickname, country, weight_class,
    height_cm, weight_kg, reach_cm,
    record_wins, record_losses, record_draws,
    mma_record_wins, mma_record_losses, mma_record_draws,
    boxeo_record_wins, boxeo_record_losses, boxeo_record_draws,
    record_type, fighting_style, gym_name, gym_id,
    bio, avatar_url, discipline, martial_arts,
    gender, level, birthdate, birthplace, blood_type,
    document_type, document_number, stance, license_number,
    emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
    medical_allergies, medical_conditions,
    insurance_company, insurance_policy
  ) VALUES (
    (p_profile_data->>'first_name')::text,
    (p_profile_data->>'last_name')::text,
    NULLIF((p_profile_data->>'nickname')::text, ''),
    COALESCE((p_profile_data->>'country')::text, 'HN'),
    (p_profile_data->>'weight_class')::text,
    NULLIF((p_profile_data->>'height_cm')::integer, 0),
    NULLIF((p_profile_data->>'weight_kg')::numeric, 0),
    NULLIF((p_profile_data->>'reach_cm')::integer, 0),
    COALESCE((p_profile_data->>'record_wins')::integer, 0),
    COALESCE((p_profile_data->>'record_losses')::integer, 0),
    COALESCE((p_profile_data->>'record_draws')::integer, 0),
    COALESCE((p_profile_data->>'mma_record_wins')::integer, 0),
    COALESCE((p_profile_data->>'mma_record_losses')::integer, 0),
    COALESCE((p_profile_data->>'mma_record_draws')::integer, 0),
    COALESCE((p_profile_data->>'boxeo_record_wins')::integer, 0),
    COALESCE((p_profile_data->>'boxeo_record_losses')::integer, 0),
    COALESCE((p_profile_data->>'boxeo_record_draws')::integer, 0),
    COALESCE((p_profile_data->>'record_type')::text, 'Amateur'),
    NULLIF((p_profile_data->>'fighting_style')::text, ''),
    NULLIF((p_profile_data->>'gym_name')::text, ''),
    NULLIF((p_profile_data->>'gym_id')::uuid, NULL),
    NULLIF((p_profile_data->>'bio')::text, ''),
    NULLIF((p_profile_data->>'avatar_url')::text, ''),
    CASE 
      WHEN (p_profile_data->>'discipline')::text IN ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro')
      THEN (p_profile_data->>'discipline')::discipline
      ELSE NULL
    END,
    CASE 
      WHEN p_profile_data->'martial_arts' IS NOT NULL AND jsonb_typeof(p_profile_data->'martial_arts') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
      ELSE ARRAY[]::text[]
    END,
    NULLIF((p_profile_data->>'gender')::text, ''),
    COALESCE((p_profile_data->>'level')::text, 'AMATEUR'),
    NULLIF((p_profile_data->>'birthdate')::date, NULL),
    NULLIF((p_profile_data->>'birthplace')::text, ''),
    NULLIF((p_profile_data->>'blood_type')::text, ''),
    NULLIF((p_profile_data->>'document_type')::text, ''),
    NULLIF((p_profile_data->>'document_number')::text, ''),
    NULLIF((p_profile_data->>'stance')::text, ''),
    v_license_number,
    NULLIF((p_profile_data->>'emergency_contact_name')::text, ''),
    NULLIF((p_profile_data->>'emergency_contact_relation')::text, ''),
    NULLIF((p_profile_data->>'emergency_contact_phone')::text, ''),
    NULLIF((p_profile_data->>'medical_allergies')::text, ''),
    NULLIF((p_profile_data->>'medical_conditions')::text, ''),
    NULLIF((p_profile_data->>'insurance_company')::text, ''),
    NULLIF((p_profile_data->>'insurance_policy')::text, '')
  )
  RETURNING id INTO v_fighter_id;

  RETURN v_fighter_id;
END;
$$;