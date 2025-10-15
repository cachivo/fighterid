
-- Eliminar completamente el usuario blackboxdjhn@gmail.com

-- 1. Eliminar roles del usuario
DELETE FROM public.user_roles 
WHERE user_id = '4ce8cebd-181c-4257-9d76-3d3fb5ed57eb';

-- 2. Eliminar perfil de app_user (esto eliminará por cascada todo lo relacionado)
DELETE FROM public.app_user 
WHERE email = 'blackboxdjhn@gmail.com';

-- 3. Eliminar del sistema de autenticación
DELETE FROM auth.users 
WHERE email = 'blackboxdjhn@gmail.com';
