-- Secure function to check if an email exists in auth.users
-- Only callable from edge functions with service_role
CREATE OR REPLACE FUNCTION public.check_email_exists_fn(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))
  );
$$;