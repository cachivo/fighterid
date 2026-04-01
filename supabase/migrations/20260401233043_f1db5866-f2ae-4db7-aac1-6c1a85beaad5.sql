
-- =====================================================
-- Migration: Replace BDG_PRO with FEDEHBOX
-- =====================================================

-- 1. Update ranking_organizations: BDG_PRO → FEDEHBOX
UPDATE ranking_organizations
SET 
  code = 'FEDEHBOX',
  name = 'Federación de Boxeo de Honduras',
  short_name = 'FEDEHBOX',
  allowed_levels = ARRAY['Olímpico', 'Profesional', 'Semi-profesional'],
  description = 'Federación oficial de boxeo olímpico y profesional de Honduras'
WHERE code = 'BDG_PRO';

-- 2. Replace auto_enroll trigger function
CREATE OR REPLACE FUNCTION public.auto_enroll_fighter_by_discipline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_code text;
  v_org_id uuid;
  v_weight text;
BEGIN
  v_weight := COALESCE(NEW.weight_class, 'Sin categoría');

  IF NEW.discipline = 'MMA' THEN
    v_org_code := 'UCC_MMA';
  ELSIF NEW.discipline = 'Boxeo' THEN
    IF NEW.level IN ('Profesional', 'Semi-profesional', 'Olímpico') THEN
      v_org_code := 'FEDEHBOX';
    ELSIF NEW.level = 'Amateur' THEN
      v_org_code := 'HHF_AMATEUR';
    END IF;
  END IF;

  IF v_org_code IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_org_id FROM ranking_organizations WHERE code = v_org_code;
  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
  VALUES (NEW.id, v_org_id, COALESCE(NEW.level, 'Amateur'), v_weight, 0, true)
  ON CONFLICT (fighter_id, organization_id)
  DO UPDATE SET is_active = true, level = EXCLUDED.level, weight_class = EXCLUDED.weight_class, updated_at = now();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_enroll_fighter_by_discipline() IS 
'Auto-inscribe nuevos peleadores en el ranking correspondiente según su disciplina y nivel:
- Boxeo Pro/Semi/Olímpico -> FEDEHBOX
- Boxeo Amateur -> HHF_AMATEUR
- MMA cualquier nivel -> UCC_MMA';

-- 3. Replace boxing level migration function
CREATE OR REPLACE FUNCTION public.handle_boxing_level_migration(
  p_fighter_id uuid,
  p_level text,
  p_weight_class text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discipline text;
  v_weight_class text;
  v_points integer;
BEGIN
  SELECT discipline, weight_class INTO v_discipline, v_weight_class
  FROM fighter_profiles WHERE id = p_fighter_id;

  IF v_discipline != 'Boxeo' OR p_level IS NULL THEN
    RETURN;
  END IF;

  v_weight_class := COALESCE(p_weight_class, v_weight_class, 'Sin categoría');

  IF p_level = 'Amateur' THEN
    -- Deactivate from FEDEHBOX
    UPDATE fighter_rankings fr
    SET is_active = false, updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id
      AND fr.organization_id = ro.id
      AND ro.code = 'FEDEHBOX'
      AND fr.is_active = true;
    
    -- Activate/create in HHF_AMATEUR
    INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
    SELECT p_fighter_id, ro.id, 'Amateur', v_weight_class, 0, true
    FROM ranking_organizations ro WHERE ro.code = 'HHF_AMATEUR'
    ON CONFLICT (fighter_id, organization_id) 
    DO UPDATE SET is_active = true, level = 'Amateur', weight_class = EXCLUDED.weight_class, updated_at = now();
  
  ELSIF p_level IN ('Profesional', 'Semi-profesional', 'Olímpico') THEN
    -- Deactivate from HHF_AMATEUR
    UPDATE fighter_rankings fr
    SET is_active = false, updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id
      AND fr.organization_id = ro.id
      AND ro.code = 'HHF_AMATEUR'
      AND fr.is_active = true;
    
    -- Activate/create in FEDEHBOX
    INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
    SELECT p_fighter_id, ro.id, p_level, v_weight_class, 0, true
    FROM ranking_organizations ro WHERE ro.code = 'FEDEHBOX'
    ON CONFLICT (fighter_id, organization_id) 
    DO UPDATE SET is_active = true, level = EXCLUDED.level, weight_class = EXCLUDED.weight_class, updated_at = now();
  END IF;
END;
$$;

-- 4. Update discipline change handler to use FEDEHBOX
CREATE OR REPLACE FUNCTION public.handle_discipline_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_org_code text;
  v_new_org_id uuid;
  v_current_level text;
BEGIN
  IF OLD.discipline IS NOT NULL AND OLD.discipline != NEW.discipline THEN
    -- Deactivate old rankings
    UPDATE fighter_rankings SET is_active = false, updated_at = now()
    WHERE fighter_id = NEW.id AND is_active = true;

    v_current_level := COALESCE(NEW.level, 'Amateur');

    v_new_org_code := CASE
      WHEN NEW.discipline = 'MMA' THEN 'UCC_MMA'
      WHEN NEW.discipline = 'Boxeo' AND v_current_level = 'Amateur' THEN 'HHF_AMATEUR'
      WHEN NEW.discipline = 'Boxeo' THEN 'FEDEHBOX'
      ELSE NULL
    END;

    IF v_new_org_code IS NOT NULL THEN
      SELECT id INTO v_new_org_id FROM ranking_organizations WHERE code = v_new_org_code;
      IF v_new_org_id IS NOT NULL THEN
        INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
        VALUES (NEW.id, v_new_org_id, v_current_level, COALESCE(NEW.weight_class, 'Sin categoría'), 0, true)
        ON CONFLICT (fighter_id, organization_id)
        DO UPDATE SET is_active = true, level = EXCLUDED.level, weight_class = EXCLUDED.weight_class, updated_at = now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
