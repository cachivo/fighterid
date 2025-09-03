-- Allow users to create license applications for their own fighter profiles
CREATE POLICY "Users can create licenses for their own profiles" 
ON public.fighter_licenses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_licenses.fighter_id 
    AND au.auth_user_id = auth.uid()
  )
);