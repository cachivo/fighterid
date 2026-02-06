
-- Corrección completa: Recalcular puntos y posiciones

-- 1. Recalcular todos los puntos correctamente
UPDATE fighter_rankings fr
SET 
  points = GREATEST(0, 
    (COALESCE(fp.record_wins, 0) * 10) + 
    (COALESCE(fp.record_draws, 0) * 3) - 
    (COALESCE(fp.record_losses, 0) * 2)
  ),
  updated_at = now()
FROM fighter_profiles fp
WHERE fr.fighter_id = fp.id;

-- 2. Actualizar ranking_position basado en puntos dentro de cada grupo
WITH ranked AS (
  SELECT 
    fr.id,
    ROW_NUMBER() OVER (
      PARTITION BY fr.organization_id, fr.level, fr.weight_class 
      ORDER BY fr.points DESC, fp.record_wins DESC NULLS LAST, fr.created_at ASC
    ) as new_position
  FROM fighter_rankings fr
  JOIN fighter_profiles fp ON fr.fighter_id = fp.id
)
UPDATE fighter_rankings fr
SET ranking_position = ranked.new_position
FROM ranked
WHERE fr.id = ranked.id;
