-- Crear función para solicitar licencia de peleador
CREATE OR REPLACE FUNCTION request_fighter_license(
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
BEGIN
  -- Obtener el app_user_id del usuario autenticado
  SELECT id INTO v_app_user_id
  FROM app_user
  WHERE auth_user_id = auth.uid();

  IF v_app_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Verificar que el usuario no tenga ya un perfil de peleador activo
  IF EXISTS (
    SELECT 1 FROM fighter_profiles 
    WHERE user_id = v_app_user_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Ya tienes un perfil de peleador activo';
  END IF;

  -- Insertar el perfil de peleador
  INSERT INTO fighter_profiles (
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
    boxrec_url,
    tapology_url,
    avatar_url,
    active
  )
  SELECT
    v_app_user_id,
    (p_fighter_profile_data->>'first_name')::text,
    (p_fighter_profile_data->>'last_name')::text,
    (p_fighter_profile_data->>'nickname')::text,
    (p_fighter_profile_data->>'country')::text,
    (p_fighter_profile_data->>'birthdate')::date,
    (p_fighter_profile_data->>'birthplace')::text,
    (p_fighter_profile_data->>'document_type')::text,
    (p_fighter_profile_data->>'document_image_url')::text,
    (p_fighter_profile_data->>'height_cm')::integer,
    (p_fighter_profile_data->>'weight_kg')::numeric,
    (p_fighter_profile_data->>'reach_cm')::integer,
    (p_fighter_profile_data->>'blood_type')::text,
    (p_fighter_profile_data->>'weight_class')::text,
    (p_fighter_profile_data->>'discipline')::discipline,
    (p_fighter_profile_data->>'fighting_style')::text,
    (p_fighter_profile_data->>'stance')::text,
    (p_fighter_profile_data->>'level')::text,
    (p_fighter_profile_data->>'gym_name')::text,
    CASE 
      WHEN p_fighter_profile_data->>'martial_arts' IS NOT NULL 
      THEN (p_fighter_profile_data->>'martial_arts')::text[]
      ELSE NULL
    END,
    (p_fighter_profile_data->>'record_wins')::integer,
    (p_fighter_profile_data->>'record_losses')::integer,
    (p_fighter_profile_data->>'record_draws')::integer,
    (p_fighter_profile_data->>'record_type')::text,
    (p_fighter_profile_data->>'medical_conditions')::text,
    (p_fighter_profile_data->>'medical_allergies')::text,
    (p_fighter_profile_data->>'insurance_company')::text,
    (p_fighter_profile_data->>'insurance_policy')::text,
    (p_fighter_profile_data->>'emergency_contact_name')::text,
    (p_fighter_profile_data->>'emergency_contact_phone')::text,
    (p_fighter_profile_data->>'emergency_contact_relation')::text,
    (p_fighter_profile_data->>'bio')::text,
    (p_fighter_profile_data->>'boxrec_url')::text,
    (p_fighter_profile_data->>'tapology_url')::text,
    (p_fighter_profile_data->>'avatar_url')::text,
    true
  RETURNING id INTO v_fighter_profile_id;

  -- Insertar la licencia
  INSERT INTO fighter_licenses (
    fighter_id,
    license_number,
    status,
    license_level,
    discipline,
    is_primary,
    created_by
  )
  VALUES (
    v_fighter_profile_id,
    (p_license_data->>'license_number')::text,
    'PENDING_REVIEW'::license_status,
    (p_license_data->>'license_level')::license_level,
    (p_license_data->>'discipline')::discipline,
    true,
    v_app_user_id
  )
  RETURNING id INTO v_license_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'fighter_profile_id', v_fighter_profile_id,
    'license_id', v_license_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear solicitud: %', SQLERRM;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION request_fighter_license(jsonb, jsonb) TO authenticated;