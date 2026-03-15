

# Fight Telemetry System — Implementation Plan

## Overview
Replace the existing `vision_sync_sessions` approach with a richer **Fight Telemetry Session** system that captures full traceability (event name, fighter IDs, heartbeats) and a dedicated telemetry events table for strike-by-strike tracking from the vision motor.

## Database Changes

### 1. Create `fight_telemetry_sessions` table
```sql
create table fight_telemetry_sessions (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid,
  event_id uuid,
  fighter_red_id uuid,
  fighter_blue_id uuid,
  session_token text unique not null,
  hud_connected boolean default false,
  vision_connected boolean default false,
  started_at timestamptz default now(),
  last_heartbeat timestamptz,
  status text default 'active'
);

alter table fight_telemetry_sessions enable row level security;
create policy "Public read telemetry sessions" on fight_telemetry_sessions for select using (true);
create policy "Service insert telemetry sessions" on fight_telemetry_sessions for insert with check (true);
create policy "Service update telemetry sessions" on fight_telemetry_sessions for update using (true);

-- Enable realtime
alter publication supabase_realtime add table fight_telemetry_sessions;
```

### 2. Create `fight_telemetry_events` table
```sql
create table fight_telemetry_events (
  id bigint generated always as identity primary key,
  session_id uuid references fight_telemetry_sessions(id) on delete cascade,
  fighter_id uuid,
  fighter_corner text,
  strike_type text,
  confidence numeric,
  round int,
  timestamp_video numeric,
  created_at timestamptz default now()
);

alter table fight_telemetry_events enable row level security;
create policy "Public read telemetry events" on fight_telemetry_events for select using (true);
create policy "Service insert telemetry events" on fight_telemetry_events for insert with check (true);

alter publication supabase_realtime add table fight_telemetry_events;
```

## Code Changes

### 3. New hook: `src/hooks/useFightTelemetry.ts`
- On mount (given a `fightId`), fetches fight data (event_id, fighter_a_id, fighter_b_id) plus event title and fighter names via parallel queries (no joins, per existing pattern)
- Creates a `fight_telemetry_sessions` row directly via Supabase client (no edge function needed — the HUD creates it)
- Sets up realtime subscription on `fight_telemetry_events` filtered by `session_id`
- Sends periodic heartbeat updates to `last_heartbeat`
- Returns: `sessionToken`, `telemetryEvents`, `fightMeta` (event name, fighter names, date/time), `status`

### 4. New component: `src/components/FightTelemetryPanel.tsx`
Displays the telemetry info block as specified:
```text
FIGHT TELEMETRY
─────────────────
EVENTO: Batalla Nacional 2026
PELEA: #04
RED: Carlos Martinez
BLUE: Diego Cruz
FECHA: 2026-03-15
HORA: 20:41:03
ROUND: 2  MINUTO: 01:23
SESSION: 91fa-233b
STATUS: LIVE
```
Styled with monospace font, dark background, border accents matching HUD aesthetic.

### 5. Update `src/pages/HudPublicDisplay.tsx`
- Import and use `useFightTelemetry` hook instead of (or alongside) `useVisionSyncSession`
- Add `FightTelemetryPanel` to the HUD layout between the VisionSyncStatus and the main fighter panels
- Subscribe to `fight_telemetry_events` via the hook to show live strike data aggregated by type per fighter corner
- Pass round/clock data to the telemetry panel

### 6. Update `src/pages/HudDemoDisplay.tsx`
- Create a local demo telemetry session (no DB call) to show the telemetry panel with mock data

### 7. Update Edge Function `vision-start-session/index.ts`
- Add a new route/path `telemetry` that also creates a `fight_telemetry_sessions` row (for external vision motor connections)
- Keep backward compatibility with existing `vision_sync_sessions` logic

## Files Modified/Created
- **New migration** — creates both tables with RLS + realtime
- **New** `src/hooks/useFightTelemetry.ts`
- **New** `src/components/FightTelemetryPanel.tsx`
- **Edit** `src/pages/HudPublicDisplay.tsx` — integrate telemetry
- **Edit** `src/pages/HudDemoDisplay.tsx` — mock telemetry panel
- **Edit** `supabase/functions/vision-start-session/index.ts` — telemetry route

