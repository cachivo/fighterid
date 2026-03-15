CREATE TABLE IF NOT EXISTS public.vision_sync_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id uuid NULL REFERENCES public.fights(id) ON DELETE SET NULL,
  session_token text NOT NULL UNIQUE,
  hud_connected boolean NOT NULL DEFAULT false,
  vision_connected boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vision_sync_sessions_fight_id ON public.vision_sync_sessions(fight_id);
CREATE INDEX IF NOT EXISTS idx_vision_sync_sessions_created_at ON public.vision_sync_sessions(created_at DESC);

ALTER TABLE public.vision_sync_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vision_sync_sessions'
      AND policyname = 'Public can read vision sync sessions'
  ) THEN
    CREATE POLICY "Public can read vision sync sessions"
      ON public.vision_sync_sessions
      FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'vision_sync_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vision_sync_sessions;
  END IF;
END
$$;