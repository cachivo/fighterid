

# Add Simulation Controls to Vision Diagnostics

## Problem
The Vision Engine isn't running, so there's no way to verify the diagnostics page works or that the database schema accepts data correctly.

## Solution
Add a "Simulation Panel" section to the existing `VisionDiagnostics.tsx` page with buttons that:

1. **Create a test telemetry session** — inserts a row into `fight_telemetry_sessions` with `status: 'active'`, `vision_connected: true`, `hud_connected: true`, and a current heartbeat
2. **Simulate a single strike** — inserts a `fight_telemetry_events` row linked to the active session with randomized strike data (corner, type, confidence, body/face, speed)
3. **Simulate a burst (10 strikes)** — inserts 10 random events at once
4. **Reset / close session** — sets the session status to `ended`

All actions use the Supabase client directly (no edge function needed), and results appear instantly in the existing diagnostic cards and events table via the 5-second polling.

## Changes

### `src/pages/admin/VisionDiagnostics.tsx`
- Add a new `Card` section titled "Simulación" below the diagnostic cards grid
- Four buttons: "Crear Sesión", "Simular Golpe", "Ráfaga (×10)", "Cerrar Sesión"
- Each button does a direct `supabase.from(...).insert/update(...)` call
- Uses a temporary fake `fight_id` UUID for the test session
- Toast feedback on success/error
- Buttons disabled based on state (e.g., can't simulate strikes without an active session)

