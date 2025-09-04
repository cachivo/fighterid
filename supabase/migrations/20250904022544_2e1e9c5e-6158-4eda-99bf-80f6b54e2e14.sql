-- Make cachivo@gmail.com an admin user
UPDATE public.app_user 
SET is_admin = true 
WHERE email = 'cachivo@gmail.com';