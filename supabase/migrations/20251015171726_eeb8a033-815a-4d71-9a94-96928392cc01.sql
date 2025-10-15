-- Eliminar versiones antiguas de la función
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile_v6(uuid, jsonb);
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile_v7(uuid, jsonb);
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile_v8(uuid, jsonb);

-- Crear función completa que actualiza TODOS los campos
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_admin boolean := false;
BEGIN
  -- Verificar autenticación
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User not logged in';
  END IF;
  
  -- Verificar permisos de admin
  SELECT COALESCE(au.is_admin, false) INTO current_user_admin
  FROM public.app_user au 
  WHERE au.auth_user_id = current_user_id;

  IF NOT current_user_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Log de la operación
  RAISE NOTICE 'Admin update by: % for fighter: %', current_user_id, p_fighter_id;

  -- Actualizar el perfil con TODOS los campos
  UPDATE public.fighter_profiles
  SET 
    -- Información básica
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = CASE 
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' NOT IN ('', 'null') 
      THEN (p_profile_data->>'nickname')::text
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' IN ('', 'null')
      THEN NULL
      ELSE nickname
    END,
    
    -- Información personal
    gender = CASE 
      WHEN p_profile_data ? 'gender' AND p_profile_data->>'gender' NOT IN ('', 'null')
      THEN (p_profile_data->>'gender')::text
      ELSE gender
    END,
    birthdate = CASE 
      WHEN p_profile_data ? 'birthdate' AND p_profile_data->>'birthdate' NOT IN ('', 'null')
      THEN (p_profile_data->>'birthdate')::date
      ELSE birthdate
    END,
    birthplace = CASE 
      WHEN p_profile_data ? 'birthplace' AND p_profile_data->>'birthplace' NOT IN ('', 'null')
      THEN (p_profile_data->>'birthplace')::text
      ELSE birthplace
    END,
    country = CASE 
      WHEN p_profile_data ? 'country' AND p_profile_data->>'country' NOT IN ('', 'null')
      THEN (p_profile_data->>'country')::text
      ELSE country
    END,
    
    -- Documentación
    document_type = CASE 
      WHEN p_profile_data ? 'document_type' AND p_profile_data->>'document_type' NOT IN ('', 'null')
      THEN (p_profile_data->>'document_type')::text
      ELSE document_type
    END,
    document_number = CASE 
      WHEN p_profile_data ? 'document_number' AND p_profile_data->>'document_number' NOT IN ('', 'null')
      THEN (p_profile_data->>'document_number')::text
      ELSE document_number
    END,
    
    -- Información física
    height_cm = CASE 
      WHEN p_profile_data ? 'height_cm' AND (p_profile_data->>'height_cm')::numeric > 0
      THEN (p_profile_data->>'height_cm')::integer
      ELSE height_cm
    END,
    weight_kg = CASE 
      WHEN p_profile_data ? 'weight_kg' AND (p_profile_data->>'weight_kg')::numeric > 0
      THEN (p_profile_data->>'weight_kg')::numeric
      ELSE weight_kg
    END,
    reach_cm = CASE 
      WHEN p_profile_data ? 'reach_cm' AND (p_profile_data->>'reach_cm')::numeric > 0
      THEN (p_profile_data->>'reach_cm')::integer
      ELSE reach_cm
    END,
    blood_type = CASE 
      WHEN p_profile_data ? 'blood_type' AND p_profile_data->>'blood_type' NOT IN ('', 'null')
      THEN (p_profile_data->>'blood_type')::text
      ELSE blood_type
    END,
    stance = CASE 
      WHEN p_profile_data ? 'stance' AND p_profile_data->>'stance' NOT IN ('', 'null')
      THEN (p_profile_data->>'stance')::text
      ELSE stance
    END,
    
    -- Información de combate
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' AND p_profile_data->>'fighting_style' NOT IN ('', 'null')
      THEN (p_profile_data->>'fighting_style')::text
      ELSE fighting_style
    END,
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' AND p_profile_data->>'gym_name' NOT IN ('', 'null')
      THEN (p_profile_data->>'gym_name')::text
      ELSE gym_name
    END,
    level = CASE 
      WHEN p_profile_data ? 'level' AND p_profile_data->>'level' NOT IN ('', 'null')
      THEN (p_profile_data->>'level')::text
      ELSE level
    END,
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' AND p_profile_data->>'discipline' NOT IN ('', 'null')
      THEN (p_profile_data->>'discipline')::fighter_discipline
      ELSE discipline
    END,
    martial_arts = CASE 
      WHEN p_profile_data ? 'martial_arts' 
      THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
      ELSE martial_arts
    END,
    
    -- Récords
    record_wins = CASE 
      WHEN p_profile_data ? 'record_wins'
      THEN COALESCE((p_profile_data->>'record_wins')::integer, 0)
      ELSE record_wins
    END,
    record_losses = CASE 
      WHEN p_profile_data ? 'record_losses'
      THEN COALESCE((p_profile_data->>'record_losses')::integer, 0)
      ELSE record_losses
    END,
    record_draws = CASE 
      WHEN p_profile_data ? 'record_draws'
      THEN COALESCE((p_profile_data->>'record_draws')::integer, 0)
      ELSE record_draws
    END,
    record_type = CASE 
      WHEN p_profile_data ? 'record_type' AND p_profile_data->>'record_type' NOT IN ('', 'null')
      THEN (p_profile_data->>'record_type')::text
      ELSE record_type
    END,
    
    -- Información médica
    medical_conditions = CASE 
      WHEN p_profile_data ? 'medical_conditions' AND p_profile_data->>'medical_conditions' NOT IN ('', 'null')
      THEN (p_profile_data->>'medical_conditions')::text
      ELSE medical_conditions
    END,
    medical_allergies = CASE 
      WHEN p_profile_data ? 'medical_allergies' AND p_profile_data->>'medical_allergies' NOT IN ('', 'null')
      THEN (p_profile_data->>'medical_allergies')::text
      ELSE medical_allergies
    END,
    
    -- Seguros
    insurance_company = CASE 
      WHEN p_profile_data ? 'insurance_company' AND p_profile_data->>'insurance_company' NOT IN ('', 'null')
      THEN (p_profile_data->>'insurance_company')::text
      ELSE insurance_company
    END,
    insurance_policy = CASE 
      WHEN p_profile_data ? 'insurance_policy' AND p_profile_data->>'insurance_policy' NOT IN ('', 'null')
      THEN (p_profile_data->>'insurance_policy')::text
      ELSE insurance_policy
    END,
    
    -- Contacto de emergencia
    emergency_contact_name = CASE 
      WHEN p_profile_data ? 'emergency_contact_name' AND p_profile_data->>'emergency_contact_name' NOT IN ('', 'null')
      THEN (p_profile_data->>'emergency_contact_name')::text
      ELSE emergency_contact_name
    END,
    emergency_contact_phone = CASE 
      WHEN p_profile_data ? 'emergency_contact_phone' AND p_profile_data->>'emergency_contact_phone' NOT IN ('', 'null')
      THEN (p_profile_data->>'emergency_contact_phone')::text
      ELSE emergency_contact_phone
    END,
    emergency_contact_relation = CASE 
      WHEN p_profile_data ? 'emergency_contact_relation' AND p_profile_data->>'emergency_contact_relation' NOT IN ('', 'null')
      THEN (p_profile_data->>'emergency_contact_relation')::text
      ELSE emergency_contact_relation
    END,
    
    -- URLs externas
    boxrec_url = CASE 
      WHEN p_profile_data ? 'boxrec_url' AND p_profile_data->>'boxrec_url' NOT IN ('', 'null')
      THEN (p_profile_data->>'boxrec_url')::text
      ELSE boxrec_url
    END,
    tapology_url = CASE 
      WHEN p_profile_data ? 'tapology_url' AND p_profile_data->>'tapology_url' NOT IN ('', 'null')
      THEN (p_profile_data->>'tapology_url')::text
      ELSE tapology_url
    END,
    
    -- Bio y avatar
    bio = CASE 
      WHEN p_profile_data ? 'bio' AND p_profile_data->>'bio' NOT IN ('', 'null')
      THEN (p_profile_data->>'bio')::text
      ELSE bio
    END,
    avatar_url = CASE 
      WHEN p_profile_data ? 'avatar_url' AND p_profile_data->>'avatar_url' NOT IN ('', 'null')
      THEN (p_profile_data->>'avatar_url')::text
      ELSE avatar_url
    END,
    
    -- Timestamp
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter with ID % not found', p_fighter_id;
  END IF;
  
  RAISE NOTICE 'Successfully updated fighter profile: %', p_fighter_id;
END;
$$;