-- Actualizar RPC request_fighter_license para eliminar document_number
-- Este RPC ya no requiere ni procesa el campo document_number

CREATE OR REPLACE FUNCTION public.request_fighter_license(
  p_fighter_profile_data JSONB,
  p_license_data JSONB DEFAULT '{}'::jsonb,
  p_document_urls JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_user_id UUID;
  v_fighter_id UUID;
  v_license_id UUID;
  v_doc JSONB;
BEGIN
  -- 1. Obtener app_user_id del usuario autenticado
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_user_id = auth.uid();

  IF v_app_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuario no encontrado en app_user'
    );
  END IF;

  -- 2. Verificar si ya existe un perfil activo
  SELECT id INTO v_fighter_id
  FROM public.fighter_profiles
  WHERE user_id = v_app_user_id
    AND active = true
  LIMIT 1;

  IF v_fighter_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ya tienes un perfil de peleador activo'
    );
  END IF;

  -- 3. Actualizar app_user con datos actualizados
  UPDATE public.app_user
  SET
    first_name = COALESCE(p_fighter_profile_data->>'first_name', first_name),
    last_name = COALESCE(p_fighter_profile_data->>'last_name', last_name),
    phone = COALESCE(p_fighter_profile_data->>'phone', phone),
    birthdate = COALESCE((p_fighter_profile_data->>'birthdate')::date, birthdate),
    updated_at = now()
  WHERE id = v_app_user_id;

  -- 4. Crear fighter_profile (SIN document_number)
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
    p_fighter_profile_data->>'first_name',
    p_fighter_profile_data->>'last_name',
    p_fighter_profile_data->>'nickname',
    p_fighter_profile_data->>'country',
    (p_fighter_profile_data->>'birthdate')::date,
    p_fighter_profile_data->>'gender',
    p_fighter_profile_data->>'birthplace',
    p_fighter_profile_data->>'document_type',
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
  ) RETURNING id INTO v_fighter_id;

  -- 5. Crear fighter_license
  INSERT INTO public.fighter_licenses (
    fighter_id,
    license_level,
    discipline,
    status,
    created_by
  ) VALUES (
    v_fighter_id,
    COALESCE((p_license_data->>'license_level')::license_level, 'AMATEUR'),
    (p_license_data->>'discipline')::discipline,
    'PENDING_REVIEW',
    auth.uid()
  ) RETURNING id INTO v_license_id;

  -- 6. Insertar documentos en license_documents
  FOR v_doc IN SELECT * FROM jsonb_array_elements(p_document_urls)
  LOOP
    INSERT INTO public.license_documents (
      license_id,
      document_type,
      document_url
    ) VALUES (
      v_license_id,
      v_doc->>'type',
      v_doc->>'url'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', '¡Solicitud de Fighter ID enviada exitosamente! Te contactaremos pronto.',
    'fighter_id', v_fighter_id,
    'license_id', v_license_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;