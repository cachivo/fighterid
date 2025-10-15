-- ============================================
-- PASO 1: Agregar nueva columna 'published'
-- ============================================
ALTER TABLE public.bdg_event 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- ============================================
-- PASO 2: Migrar datos existentes
-- ============================================
-- Eventos 'live' o 'finished' deben estar publicados
UPDATE public.bdg_event 
SET published = true 
WHERE state IN ('live', 'finished');

-- ============================================
-- PASO 3: Crear índice para optimizar queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bdg_event_published 
ON public.bdg_event(published) 
WHERE published = true;

-- ============================================
-- PASO 4: Actualizar políticas RLS
-- ============================================

-- Eliminar política antigua
DROP POLICY IF EXISTS "Public events visible to all" ON public.bdg_event;

-- Nueva política: Eventos publicados son visibles
CREATE POLICY "Published events visible to all"
ON public.bdg_event
FOR SELECT
USING (published = true);

-- ============================================
-- PASO 5: Habilitar realtime para la tabla
-- ============================================
ALTER TABLE public.bdg_event REPLICA IDENTITY FULL;

-- Agregar tabla a publicación realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'bdg_event'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bdg_event;
  END IF;
END $$;

-- ============================================
-- PASO 6: Agregar comentarios a la tabla
-- ============================================
COMMENT ON COLUMN public.bdg_event.published IS 'Indica si el evento es visible públicamente (independiente del estado)';
COMMENT ON COLUMN public.bdg_event.state IS 'Estado del evento: draft, published, live, finished';