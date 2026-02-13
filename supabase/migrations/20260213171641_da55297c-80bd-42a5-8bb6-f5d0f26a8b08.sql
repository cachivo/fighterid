-- Performance indices for high-traffic queries
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_active ON public.fighter_profiles (active);
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_active_updated ON public.fighter_profiles (active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_weight_class ON public.fighter_profiles (weight_class) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_country ON public.fighter_profiles (country) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_bdg_event_state ON public.bdg_event (state);
CREATE INDEX IF NOT EXISTS idx_bdg_event_start_time ON public.bdg_event (start_time DESC);
CREATE INDEX IF NOT EXISTS idx_bdg_event_state_start ON public.bdg_event (state, start_time) WHERE state NOT IN ('finished');

CREATE INDEX IF NOT EXISTS idx_partners_activo_tipo ON public.partners (activo, tipo, orden);

CREATE INDEX IF NOT EXISTS idx_fights_history_event_date ON public.fights_history (event_date DESC);

CREATE INDEX IF NOT EXISTS idx_fighter_licenses_status ON public.fighter_licenses (status);

-- RPC to reduce round-trips for dashboard stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_fighters', (SELECT count(*) FROM fighter_profiles WHERE active = true),
    'active_fighters', (SELECT count(*) FROM fighter_profiles WHERE active = true AND updated_at >= now() - interval '30 days'),
    'total_events', (SELECT count(*) FROM bdg_event),
    'live_events', (SELECT count(*) FROM bdg_event WHERE state = 'live'),
    'total_licenses', (SELECT count(*) FROM fighter_licenses),
    'active_licenses', (SELECT count(*) FROM fighter_licenses WHERE status = 'ACTIVE'),
    'pending_licenses', (SELECT count(*) FROM fighter_licenses WHERE status = 'PENDING_REVIEW')
  ) INTO result;
  RETURN result;
END;
$$;