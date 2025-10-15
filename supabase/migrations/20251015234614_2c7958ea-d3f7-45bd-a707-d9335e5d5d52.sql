
-- Eliminar completamente el perfil de blackboxdjhn@gmail.com

-- 1. Eliminar roles del usuario
DELETE FROM public.user_roles 
WHERE user_id = 'b2b4ba42-e627-4e16-8382-06846f4b91fa';

-- 2. Eliminar de app_user (esto eliminará en cascada otras referencias)
DELETE FROM public.app_user 
WHERE email = 'blackboxdjhn@gmail.com';

-- 3. Eliminar de auth.users (sistema de autenticación)
DELETE FROM auth.users 
WHERE email = 'blackboxdjhn@gmail.com';

-- Log de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Usuario blackboxdjhn@gmail.com eliminado completamente de todas las tablas';
END $$;
