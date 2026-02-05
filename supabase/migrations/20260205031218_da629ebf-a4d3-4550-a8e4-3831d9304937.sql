-- =============================================
-- FASE 1: Índices de Escalabilidad + Seguridad
-- =============================================

-- 1. Índice para búsquedas por disciplina + nivel (consultas frecuentes en rankings)
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_discipline_level 
ON fighter_profiles(discipline, level) 
WHERE active = true;

-- 2. Índice para consultas de ranking ordenado por puntos (optimiza leaderboards)
CREATE INDEX IF NOT EXISTS idx_fighter_rankings_points_desc 
ON fighter_rankings(organization_id, points DESC) 
WHERE is_active = true;

-- 3. Índice para búsquedas de licencias activas
CREATE INDEX IF NOT EXISTS idx_fighter_licenses_active_status 
ON fighter_licenses(fighter_id, status) 
WHERE status = 'ACTIVE';

-- 4. Índice para búsquedas de perfiles por user_id (login rápido)
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_user_id 
ON fighter_profiles(user_id) 
WHERE active = true;

-- 5. Índice para eventos de peleas recientes (AI strike events)
CREATE INDEX IF NOT EXISTS idx_ai_strike_events_recent 
ON ai_strike_events(fight_id, created_at DESC);

-- 6. Índice para rankings por categoría de peso
CREATE INDEX IF NOT EXISTS idx_fighter_rankings_weight_class 
ON fighter_rankings(weight_class, organization_id) 
WHERE is_active = true;