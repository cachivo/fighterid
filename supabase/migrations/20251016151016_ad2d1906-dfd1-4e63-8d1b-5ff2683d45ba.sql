-- Actualizar función RPC para incluir nuevos campos obligatorios
CREATE OR REPLACE FUNCTION public.request_fighter_license(
  p_fighter_profile_data jsonb,
  p_license_data jsonb DEFAULT NULL,
  p_document_urls jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_app_user_id uuid;
  v_fighter_profile_id uuid;
  v_license_id uuid;
  v_first_name text;
  v_last_name text;
  v_existing_profile_id uuid;
BEGIN
  -- 1. Obtener app_user_id
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_user_id = auth.uid();

  IF v_app_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuario no encontrado');
  END IF;

  -- 2. Verificar si ya existe un perfil activo
  SELECT id INTO v_existing_profile_id
  FROM public.fighter_profiles
  WHERE user_id = v_app_user_id
    AND active = true
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ya tienes una licencia activa');
  END IF;

  -- 3. Obtener first_name y last_name (prioridad: formulario > app_user)
  SELECT 
    COALESCE(NULLIF(p_fighter_profile_data->>'first_name', ''), au.first_name),
    COALESCE(NULLIF(p_fighter_profile_data->>'last_name', ''), au.last_name)
  INTO v_first_name, v_last_name
  FROM public.app_user au
  WHERE au.id = v_app_user_id;

  -- 4. Actualizar app_user con datos del formulario
  UPDATE public.app_user
  SET 
    first_name = v_first_name,
    last_name = v_last_name,
    birthdate = (p_fighter_profile_data->>'birthdate')::date,
    phone = p_fighter_profile_data->>'phone',
    updated_at = now()
  WHERE id = v_app_user_id;

  -- 5. Insertar fighter_profile
  INSERT INTO public.fighter_profiles (
    user_id,
    first_name,
    last_name,
    nickname,
    country,
    birthdate,
    gender,
    birthplace,
    document_type,
    document_number,
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
    avatar_url,
    active
  ) VALUES (
    v_app_user_id,
    v_first_name,
    v_last_name,
    p_fighter_profile_data->>'nickname',
    COALESCE(p_fighter_profile_data->>'country', 'HN'),
    (p_fighter_profile_data->>'birthdate')::date,
    p_fighter_profile_data->>'gender',
    p_fighter_profile_data->>'birthplace',
    p_fighter_profile_data->>'document_type',
    p_fighter_profile_data->>'document_number',
    p_fighter_profile_data->>'document_image_url',
    (p_fighter_profile_data->>'height_cm')::integer,
    (p_fighter_profile_data->>'weight_kg')::numeric,
    (p_fighter_profile_data->>'reach_cm')::integer,
    p_fighter_profile_data->>'blood_type',
    p_fighter_profile_data->>'weight_class',
    (p_fighter_profile_data->>'discipline')::discipline,
    p_fighter_profile_data->>'fighting_style',
    p_fighter_profile_data->>'stance',
    p_fighter_profile_data->>'level',
    p_fighter_profile_data->>'gym_name',
    CASE 
      WHEN jsonb_typeof(p_fighter_profile_data->'martial_arts') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(p_fighter_profile_data->'martial_arts'))
      ELSE NULL
    END,
    COALESCE((p_fighter_profile_data->>'record_wins')::integer, 0),
    COALESCE((p_fighter_profile_data->>'record_losses')::integer, 0),
    COALESCE((p_fighter_profile_data->>'record_draws')::integer, 0),
    p_fighter_profile_data->>'record_type',
    p_fighter_profile_data->>'medical_conditions',
    p_fighter_profile_data->>'medical_allergies',
    p_fighter_profile_data->>'insurance_company',
    p_fighter_profile_data->>'insurance_policy',
    p_fighter_profile_data->>'emergency_contact_name',
    p_fighter_profile_data->>'emergency_contact_phone',
    p_fighter_profile_data->>'emergency_contact_relation',
    p_fighter_profile_data->>'bio',
    p_fighter_profile_data->>'avatar_url',
    true
  ) RETURNING id INTO v_fighter_profile_id;

  -- 6. Crear licencia
  INSERT INTO public.fighter_licenses (
    fighter_id,
    license_level,
    discipline,
    status,
    created_by
  ) VALUES (
    v_fighter_profile_id,
    COALESCE((p_license_data->>'license_level')::license_level, 'AMATEUR'::license_level),
    COALESCE((p_license_data->>'discipline')::discipline, (p_fighter_profile_data->>'discipline')::discipline),
    'PENDING_REVIEW'::license_status,
    auth.uid()
  ) RETURNING id INTO v_license_id;

  -- 7. Insertar documentos asociados a la licencia
  IF jsonb_array_length(p_document_urls) > 0 THEN
    INSERT INTO public.license_documents (license_id, document_type, file_path)
    SELECT 
      v_license_id,
      doc->>'type',
      doc->>'url'
    FROM jsonb_array_elements(p_document_urls) AS doc;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', '¡Solicitud enviada exitosamente! Recibirás una notificación cuando sea revisada.',
    'fighter_profile_id', v_fighter_profile_id,
    'license_id', v_license_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al procesar solicitud: %', SQLERRM;
END;
$$;