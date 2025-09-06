-- Update RLS policies for fights table to allow admins to create fights
-- Drop the existing restrictive policy and create better ones

DROP POLICY IF EXISTS "Event owners can manage fights" ON public.fights;

-- Allow admins to manage all fights
CREATE POLICY "Admins can manage all fights" 
ON public.fights 
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

-- Allow event owners to manage fights for their events
CREATE POLICY "Event owners can manage fights" 
ON public.fights 
FOR ALL 
USING (
  EXISTS ( 
    SELECT 1 FROM bdg_event e 
    WHERE e.id = fights.event_id 
    AND e.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS ( 
    SELECT 1 FROM bdg_event e 
    WHERE e.id = fights.event_id 
    AND e.created_by = auth.uid()
  )
);