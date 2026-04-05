

# Session History in Vision Diagnostics

## Summary

Add a "Session History" section to the Vision Diagnostics page showing all telemetry sessions (not just the active one), with status indicators, event counts, and metadata.

## Changes

### `src/pages/admin/VisionDiagnostics.tsx`

1. **New state + fetch**: Add `sessionHistory` state with an array of all sessions. Query `fight_telemetry_sessions` ordered by `started_at DESC`, limit 20, with no status filter. Include a subquery count of events per session via a separate grouped query on `fight_telemetry_events`.

2. **Session History Card**: Add a new `<Card>` section between the Events Table and Simulation Panel containing a table with columns:
   - **Status** — colored badge: green (`connected`/`active`), yellow (`ended`), red (`disconnected`), gray (other)
   - **Device** — `device_id` or "—"
   - **Fight** — truncated `fight_id` or "—"
   - **Token** — first 8 chars of `session_token`
   - **Started** — formatted `started_at`
   - **Heartbeat** — relative time using existing `heartbeatAge()` helper
   - **Events** — count from the grouped query
   - **Fighters** — red/blue indicators showing if `fighter_red_id`/`fighter_blue_id` are assigned

3. **Status badge mapping**:
   - `connected` / `active` → green Badge (variant `success`)
   - `ended` → outline Badge
   - `disconnected` → destructive Badge
   - Other → secondary Badge

4. **Poll integration**: The existing `poll()` callback will also fetch session history, keeping it updated every 5 seconds.

## Files affected

| File | Change |
|------|--------|
| `src/pages/admin/VisionDiagnostics.tsx` | Add session history table with status indicators |

