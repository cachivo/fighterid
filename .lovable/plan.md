

# Insert Complete Fight Simulation Data

## What
Insert a full telemetry session + ~60 strike events across 3 rounds using fight `563d8558` (Dennis Román Landaverde vs Michael Cabrera) to test the end-to-end flow.

## Data to Insert

### 1. Telemetry Session
One `fight_telemetry_sessions` row:
- `fight_id`: `563d8558-839e-40fa-afd6-882325982f53`
- `fighter_red_id`: `53b234ac-daf1-4fff-a184-3c196d512a8a` (Dennis Román)
- `fighter_blue_id`: `b9523962-6c92-4075-b644-dd2b7cd314b6` (Michael Cabrera)
- `session_token`: generated UUID
- `hud_connected`: true, `vision_connected`: true
- `status`: 'active'

### 2. Telemetry Events (~60 rows)
Distributed across 3 rounds with realistic strike patterns:

**Round 1** (~20 strikes): More jabs/crosses, building rhythm
**Round 2** (~22 strikes): Mixed power shots, hooks and kicks increase  
**Round 3** (~18 strikes): Fatigue pattern, fewer but heavier strikes

Each event includes:
- `session_id` referencing the session above
- `fighter_id` alternating between both fighters
- `fighter_corner`: 'red' or 'blue'
- `strike_type`: jab, cross, hook, uppercut, low_kick, high_kick, knee, elbow
- `confidence`: 0.75–0.98
- `round`: 1, 2, or 3
- `timestamp_video`: progressive seconds within each round

## Implementation
Single code change: a small script executed via a Supabase edge function call (using the existing `ai-strike-test-simulator` pattern) or direct inserts from client code. The fastest approach is to insert directly via the Supabase client in a temporary utility, but since this is test data, I'll generate the SQL inserts directly.

## Files
- No permanent file changes needed — this is a one-time data insertion

