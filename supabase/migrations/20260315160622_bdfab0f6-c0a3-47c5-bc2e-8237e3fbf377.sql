
DROP POLICY IF EXISTS ai_strike_events_public_read ON public.ai_strike_events;

CREATE POLICY ai_strike_events_public_read ON public.ai_strike_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fights f WHERE f.id = ai_strike_events.fight_id
    )
  );
