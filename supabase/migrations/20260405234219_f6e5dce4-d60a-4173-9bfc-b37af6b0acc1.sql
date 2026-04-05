-- Step 1: Delete orphaned telemetry events
DELETE FROM fight_telemetry_events WHERE session_id IN (
  SELECT s.id FROM fight_telemetry_sessions s
  LEFT JOIN fights f ON f.id = s.fight_id
  WHERE f.id IS NULL
);

-- Step 2: Delete orphaned telemetry sessions
DELETE FROM fight_telemetry_sessions
WHERE NOT EXISTS (SELECT 1 FROM fights f WHERE f.id = fight_telemetry_sessions.fight_id);

-- Step 3: Add foreign key with CASCADE to prevent future orphans
ALTER TABLE fight_telemetry_sessions
  ADD CONSTRAINT fk_telemetry_session_fight
  FOREIGN KEY (fight_id) REFERENCES fights(id) ON DELETE CASCADE;