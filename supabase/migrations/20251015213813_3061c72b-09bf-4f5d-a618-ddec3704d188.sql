
-- Eliminar el rol del usuario
DELETE FROM public.user_roles 
WHERE user_id = '07812e67-8a28-406d-95a2-de528204ea97';

-- Eliminar el app_user (esto debería limpiar referencias en cascada)
DELETE FROM public.app_user 
WHERE id = '7936a86a-d081-4608-81bd-6b0e50666603';

-- Nota: El usuario de auth.users debe eliminarse manualmente desde el dashboard de Supabase
-- en Authentication > Users, buscando por email: blackboxdjhn@gmail.com
