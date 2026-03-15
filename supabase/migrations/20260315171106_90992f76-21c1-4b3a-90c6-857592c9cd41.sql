
-- Fight Telemetry Sessions
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
create policy "Anyone insert telemetry sessions" on fight_telemetry_sessions for insert with check (true);
create policy "Anyone update telemetry sessions" on fight_telemetry_sessions for update using (true);

alter publication supabase_realtime add table fight_telemetry_sessions;

-- Fight Telemetry Events
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
create policy "Anyone insert telemetry events" on fight_telemetry_events for insert with check (true);

alter publication supabase_realtime add table fight_telemetry_events;
