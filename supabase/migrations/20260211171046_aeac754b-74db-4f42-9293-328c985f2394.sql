
-- Server-side paginated fighter search for gym assignment
CREATE OR REPLACE FUNCTION public.search_fighters_for_gym(
  p_search text DEFAULT NULL,
  p_discipline text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_weight_class text DEFAULT NULL,
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  nickname text,
  avatar_url text,
  discipline public.discipline,
  level text,
  weight_class text,
  mma_record_wins int,
  mma_record_losses int,
  mma_record_draws int,
  boxeo_record_wins int,
  boxeo_record_losses int,
  boxeo_record_draws int,
  record_wins int,
  record_losses int,
  record_draws int,
  active_gym_id uuid,
  active_gym_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fp.id,
    fp.first_name,
    fp.last_name,
    fp.nickname,
    fp.avatar_url,
    fp.discipline,
    fp.level,
    fp.weight_class,
    fp.mma_record_wins,
    fp.mma_record_losses,
    fp.mma_record_draws,
    fp.boxeo_record_wins,
    fp.boxeo_record_losses,
    fp.boxeo_record_draws,
    fp.record_wins,
    fp.record_losses,
    fp.record_draws,
    m.gym_id AS active_gym_id,
    g.nombre AS active_gym_name
  FROM fighter_profiles fp
  LEFT JOIN fighter_gym_memberships m
    ON m.fighter_id = fp.id AND m.status = 'ACTIVE'
  LEFT JOIN gyms g
    ON g.id = m.gym_id
  WHERE fp.active = true
    AND (p_search IS NULL OR p_search = '' OR
         fp.first_name ILIKE '%' || p_search || '%' OR
         fp.last_name ILIKE '%' || p_search || '%' OR
         fp.nickname ILIKE '%' || p_search || '%')
    AND (p_discipline IS NULL OR p_discipline = '' OR fp.discipline::text = p_discipline)
    AND (p_level IS NULL OR p_level = '' OR fp.level = p_level)
    AND (p_weight_class IS NULL OR p_weight_class = '' OR fp.weight_class = p_weight_class)
  ORDER BY fp.first_name, fp.last_name
  LIMIT LEAST(p_limit, 50)
  OFFSET p_offset;
$$;
