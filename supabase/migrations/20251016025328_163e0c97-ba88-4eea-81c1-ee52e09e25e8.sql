
-- Eliminar completamente el usuario blackboxdjhn@gmail.com - versión simplificada

DO $$
DECLARE
  v_auth_user_id uuid;
  v_app_user_id uuid;
  v_fighter_profile_id uuid;
BEGIN
  -- Buscar el auth_user_id en auth.users
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
      
      -- Eliminar licencias y sus dependencias
      DELETE FROM public.fighter_licenses WHERE fighter_id = v_fighter_profile_id;
      DELETE FROM public.fighter_status_updates WHERE fighter_id = v_fighter_profile_id;
      DELETE FROM public.fighter_updates WHERE fighter_id = v_fighter_profile_id;
      
      -- Limpiar referencias en fights
      UPDATE public.fights SET fighter_a_id = NULL WHERE fighter_a_id = v_fighter_profile_id;
      UPDATE public.fights SET fighter_b_id = NULL WHERE fighter_b_id = v_fighter_profile_id;
      UPDATE public.fights SET winner_id = NULL WHERE winner_id = v_fighter_profile_id;
      
      -- Eliminar perfil
      DELETE FROM public.fighter_profiles WHERE id = v_fighter_profile_id;
    END IF;
    
    -- Eliminar otros datos del usuario
    DELETE FROM public.user_roles WHERE user_id = v_auth_user_id;
    DELETE FROM public.wallet WHERE user_id = v_app_user_id;
    DELETE FROM public.app_user WHERE id = v_app_user_id;
  END IF;
  
  -- Eliminar de auth.users
  DELETE FROM auth.users WHERE id = v_auth_user_id;
  
  RAISE NOTICE 'Usuario blackboxdjhn@gmail.com eliminado completamente';
END $$;
