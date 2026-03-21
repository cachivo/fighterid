

# Vision Engine Sync Status: Web ↔ Motor

## What exists today

- **Table `fight_telemetry_sessions`**: Already exists with `id`, `fight_id`, `session_token`, `status`, `hud_connected`, `vision_connected`, `last_heartbeat`, `started_at`. Missing: `device_id`.
- **Table `ai_inference_sessions`**: Used by `/start` endpoint but does NOT have heartbeat/sync status fields.
- **Edge Function `ai-strike-ingest`**: Has `/start`, `/event`, `/stop`, `/end` but NO `/heartbeat` endpoint.
- **Components**: `VisionSyncStatus` and `FightTelemetryPanel` exist but are only used in admin HUD pages, not in the public fight view.
- **Bug in logs**: `timestamp_ms` column is `bigint` but the motor sends floats like `1774121214.80602` — causing insert errors.

## Plan

### 1. Migration SQL

- Add `device_id text` column to `fight_telemetry_sessions`
- Fix `timestamp_ms` in `ai_strike_events` from `bigint` to `numeric` (or cast to bigint in the edge function) to stop the float insertion errors

### 2. Edge Function — Add `/heartbeat` endpoint to `ai-strike-ingest`

New `POST /heartbeat` handler:
- Accepts `{ fight_id, device_id }`
- Upserts `fight_telemetry_sessions`: sets `status = 'connected'`, `last_heartbeat = now()`, `device_id`
- If no session exists for that `fight_id`, creates one
- Returns `{ success: true, session_id }`

Also update `POST /start` to:
- Create/update a `fight_telemetry_sessions` row alongside the `ai_inference_sessions` row (bridging both tables)
- Set `status = 'connected'`, `device_id`, `last_heartbeat = now()`

Fix `POST /event`:
- Cast `timestamp_ms` to integer (`Math.round()`) before inserting to prevent the bigint error

Update `/health` version to `3.1`.

### 3. New hook: `useVisionEngineStatus(fightId)`

Small React hook that:
- Subscribes to Realtime changes on `fight_telemetry_sessions` filtered by `fight_id`
- Computes `isLive` based on `Date.now() - last_heartbeat < 10000`
- Re-evaluates every 3 seconds via `setInterval`
- Returns `{ isLive, deviceId, lastHeartbeat, status }`

### 4. New component: `VisionEngineIndicator`

Compact UI badge for the public fight view:
- `isLive = true` → green dot + "Motor conectado" + device_id
- `isLive = false` → red dot + "Sin señal"
- Bonus: shows last strike time and latency if available

### 5. Integrate into fight detail page

Add `VisionEngineIndicator` to `EventDetail.tsx` or the fight view, visible when a fight is selected/active.

## Files affected

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Add `device_id` to `fight_telemetry_sessions`, fix `timestamp_ms` type |
| `supabase/functions/ai-strike-ingest/index.ts` | Add `/heartbeat`, bridge `/start` to telemetry sessions, fix timestamp cast |
| `src/hooks/useVisionEngineStatus.ts` | New hook — Realtime subscription + heartbeat check |
| `src/components/VisionEngineIndicator.tsx` | New component — live/disconnected badge |
| `src/pages/EventDetail.tsx` | Mount `VisionEngineIndicator` for active fights |

