
-- Eliminar usuario blackboxdjhn@gmail.com incluyendo audit_log

DO $$
DECLARE
  v_auth_user_id uuid;
  v_app_user_id uuid;
  v_fighter_profile_id uuid;
BEGIN
  -- Buscar el auth_user_id
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'blackboxdjhn@gmail.com';
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'No se encontró usuario';
    RETURN;
  END IF;
  
  -- Obtener app_user_id
  SELECT id INTO v_app_user_id
  FROM public.app_user 
  WHERE auth_user_id = v_auth_user_id;
  
  IF v_app_user_id IS NOT NULL THEN
    -- Buscar fighter_profile_id
    SELECT id INTO v_fighter_profile_id
    FROM public.fighter_profiles
    WHERE user_id = v_app_user_id;
    
    IF v_fighter_profile_id IS NOT NULL THEN
      -- Actualizar primary_license_id a NULL
      UPDATE public.fighter_profiles 
      SET primary_license_id = NULL
      WHERE id = v_fighter_profile_id;
      
      -- Eliminar licencias asociadas
      DELETE FROM public.fighter_licenses WHERE fighter_id = v_fighter_profile_id;
      
      -- Eliminar actualizaciones de estado
      DELETE FROM public.fighter_status_updates WHERE fighter_id = v_fighter_profile_id;
      
      -- Eliminar perfil de peleador
      DELETE FROM public.fighter_profiles WHERE id = v_fighter_profile_id;
    END IF;
    
    -- Eliminar roles
    DELETE FROM public.user_roles WHERE user_id = v_auth_user_id;
    
    -- Eliminar de app_user
    DELETE FROM public.app_user WHERE id = v_app_user_id;
  END IF;
  
  -- Eliminar registros de audit_log
  DELETE FROM public.audit_log WHERE performed_by = v_auth_user_id;
  
  -- Eliminar de auth.users
  DELETE FROM auth.users WHERE id = v_auth_user_id;
  
  RAISE NOTICE 'Usuario blackboxdjhn@gmail.com eliminado completamente';
  
END $$;
