-- Actualizar función RPC para sincronización bidireccional Rankings → Profiles
DROP FUNCTION IF EXISTS public.update_fighter_ranking_level(uuid, text);

CREATE FUNCTION public.update_fighter_ranking_level(
  p_ranking_id uuid,
  p_new_level text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fighter_id UUID;
  v_organization_id UUID;
  v_allowed_levels TEXT[];
BEGIN
  -- Verificar admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update ranking levels';
  END IF;

  -- Obtener fighter_id y organization_id
  SELECT fighter_id, organization_id INTO v_fighter_id, v_organization_id
  FROM public.fighter_rankings
  WHERE id = p_ranking_id;

  IF v_fighter_id IS NULL THEN
    RAISE EXCEPTION 'Ranking entry not found: %', p_ranking_id;
  END IF;

  -- Validar nivel permitido
  SELECT allowed_levels INTO v_allowed_levels
  FROM public.ranking_organizations
  WHERE id = v_organization_id;

  IF v_allowed_levels IS NOT NULL AND NOT (p_new_level = ANY(v_allowed_levels)) THEN
    RAISE EXCEPTION 'Level "%" is not allowed for this organization', p_new_level;
  END IF;

  -- Actualizar ranking
  UPDATE public.fighter_rankings
  SET level = p_new_level, updated_at = now()
  WHERE id = p_ranking_id;

  -- SINCRONIZACIÓN BIDIRECCIONAL: Actualizar perfil del peleador
  UPDATE public.fighter_profiles
  SET level = p_new_level, updated_at = now()
  WHERE id = v_fighter_id;
END;
$$;