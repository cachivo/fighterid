-- Eliminar completamente el usuario lunaezequiel505@gmail.com

DO $$
DECLARE
  v_auth_user_id uuid := '4f70f0c3-d177-434a-8607-f524675fea3b';
  v_app_user_id uuid := 'a8ffff6d-f3d0-40d7-89a5-68294b6a77ce';
BEGIN
  -- Limpiar referencias en audit_log
  UPDATE public.audit_log 
  SET performed_by = NULL 
  WHERE performed_by = v_auth_user_id;
  
  -- Eliminar rol de usuario
  DELETE FROM public.user_roles WHERE user_id = v_auth_user_id;
  
  -- Eliminar wallet si existe
  DELETE FROM public.wallet WHERE user_id = v_app_user_id;
  
  -- Eliminar app_user
  DELETE FROM public.app_user WHERE id = v_app_user_id;
  
  -- Eliminar de auth.users
  DELETE FROM auth.users WHERE id = v_auth_user_id;
  
  RAISE NOTICE 'Usuario lunaezequiel505@gmail.com eliminado completamente';
END $$;