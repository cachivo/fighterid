-- Update RLS policies to allow authenticated users to create fights
-- This resolves the "No se pudo crear pelea" error

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage all fights" ON public.fights;
DROP POLICY IF EXISTS "Event owners can manage fights" ON public.fights;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can create fights" ON public.fights
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fights" ON public.fights
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete fights" ON public.fights
FOR DELETE TO authenticated
USING (true);

-- Keep the existing read policy
-- The "Peleas públicas visible para todos" policy already exists for SELECT