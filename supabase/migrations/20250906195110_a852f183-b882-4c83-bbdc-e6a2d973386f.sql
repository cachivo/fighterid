-- Update RLS policies for bdg_event to allow admins to create events
-- First, let's create a better policy for admins

-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS "Event creators can manage their events" ON public.bdg_event;

-- Allow admins to create, read, update and delete events
CREATE POLICY "Admins can manage all events" 
ON public.bdg_event 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() 
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Allow event creators to manage their own events
CREATE POLICY "Event creators can manage their events" 
ON public.bdg_event 
FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);