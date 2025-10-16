
-- Verificar y crear política pública para ver peleas de eventos publicados
-- Primero, verificar si RLS está habilitado en la tabla fights
ALTER TABLE public.fights ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir ver peleas de eventos publicados
DROP POLICY IF EXISTS "Public can view published event fights" ON public.fights;

CREATE POLICY "Public can view published event fights"
ON public.fights
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bdg_event e
    WHERE e.id = fights.event_id
    AND e.published = true
  )
);

-- Crear política para ver todas las peleas si eres admin
DROP POLICY IF EXISTS "Admins can view all fights" ON public.fights;

CREATE POLICY "Admins can view all fights"
ON public.fights
FOR SELECT
USING (is_admin());
