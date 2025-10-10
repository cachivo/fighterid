-- Sistema de Scoring en Vivo - Base Simple
DO $$ BEGIN
  CREATE TYPE strike_type AS ENUM ('punch', 'kick', 'elbow', 'knee', 'takedown', 'knockdown', 'defense', 'foul');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE strike_target AS ENUM ('head', 'body', 'leg');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE corner AS ENUM ('red', 'blue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.fights ADD COLUMN IF NOT EXISTS is_championship BOOLEAN DEFAULT FALSE;
ALTER TABLE public.judges ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) UNIQUE;

CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number > 0 AND number <= 12),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  duration_seconds INTEGER DEFAULT 180,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (fight_id, number)
);

CREATE TABLE IF NOT EXISTS public.scoring_events (
  id BIGSERIAL PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL CHECK (timestamp_ms >= 0),
  judge_id UUID NOT NULL REFERENCES public.judges(id),
  corner corner NOT NULL,
  type strike_type NOT NULL,
  target strike_target,
  power SMALLINT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fight_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'scorer',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  station_number INTEGER,
  station_ip INET,
  confirmed BOOLEAN DEFAULT FALSE,
  UNIQUE (fight_id, judge_id)
);

CREATE TABLE IF NOT EXISTS public.scoring_weights (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES public.bdg_event(id),
  punch_weight NUMERIC DEFAULT 1.0,
  kick_weight NUMERIC DEFAULT 1.3,
  defense_weight NUMERIC DEFAULT 0.8,
  head_multiplier NUMERIC DEFAULT 1.2,
  body_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_rounds" ON public.rounds FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "admin_all_scoring" ON public.scoring_events FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "admin_all_judges" ON public.fight_judges FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "admin_all_weights" ON public.scoring_weights FOR ALL TO authenticated USING (is_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;