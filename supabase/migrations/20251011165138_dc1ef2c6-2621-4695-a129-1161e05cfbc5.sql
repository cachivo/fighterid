
-- ============================================
-- FASE 1: CONSOLIDACIÓN DE TABLAS DE JUECES
-- ============================================

-- 1.1. Agregar columna station_metadata a fight_officials
ALTER TABLE public.fight_officials 
ADD COLUMN IF NOT EXISTS station_metadata JSONB DEFAULT '{}'::jsonb;

-- 1.2. Crear función helper para obtener station_number desde role
CREATE OR REPLACE FUNCTION public.get_station_number(p_role TEXT)
RETURNS INTEGER 
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_role
    WHEN 'JUDGE_1' THEN 1
    WHEN 'JUDGE_2' THEN 2
    WHEN 'JUDGE_3' THEN 3
    ELSE NULL
  END;
END;
$$;

-- 1.3. Migrar datos existentes de fight_judges a fight_officials
INSERT INTO public.fight_officials (
  fight_id, 
  official_id, 
  role, 
  confirmed, 
  confirmed_at,
  assigned_at,
  station_metadata
)
SELECT 
  fj.fight_id,
  fj.judge_id,
  CASE fj.station_number
    WHEN 1 THEN 'JUDGE_1'
    WHEN 2 THEN 'JUDGE_2'
    WHEN 3 THEN 'JUDGE_3'
    ELSE 'JUDGE_SCORER'
  END as role,
  fj.confirmed,
  fj.assigned_at,
  fj.assigned_at,
  jsonb_build_object(
    'station_number', fj.station_number,
    'station_ip', fj.station_ip::text,
    'legacy_role', fj.role
  ) as station_metadata
FROM public.fight_judges fj
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.fight_officials fo
  WHERE fo.fight_id = fj.fight_id 
    AND fo.official_id = fj.judge_id
)
ON CONFLICT DO NOTHING;

-- 1.4. Crear índice para mejorar queries por fight_id y role
CREATE INDEX IF NOT EXISTS idx_fight_officials_fight_role 
ON public.fight_officials(fight_id, role);

-- 1.5. Comentario de depreciación en fight_judges
COMMENT ON TABLE public.fight_judges IS 
'DEPRECATED: Esta tabla será eliminada en una futura versión. Usar fight_officials en su lugar.';

-- ============================================
-- FASE 2: FUNCIÓN DE VALIDACIÓN DE ROL
-- ============================================

CREATE OR REPLACE FUNCTION public.is_judge(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'judge'
  )
$$;

COMMENT ON FUNCTION public.is_judge(_user_id uuid) IS 
'Verifica si un usuario tiene el rol de judge en user_roles. Usado por RLS policies y autenticación.';

-- ============================================
-- FASE 3: VERIFICAR Y CREAR RLS POLICIES
-- ============================================

-- Policy para que jueces lean sus asignaciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fight_officials' 
    AND policyname = 'fight_officials_self_read'
  ) THEN
    CREATE POLICY "fight_officials_self_read" ON fight_officials
    FOR SELECT TO authenticated
    USING (official_id = get_current_user_judge_id());
  END IF;
END $$;
