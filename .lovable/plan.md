

# Fix: Telemetry Data Not Loading

## Problem
The `useFightTelemetry` hook creates a **new** session every time the HUD opens. The 60 test events are linked to session `ac05e3f4`, but each page load generates a fresh session with zero events. Additionally, existing events are never fetched — the hook only listens for new realtime INSERTs.

## Solution

Two changes to `src/hooks/useFightTelemetry.ts`:

### 1. Reuse existing active session
Before creating a new session, query `fight_telemetry_sessions` for an existing `active` session for this `fight_id`. If one exists, reuse it instead of inserting a new row.

### 2. Load existing events on connect
After obtaining the session ID (whether reused or new), fetch all existing `fight_telemetry_events` for that `session_id` and set them as the initial state. The realtime subscription then appends any new events on top.

## Files Changed
- **Edit** `src/hooks/useFightTelemetry.ts` — add session reuse query + initial events fetch

