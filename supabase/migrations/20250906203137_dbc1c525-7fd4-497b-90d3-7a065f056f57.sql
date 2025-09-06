-- Update RLS policy to allow admins to see all fights including drafts
DROP POLICY IF EXISTS "Peleas públicas visible para todos" ON public.fights;

CREATE POLICY "Public can view live and finished fights" 
ON public.fights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bdg_event e 
    WHERE e.id = fights.event_id 
    AND e.state = ANY (ARRAY['live'::text, 'finished'::text])
  )
);

CREATE POLICY "Admins can view all fights" 
ON public.fights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE app_user.auth_user_id = auth.uid() 
    AND app_user.is_admin = true
  )
);

CREATE POLICY "Event creators can view their event fights" 
ON public.fights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bdg_event e 
    WHERE e.id = fights.event_id 
    AND e.created_by = auth.uid()
  )
);