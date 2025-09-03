-- Drop the existing policy first
DROP POLICY IF EXISTS "Users can create licenses for their own profiles" ON public.fighter_licenses;

-- Create a new policy that allows users to insert licenses for fighter profiles they own
CREATE POLICY "Users can create license applications" 
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

-- Also allow users to select their own licenses (for the dashboard)
CREATE POLICY "Users can view their own licenses" 
ON public.fighter_licenses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_licenses.fighter_id 
    AND au.auth_user_id = auth.uid()
  )
);