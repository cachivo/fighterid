

# Clean Up Orphaned Telemetry Sessions

## Problem

Both telemetry sessions in the database reference fights that no longer exist:
- `60e4f89e...` → fight `238314f9...` (0 events, vision_engine_01)
- `ac05e3f4...` → fight `563d8558...` (278 events, simulation data)

## Actions

### 1. Delete orphaned data (SQL via insert tool)

Run in order:
```sql
DELETE FROM fight_telemetry_events WHERE session_id IN (
  SELECT s.id FROM fight_telemetry_sessions s
  LEFT JOIN fights f ON f.id = s.fight_id
  WHERE f.id IS NULL
);

DELETE FROM fight_telemetry_sessions s
WHERE NOT EXISTS (SELECT 1 FROM fights f WHERE f.id = s.fight_id);
```

This removes 278 events + 2 orphaned sessions.

### 2. Prevent future orphans (migration)

Add an `ON DELETE CASCADE` foreign key from `fight_telemetry_sessions.fight_id` to `fights.id`. This way, deleting a fight automatically cleans up its telemetry sessions. Similarly, `fight_telemetry_events` already cascades from sessions.

```sql
ALTER TABLE fight_telemetry_sessions
  ADD CONSTRAINT fk_telemetry_session_fight
  FOREIGN KEY (fight_id) REFERENCES fights(id) ON DELETE CASCADE;
```

### Files affected

| Target | Change |
|--------|--------|
| SQL (insert tool) | Delete orphaned events + sessions |
| SQL (migration) | Add CASCADE foreign key to prevent recurrence |

