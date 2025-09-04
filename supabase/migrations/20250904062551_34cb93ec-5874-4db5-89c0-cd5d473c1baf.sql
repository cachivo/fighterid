
-- Otorgar permisos de administrador a Musa
UPDATE app_user 
SET is_admin = true 
WHERE email = 'moisescardenas949@gmail.com';
