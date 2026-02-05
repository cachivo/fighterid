-- =============================================
-- FASE 1: Sistema de Rankings por Organización
-- =============================================

-- 1.1 Tabla de organizaciones de ranking
CREATE TABLE public.ranking_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  allowed_levels TEXT[] NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_ranking_organizations_updated_at
  BEFORE UPDATE ON public.ranking_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.2 Tabla de rankings de peleadores
CREATE TABLE public.fighter_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.ranking_organizations(id) ON DELETE CASCADE,
  weight_class TEXT NOT NULL,
  level TEXT NOT NULL,
  ranking_position INTEGER,
  points INTEGER DEFAULT 0,
  is_champion BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_fight_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fighter_id, organization_id, weight_class, level)
);

-- Indices para performance
CREATE INDEX idx_fighter_rankings_org ON public.fighter_rankings(organization_id);
CREATE INDEX idx_fighter_rankings_fighter ON public.fighter_rankings(fighter_id);
CREATE INDEX idx_fighter_rankings_position ON public.fighter_rankings(organization_id, weight_class, level, ranking_position);
CREATE INDEX idx_fighter_rankings_active ON public.fighter_rankings(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER update_fighter_rankings_updated_at
  BEFORE UPDATE ON public.fighter_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.3 Tabla de auditoría de ajustes de puntos
CREATE TABLE public.ranking_point_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL REFERENCES public.fighter_rankings(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES public.fighter_profiles(id),
  previous_points INTEGER NOT NULL,
  new_points INTEGER NOT NULL,
  adjustment_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  fight_id UUID REFERENCES public.fights(id),
  adjusted_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para auditoría
CREATE INDEX idx_point_adjustments_ranking ON public.ranking_point_adjustments(ranking_id);
CREATE INDEX idx_point_adjustments_fighter ON public.ranking_point_adjustments(fighter_id);
CREATE INDEX idx_point_adjustments_date ON public.ranking_point_adjustments(created_at DESC);

-- =============================================
-- FASE 2: RLS Policies
-- =============================================

-- ranking_organizations: Lectura pública, escritura solo admin
ALTER TABLE public.ranking_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_orgs_public_read" ON public.ranking_organizations
  FOR SELECT USING (true);

CREATE POLICY "ranking_orgs_admin_all" ON public.ranking_organizations
  FOR ALL TO authenticated USING (public.is_admin());

-- fighter_rankings: Lectura pública, escritura solo admin
ALTER TABLE public.fighter_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fighter_rankings_public_read" ON public.fighter_rankings
  FOR SELECT USING (true);

CREATE POLICY "fighter_rankings_admin_all" ON public.fighter_rankings
  FOR ALL TO authenticated USING (public.is_admin());

-- ranking_point_adjustments: Solo admin puede ver y crear
ALTER TABLE public.ranking_point_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_adjustments_admin_only" ON public.ranking_point_adjustments
  FOR ALL TO authenticated USING (public.is_admin());

-- =============================================
-- FASE 3: Función para ajustar puntos
-- =============================================

CREATE OR REPLACE FUNCTION public.adjust_ranking_points(
  p_ranking_id UUID,
  p_new_points INTEGER,
  p_reason TEXT,
  p_fight_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_points INTEGER;
  v_fighter_id UUID;
BEGIN
  -- Solo admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can adjust ranking points';
  END IF;

  -- Obtener puntos actuales
  SELECT points, fighter_id INTO v_old_points, v_fighter_id
  FROM fighter_rankings WHERE id = p_ranking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ranking entry not found';
  END IF;

  -- Actualizar puntos
  UPDATE fighter_rankings 
  SET points = p_new_points, updated_at = now()
  WHERE id = p_ranking_id;

  -- Registrar en auditoría
  INSERT INTO ranking_point_adjustments (
    ranking_id, fighter_id, previous_points, new_points, 
    adjustment_amount, reason, fight_id, adjusted_by
  ) VALUES (
    p_ranking_id, v_fighter_id, v_old_points, p_new_points,
    p_new_points - v_old_points, p_reason, p_fight_id, auth.uid()
  );
END;
$$;

-- =============================================
-- FASE 4: Datos iniciales de organizaciones
-- =============================================

INSERT INTO public.ranking_organizations (code, name, short_name, discipline, allowed_levels, description) VALUES
('UCC_MMA', 'Ultimate Combat Championship Honduras', 'UCC MMA', 'MMA', 
 ARRAY['Profesional', 'Semi-profesional', 'Amateur'], 'Ranking oficial de MMA en Honduras'),
('BDG_PRO', 'BDG Pro Boxing', 'BDG Pro', 'Boxeo', 
 ARRAY['Profesional', 'Semi-profesional'], 'Boxeo profesional y semi-profesional'),
('HHF_AMATEUR', 'Honduras Hood Fights', 'HHF Amateur', 'Boxeo', 
 ARRAY['Amateur'], 'Boxeo amateur - eventos de barrio');

-- =============================================
-- FASE 5: Migración de peleadores existentes
-- =============================================

-- Insertar peleadores MMA activos en UCC
INSERT INTO public.fighter_rankings (fighter_id, organization_id, weight_class, level, points)
SELECT 
  fp.id,
  (SELECT id FROM ranking_organizations WHERE code = 'UCC_MMA'),
  COALESCE(fp.weight_class, 'Sin categoría'),
  COALESCE(fp.level, 'Amateur'),
  GREATEST(0, (COALESCE(fp.mma_record_wins, 0) * 3) + COALESCE(fp.mma_record_draws, 0) - COALESCE(fp.mma_record_losses, 0))
FROM public.fighter_profiles fp
WHERE fp.discipline = 'MMA' AND fp.active = true AND fp.weight_class IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insertar peleadores Boxeo Pro/Semi en BDG Pro
INSERT INTO public.fighter_rankings (fighter_id, organization_id, weight_class, level, points)
SELECT 
  fp.id,
  (SELECT id FROM ranking_organizations WHERE code = 'BDG_PRO'),
  COALESCE(fp.weight_class, 'Sin categoría'),
  COALESCE(fp.level, 'Amateur'),
  GREATEST(0, (COALESCE(fp.boxeo_record_wins, 0) * 3) + COALESCE(fp.boxeo_record_draws, 0) - COALESCE(fp.boxeo_record_losses, 0))
FROM public.fighter_profiles fp
WHERE fp.discipline = 'Boxeo' 
  AND fp.active = true 
  AND fp.level IN ('Profesional', 'Semi-profesional')
  AND fp.weight_class IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insertar peleadores Boxeo Amateur en HHF
INSERT INTO public.fighter_rankings (fighter_id, organization_id, weight_class, level, points)
SELECT 
  fp.id,
  (SELECT id FROM ranking_organizations WHERE code = 'HHF_AMATEUR'),
  COALESCE(fp.weight_class, 'Sin categoría'),
  'Amateur',
  GREATEST(0, (COALESCE(fp.boxeo_record_wins, 0) * 3) + COALESCE(fp.boxeo_record_draws, 0) - COALESCE(fp.boxeo_record_losses, 0))
FROM public.fighter_profiles fp
WHERE fp.discipline = 'Boxeo' 
  AND fp.active = true 
  AND (fp.level = 'Amateur' OR fp.level IS NULL)
  AND fp.weight_class IS NOT NULL
ON CONFLICT DO NOTHING;