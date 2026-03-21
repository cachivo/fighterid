
-- Add device_id column
ALTER TABLE public.fight_telemetry_sessions 
  ADD COLUMN IF NOT EXISTS device_id text DEFAULT 'unknown';

-- Drop old unique constraint on fight_id alone if exists
DROP INDEX IF EXISTS public.fight_telemetry_sessions_fight_id_key;

-- Add composite unique index for multi-device support
CREATE UNIQUE INDEX IF NOT EXISTS idx_telemetry_fight_device 
  ON public.fight_telemetry_sessions (fight_id, device_id);
