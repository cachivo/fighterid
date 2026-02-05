-- =====================================================
-- PARTE 1: Fix de datos desincronizados existentes (one-time)
-- =====================================================
UPDATE public.fighter_rankings fr
SET 
  level = fp.level,
  weight_class = fp.weight_class,
  updated_at = now()
FROM public.fighter_profiles fp
WHERE fr.fighter_id = fp.id
  AND fr.is_active = true
  AND (fr.level IS DISTINCT FROM fp.level 
       OR fr.weight_class IS DISTINCT FROM fp.weight_class);

-- =====================================================
-- PARTE 2: Eliminar función existente y recrear con sync
-- =====================================================
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

CREATE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM app_user 
    WHERE auth_user_id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'No autorizado: se requieren privilegios de administrador';
  END IF;

  -- Actualizar fighter_profiles con los campos proporcionados
  UPDATE fighter_profiles
  SET
    first_name = COALESCE(p_profile_data->>'first_name', first_name),
    last_name = COALESCE(p_profile_data->>'last_name', last_name),
    nickname = CASE 
      WHEN p_profile_data ? 'nickname' THEN p_profile_data->>'nickname'
      ELSE nickname
    END,
    weight_class = COALESCE(p_profile_data->>'weight_class', weight_class),
    weight_kg = CASE 
      WHEN p_profile_data ? 'weight_kg' THEN (p_profile_data->>'weight_kg')::numeric
      ELSE weight_kg
    END,
    height_cm = CASE 
      WHEN p_profile_data ? 'height_cm' THEN (p_profile_data->>'height_cm')::numeric
      ELSE height_cm
    END,
    reach_cm = CASE 
      WHEN p_profile_data ? 'reach_cm' THEN (p_profile_data->>'reach_cm')::numeric
      ELSE reach_cm
    END,
    stance = COALESCE(p_profile_data->>'stance', stance),
    country = COALESCE(p_profile_data->>'country', country),
    city = COALESCE(p_profile_data->>'city', city),
    gym_name = COALESCE(p_profile_data->>'gym_name', gym_name),
    coach_name = COALESCE(p_profile_data->>'coach_name', coach_name),
    bio = CASE 
      WHEN p_profile_data ? 'bio' THEN p_profile_data->>'bio'
      ELSE bio
    END,
    avatar_url = COALESCE(p_profile_data->>'avatar_url', avatar_url),
    level = COALESCE(p_profile_data->>'level', level),
    discipline = COALESCE(p_profile_data->>'discipline', discipline),
    active = CASE 
      WHEN p_profile_data ? 'active' THEN (p_profile_data->>'active')::boolean
      ELSE active
    END,
    record_wins = CASE 
      WHEN p_profile_data ? 'record_wins' THEN (p_profile_data->>'record_wins')::integer
      ELSE record_wins
    END,
    record_losses = CASE 
      WHEN p_profile_data ? 'record_losses' THEN (p_profile_data->>'record_losses')::integer
      ELSE record_losses
    END,
    record_draws = CASE 
      WHEN p_profile_data ? 'record_draws' THEN (p_profile_data->>'record_draws')::integer
      ELSE record_draws
    END,
    mma_record_wins = CASE 
      WHEN p_profile_data ? 'mma_record_wins' THEN (p_profile_data->>'mma_record_wins')::integer
      ELSE mma_record_wins
    END,
    mma_record_losses = CASE 
      WHEN p_profile_data ? 'mma_record_losses' THEN (p_profile_data->>'mma_record_losses')::integer
      ELSE mma_record_losses
    END,
    mma_record_draws = CASE 
      WHEN p_profile_data ? 'mma_record_draws' THEN (p_profile_data->>'mma_record_draws')::integer
      ELSE mma_record_draws
    END,
    boxeo_record_wins = CASE 
      WHEN p_profile_data ? 'boxeo_record_wins' THEN (p_profile_data->>'boxeo_record_wins')::integer
      ELSE boxeo_record_wins
    END,
    boxeo_record_losses = CASE 
      WHEN p_profile_data ? 'boxeo_record_losses' THEN (p_profile_data->>'boxeo_record_losses')::integer
      ELSE boxeo_record_losses
    END,
    boxeo_record_draws = CASE 
      WHEN p_profile_data ? 'boxeo_record_draws' THEN (p_profile_data->>'boxeo_record_draws')::integer
      ELSE boxeo_record_draws
    END,
    updated_at = now()
  WHERE id = p_fighter_id;

  -- =====================================================
  -- SINCRONIZACIÓN AUTOMÁTICA A FIGHTER_RANKINGS
  -- =====================================================
  IF p_profile_data ? 'level' OR p_profile_data ? 'weight_class' THEN
    UPDATE public.fighter_rankings
    SET 
      level = CASE 
        WHEN p_profile_data ? 'level' 
          AND p_profile_data->>'level' IS NOT NULL
          AND p_profile_data->>'level' NOT IN ('', 'null')
        THEN p_profile_data->>'level'
        ELSE level
      END,
      weight_class = CASE 
        WHEN p_profile_data ? 'weight_class' 
          AND p_profile_data->>'weight_class' IS NOT NULL
          AND p_profile_data->>'weight_class' NOT IN ('', 'null')
        THEN p_profile_data->>'weight_class'
        ELSE weight_class
      END,
      updated_at = now()
    WHERE fighter_id = p_fighter_id
      AND is_active = true;
  END IF;

  -- Retornar resultado
  SELECT jsonb_build_object(
    'success', true,
    'fighter_id', p_fighter_id,
    'rankings_synced', (
      SELECT COUNT(*) FROM fighter_rankings 
      WHERE fighter_id = p_fighter_id AND is_active = true
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;