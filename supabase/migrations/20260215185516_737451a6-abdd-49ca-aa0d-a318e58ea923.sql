-- Paso 1: Eliminar registros huérfanos en app_user (usuarios eliminados de auth.users)
DELETE FROM public.app_user 
WHERE auth_user_id NOT IN (SELECT id FROM auth.users);

-- Paso 2: Eliminar constraint UNIQUE duplicado en email
ALTER TABLE public.app_user DROP CONSTRAINT IF EXISTS app_user_email_unique;