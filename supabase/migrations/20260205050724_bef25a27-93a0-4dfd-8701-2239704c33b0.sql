-- =====================================================
-- MIGRACIÓN: Sincronización Completa de Disciplina
-- =====================================================

-- 1. CREAR CONSTRAINT ÚNICO EN fighter_rankings (si no existe)
-- Esto permite usar ON CONFLICT para upserts
ALTER TABLE public.fighter_rankings 
ADD CONSTRAINT fighter_rankings_fighter_org_unique 
UNIQUE (fighter_id, organization_id);

-- 2. DROP la función existente
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

-- 3. CREAR LA FUNCIÓN RPC admin_update_fighter_profile CON SINCRONIZACIÓN DE DISCIPLINA
CREATE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_discipline TEXT;
  v_current_level TEXT;
  v_current_weight_class TEXT;
  v_target_org_code TEXT;
  v_target_org_id UUID;
BEGIN
  -- Verificar admin
  SELECT is_admin INTO v_is_admin FROM public.app_user WHERE auth_user_id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Obtener datos actuales del peleador antes de actualizar
  SELECT level, weight_class INTO v_current_level, v_current_weight_class
  FROM public.fighter_profiles WHERE id = p_fighter_id;

  -- Actualizar perfil del peleador
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE(p_profile_data->>'first_name', first_name),
    last_name = COALESCE(p_profile_data->>'last_name', last_name),
    nickname = COALESCE(p_profile_data->>'nickname', nickname),
    country = COALESCE(p_profile_data->>'country', country),
    weight_class = COALESCE(p_profile_data->>'weight_class', weight_class),
    height_cm = COALESCE((p_profile_data->>'height_cm')::INTEGER, height_cm),
    weight_kg = COALESCE((p_profile_data->>'weight_kg')::NUMERIC, weight_kg),
    reach_cm = COALESCE((p_profile_data->>'reach_cm')::INTEGER, reach_cm),
    fighting_style = COALESCE(p_profile_data->>'fighting_style', fighting_style),
    gym_name = COALESCE(p_profile_data->>'gym_name', gym_name),
    bio = COALESCE(p_profile_data->>'bio', bio),
    avatar_url = COALESCE(p_profile_data->>'avatar_url', avatar_url),
    discipline = COALESCE(p_profile_data->>'discipline', discipline::TEXT)::public.competition_discipline,
    level = COALESCE(p_profile_data->>'level', level),
    martial_arts = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts')),
      martial_arts
    ),
    mma_record_wins = COALESCE((p_profile_data->>'mma_record_wins')::INTEGER, mma_record_wins),
    mma_record_losses = COALESCE((p_profile_data->>'mma_record_losses')::INTEGER, mma_record_losses),
    mma_record_draws = COALESCE((p_profile_data->>'mma_record_draws')::INTEGER, mma_record_draws),
    boxeo_record_wins = COALESCE((p_profile_data->>'boxeo_record_wins')::INTEGER, boxeo_record_wins),
    boxeo_record_losses = COALESCE((p_profile_data->>'boxeo_record_losses')::INTEGER, boxeo_record_losses),
    boxeo_record_draws = COALESCE((p_profile_data->>'boxeo_record_draws')::INTEGER, boxeo_record_draws),
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Obtener nuevo nivel si fue actualizado
  IF p_profile_data ? 'level' THEN
    v_current_level := p_profile_data->>'level';
  END IF;

  -- Obtener nuevo weight_class si fue actualizado
  IF p_profile_data ? 'weight_class' THEN
    v_current_weight_class := p_profile_data->>'weight_class';
  END IF;

  -- =====================================================
  -- SINCRONIZACIÓN DE DISCIPLINA A RANKINGS
  -- =====================================================
  IF p_profile_data ? 'discipline' THEN
    v_new_discipline := p_profile_data->>'discipline';
    
    -- 1. Desactivar rankings de organizaciones con disciplina diferente
    UPDATE public.fighter_rankings fr
    SET is_active = false, updated_at = now()
    FROM public.ranking_organizations ro
    WHERE fr.organization_id = ro.id
      AND fr.fighter_id = p_fighter_id
      AND fr.is_active = true
      AND ro.discipline != v_new_discipline;
    
    -- 2. Determinar organización correcta según disciplina + nivel
    v_target_org_code := CASE
      WHEN v_new_discipline = 'MMA' THEN 'UCC_MMA'
      WHEN v_new_discipline = 'Boxeo' AND v_current_level = 'Amateur' THEN 'HHF_AMATEUR'
      WHEN v_new_discipline = 'Boxeo' THEN 'BDG_PRO'
      ELSE NULL
    END;
    
    -- 3. Inscribir automáticamente si no existe ranking activo en la nueva org
    IF v_target_org_code IS NOT NULL THEN
      SELECT id INTO v_target_org_id 
      FROM public.ranking_organizations 
      WHERE code = v_target_org_code;
      
      IF v_target_org_id IS NOT NULL THEN
        INSERT INTO public.fighter_rankings (
          fighter_id, organization_id, weight_class, level, points, is_active
        )
        VALUES (
          p_fighter_id, v_target_org_id, v_current_weight_class, v_current_level, 0, true
        )
        ON CONFLICT (fighter_id, organization_id) 
        DO UPDATE SET 
          is_active = true, 
          level = EXCLUDED.level,
          weight_class = EXCLUDED.weight_class,
          updated_at = now();
      END IF;
    END IF;
  END IF;

  -- Sincronizar level a todos los rankings activos
  IF p_profile_data ? 'level' THEN
    UPDATE public.fighter_rankings
    SET level = p_profile_data->>'level', updated_at = now()
    WHERE fighter_id = p_fighter_id AND is_active = true;
  END IF;

  -- Sincronizar weight_class a todos los rankings activos
  IF p_profile_data ? 'weight_class' THEN
    UPDATE public.fighter_rankings
    SET weight_class = p_profile_data->>'weight_class', updated_at = now()
    WHERE fighter_id = p_fighter_id AND is_active = true;
  END IF;
END;
$$;

-- 4. FIX DE DATOS EXISTENTES: Desactivar rankings incompatibles
UPDATE public.fighter_rankings fr
SET is_active = false, updated_at = now()
FROM public.fighter_profiles fp, public.ranking_organizations ro
WHERE fr.fighter_id = fp.id
  AND fr.organization_id = ro.id
  AND fr.is_active = true
  AND fp.discipline IS NOT NULL
  AND fp.discipline::text != ro.discipline;

-- 5. FIX DE DATOS: Inscribir peleadores con Boxeo en organizaciones correctas
INSERT INTO public.fighter_rankings (fighter_id, organization_id, weight_class, level, points, is_active)
SELECT 
  fp.id,
  ro.id,
  fp.weight_class,
  fp.level,
  0,
  true
FROM public.fighter_profiles fp
CROSS JOIN public.ranking_organizations ro
WHERE fp.discipline::text = ro.discipline
  AND fp.level = ANY(ro.allowed_levels)
  AND fp.discipline IS NOT NULL
  AND fp.active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.fighter_rankings fr 
    WHERE fr.fighter_id = fp.id 
    AND fr.organization_id = ro.id 
    AND fr.is_active = true
  )
ON CONFLICT (fighter_id, organization_id) 
DO UPDATE SET 
  is_active = true,
  level = EXCLUDED.level,
  weight_class = EXCLUDED.weight_class,
  updated_at = now();