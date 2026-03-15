ALTER TABLE public.fight_telemetry_events
ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'strike_attempted';