-- ============================================
-- AI STRIKE DETECTION SYSTEM - DATABASE SCHEMA
-- ============================================

-- Tabla para eventos de golpes detectados por IA
CREATE TABLE IF NOT EXISTS public.ai_strike_events (
  id BIGSERIAL PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  fighter CHAR(1) NOT NULL CHECK (fighter IN ('A', 'B')),
  event_type TEXT NOT NULL CHECK (event_type IN ('strike_attempted', 'strike_connected')),
  strike_type TEXT CHECK (strike_type IN ('jab', 'cross', 'hook', 'uppercut', 'low_kick', 'high_kick', 'body_kick', 'knee', 'elbow', 'other')),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  model_version TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_ai_strike_events_fight_round ON public.ai_strike_events(fight_id, round_number);
CREATE INDEX IF NOT EXISTS idx_ai_strike_events_timestamp ON public.ai_strike_events(timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_ai_strike_events_fighter ON public.ai_strike_events(fighter);

-- Tabla para sesiones de inferencia (tracking del microservicio)
CREATE TABLE IF NOT EXISTS public.ai_inference_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'stopped', 'error', 'paused')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  stopped_at TIMESTAMPTZ,
  avg_fps NUMERIC(5,2),
  avg_latency_ms NUMERIC(7,2),
  total_frames_processed BIGINT DEFAULT 0,
  model_version TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_inference_sessions_fight ON public.ai_inference_sessions(fight_id);
CREATE INDEX IF NOT EXISTS idx_ai_inference_sessions_status ON public.ai_inference_sessions(status);

-- Tabla para versiones de modelos de IA
CREATE TABLE IF NOT EXISTS public.ai_model_versions (
  id TEXT PRIMARY KEY, -- ej: "v2025.10.12"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  precision_connected NUMERIC(4,3) CHECK (precision_connected >= 0 AND precision_connected <= 1),
  recall_connected NUMERIC(4,3) CHECK (recall_connected >= 0 AND recall_connected <= 1),
  f1_score NUMERIC(4,3) CHECK (f1_score >= 0 AND f1_score <= 1),
  is_active BOOLEAN DEFAULT FALSE,
  deployed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Tabla para logs de inferencia
CREATE TABLE IF NOT EXISTS public.ai_inference_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES public.ai_inference_sessions(id) ON DELETE CASCADE,
  fight_id UUID REFERENCES public.fights(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ai_inference_logs_session ON public.ai_inference_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_inference_logs_level ON public.ai_inference_logs(level);
CREATE INDEX IF NOT EXISTS idx_ai_inference_logs_timestamp ON public.ai_inference_logs(timestamp DESC);

-- Tabla para configuración de IA (umbrales, parámetros)
CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Configuración inicial con valores por defecto
INSERT INTO public.ai_config (key, value, description) VALUES
  ('confidence_threshold_connected', '0.75', 'Umbral mínimo de confianza para golpe conectado'),
  ('confidence_threshold_attempted', '0.60', 'Umbral mínimo de confianza para intento de golpe'),
  ('debounce_window_ms', '300', 'Ventana de tiempo para evitar dobles conteos (ms)'),
  ('max_latency_ms', '500', 'Latencia máxima aceptable (ms)'),
  ('target_fps', '30', 'FPS objetivo para procesamiento')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.ai_strike_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_inference_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_inference_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_strike_events
DROP POLICY IF EXISTS "ai_strike_events_public_read" ON public.ai_strike_events;
CREATE POLICY "ai_strike_events_public_read" 
  ON public.ai_strike_events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM fights f 
      JOIN bdg_event e ON f.event_id = e.id 
      WHERE f.id = ai_strike_events.fight_id 
      AND e.state IN ('live', 'finished')
    )
  );

DROP POLICY IF EXISTS "ai_strike_events_service_insert" ON public.ai_strike_events;
CREATE POLICY "ai_strike_events_service_insert" 
  ON public.ai_strike_events FOR INSERT 
  WITH CHECK (true); -- El edge function insertará con service_role

DROP POLICY IF EXISTS "ai_strike_events_admin_all" ON public.ai_strike_events;
CREATE POLICY "ai_strike_events_admin_all" 
  ON public.ai_strike_events FOR ALL 
  USING (is_admin());

-- Políticas para ai_inference_sessions
DROP POLICY IF EXISTS "ai_inference_sessions_admin_all" ON public.ai_inference_sessions;
CREATE POLICY "ai_inference_sessions_admin_all" 
  ON public.ai_inference_sessions FOR ALL 
  USING (is_admin());

DROP POLICY IF EXISTS "ai_inference_sessions_public_read" ON public.ai_inference_sessions;
CREATE POLICY "ai_inference_sessions_public_read" 
  ON public.ai_inference_sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM fights f 
      JOIN bdg_event e ON f.event_id = e.id 
      WHERE f.id = ai_inference_sessions.fight_id 
      AND e.state IN ('live', 'finished')
    )
  );

-- Políticas para ai_model_versions
DROP POLICY IF EXISTS "ai_model_versions_public_read" ON public.ai_model_versions;
CREATE POLICY "ai_model_versions_public_read" 
  ON public.ai_model_versions FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "ai_model_versions_admin_manage" ON public.ai_model_versions;
CREATE POLICY "ai_model_versions_admin_manage" 
  ON public.ai_model_versions FOR ALL 
  USING (is_admin());

-- Políticas para ai_inference_logs
DROP POLICY IF EXISTS "ai_inference_logs_admin_read" ON public.ai_inference_logs;
CREATE POLICY "ai_inference_logs_admin_read" 
  ON public.ai_inference_logs FOR SELECT 
  USING (is_admin());

DROP POLICY IF EXISTS "ai_inference_logs_service_insert" ON public.ai_inference_logs;
CREATE POLICY "ai_inference_logs_service_insert" 
  ON public.ai_inference_logs FOR INSERT 
  WITH CHECK (true);

-- Políticas para ai_config
DROP POLICY IF EXISTS "ai_config_public_read" ON public.ai_config;
CREATE POLICY "ai_config_public_read" 
  ON public.ai_config FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "ai_config_admin_manage" ON public.ai_config;
CREATE POLICY "ai_config_admin_manage" 
  ON public.ai_config FOR ALL 
  USING (is_admin());

-- ============================================
-- REALTIME
-- ============================================

-- Habilitar realtime para eventos en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_strike_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_inference_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_inference_logs;

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para obtener estadísticas en tiempo real de una pelea
CREATE OR REPLACE FUNCTION public.get_ai_fight_stats(p_fight_id UUID, p_round_number INTEGER DEFAULT NULL)
RETURNS TABLE (
  fighter CHAR(1),
  attempted_count BIGINT,
  connected_count BIGINT,
  accuracy NUMERIC,
  last_strike_ms BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.fighter,
    COUNT(*) FILTER (WHERE e.event_type = 'strike_attempted') AS attempted_count,
    COUNT(*) FILTER (WHERE e.event_type = 'strike_connected') AS connected_count,
    CASE 
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'strike_attempted') > 0 
      THEN ROUND(
        COUNT(*) FILTER (WHERE e.event_type = 'strike_connected')::NUMERIC / 
        COUNT(*) FILTER (WHERE e.event_type = 'strike_attempted')::NUMERIC * 100, 
        1
      )
      ELSE 0
    END AS accuracy,
    MAX(e.timestamp_ms) AS last_strike_ms
  FROM public.ai_strike_events e
  WHERE e.fight_id = p_fight_id
    AND (p_round_number IS NULL OR e.round_number = p_round_number)
  GROUP BY e.fighter;
END;
$$;

-- Función para limpiar eventos antiguos (maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_events(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Solo admins pueden ejecutar esto
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can cleanup old events';
  END IF;

  DELETE FROM public.ai_strike_events
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM public.ai_inference_logs
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  RETURN deleted_count;
END;
$$;