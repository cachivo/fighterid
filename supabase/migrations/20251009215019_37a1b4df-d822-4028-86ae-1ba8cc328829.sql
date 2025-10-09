-- ========================================
-- FIX 1: Corregir función de eliminación de fighter profiles
-- Problema: La función intenta eliminar licencias antes de actualizar primary_license_id
-- ========================================

CREATE OR REPLACE FUNCTION public.admin_delete_fighter_profile(p_fighter_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo admins pueden usar esta función
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete fighter profiles';
  END IF;

  -- CRÍTICO: Primero actualizar primary_license_id a NULL para evitar violación de FK
  UPDATE public.fighter_profiles 
  SET primary_license_id = NULL
  WHERE id = p_fighter_id OR primary_license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );

  -- Eliminar fight bookings
  DELETE FROM public.fight_bookings 
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Eliminar certificaciones médicas
  DELETE FROM public.medical_certifications
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Eliminar documentos de licencia
  DELETE FROM public.license_documents
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Eliminar tokens de verificación
  DELETE FROM public.license_verification_tokens
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Eliminar tests de doping
  DELETE FROM public.doping_tests
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Ahora sí podemos eliminar las licencias
  DELETE FROM public.fighter_licenses WHERE fighter_id = p_fighter_id;
  
  -- Eliminar actualizaciones de estado
  DELETE FROM public.fighter_status_updates WHERE fighter_id = p_fighter_id;
  
  -- Eliminar actualizaciones del fighter
  DELETE FROM public.fighter_updates WHERE fighter_id = p_fighter_id;
  
  -- Actualizar referencias en fights_history (mantener histórico pero sin referencia)
  UPDATE public.fights_history 
  SET red_fighter_id = NULL 
  WHERE red_fighter_id = p_fighter_id;
  
  UPDATE public.fights_history 
  SET blue_fighter_id = NULL 
  WHERE blue_fighter_id = p_fighter_id;
  
  -- Actualizar referencias en fights (mantener histórico pero sin referencia)
  UPDATE public.fights 
  SET fighter_a_id = NULL 
  WHERE fighter_a_id = p_fighter_id;
  
  UPDATE public.fights 
  SET fighter_b_id = NULL 
  WHERE fighter_b_id = p_fighter_id;
  
  UPDATE public.fights 
  SET winner_id = NULL 
  WHERE winner_id = p_fighter_id;
  
  -- Finalmente eliminar el perfil
  DELETE FROM public.fighter_profiles WHERE id = p_fighter_id;
  
  -- Log de auditoría
  RAISE NOTICE 'Successfully deleted fighter profile: %', p_fighter_id;
END;
$function$;

-- ========================================
-- FIX 2: Agregar restricción única para email en app_user
-- Prevenir duplicados de usuarios
-- ========================================

-- Verificar si existe el índice único
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'app_user' 
    AND indexname = 'app_user_email_unique'
  ) THEN
    -- Primero eliminar duplicados si existen
    DELETE FROM public.app_user a
    USING public.app_user b
    WHERE a.id > b.id 
    AND a.email = b.email 
    AND a.auth_user_id IS NULL;  -- Solo eliminar los que no tienen auth_user_id
    
    -- Crear índice único
    CREATE UNIQUE INDEX app_user_email_unique ON public.app_user(email);
  END IF;
END $$;

-- ========================================
-- FIX 3: Restricción única para user_id en fighter_profiles
-- Un usuario solo puede tener un perfil activo
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'fighter_profiles' 
    AND indexname = 'fighter_profiles_user_id_active_unique'
  ) THEN
    -- Primero desactivar perfiles duplicados (mantener solo el más reciente)
    UPDATE public.fighter_profiles fp1
    SET active = false
    WHERE fp1.active = true
    AND EXISTS (
      SELECT 1 FROM public.fighter_profiles fp2
      WHERE fp2.user_id = fp1.user_id
      AND fp2.active = true
      AND fp2.created_at > fp1.created_at
    );
    
    -- Crear índice único parcial (solo para perfiles activos)
    CREATE UNIQUE INDEX fighter_profiles_user_id_active_unique 
    ON public.fighter_profiles(user_id) 
    WHERE active = true;
  END IF;
END $$;

-- ========================================
-- FIX 4: Función para reactivar perfil existente
-- Cuando un usuario intenta registrarse de nuevo
-- ========================================

CREATE OR REPLACE FUNCTION public.reactivate_fighter_profile(
  p_auth_user_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_app_user_id uuid;
  v_fighter_id uuid;
  v_result jsonb;
BEGIN
  -- Buscar app_user existente
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_user_id = p_auth_user_id OR email = p_email
  LIMIT 1;
  
  IF v_app_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', 'none',
      'message', 'No existing user found'
    );
  END IF;
  
  -- Buscar perfil desactivado
  SELECT id INTO v_fighter_id
  FROM public.fighter_profiles
  WHERE user_id = v_app_user_id
  AND active = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_fighter_id IS NOT NULL THEN
    -- Reactivar perfil existente
    UPDATE public.fighter_profiles
    SET active = true, updated_at = now()
    WHERE id = v_fighter_id;
    
    -- Reactivar licencias asociadas
    UPDATE public.fighter_licenses
    SET status = 'PENDING_REVIEW'
    WHERE fighter_id = v_fighter_id
    AND status = 'EXPIRED';
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'reactivated',
      'fighter_id', v_fighter_id,
      'message', 'Profile reactivated successfully'
    );
  ELSE
    -- Verificar si ya tiene perfil activo
    SELECT id INTO v_fighter_id
    FROM public.fighter_profiles
    WHERE user_id = v_app_user_id
    AND active = true
    LIMIT 1;
    
    IF v_fighter_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'action', 'exists',
        'fighter_id', v_fighter_id,
        'message', 'Active profile already exists'
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', false,
      'action', 'none',
      'message', 'No inactive profile found'
    );
  END IF;
END;
$function$;

-- ========================================
-- FIX 5: Trigger para prevenir duplicados en app_user
-- ========================================

CREATE OR REPLACE FUNCTION public.prevent_duplicate_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_id uuid;
BEGIN
  -- Verificar si ya existe un usuario con ese email
  SELECT id INTO existing_id
  FROM public.app_user
  WHERE email = NEW.email
  AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Email % already exists in app_user table', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear trigger si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'app_user_prevent_duplicate'
  ) THEN
    CREATE TRIGGER app_user_prevent_duplicate
    BEFORE INSERT OR UPDATE ON public.app_user
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_duplicate_app_user();
  END IF;
END $$;

-- ========================================
-- Comentarios de documentación
-- ========================================

COMMENT ON FUNCTION public.admin_delete_fighter_profile IS 
'Elimina un perfil de peleador y todos sus datos relacionados de forma segura. 
CRÍTICO: Actualiza primary_license_id a NULL antes de eliminar licencias para evitar violaciones de FK.';

COMMENT ON FUNCTION public.reactivate_fighter_profile IS 
'Reactiva un perfil de peleador existente que fue desactivado. 
Útil cuando un usuario intenta registrarse de nuevo con el mismo email.';

COMMENT ON FUNCTION public.prevent_duplicate_app_user IS 
'Trigger que previene la inserción de usuarios duplicados basándose en el email.';