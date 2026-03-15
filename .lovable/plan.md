

# Vision Diagnostics Admin Page

## What
Create `/admin/vision-diagnostics` — a real-time diagnostic dashboard that verifies:
1. **Project ID** — confirms the frontend Supabase URL matches the expected project
2. **Active telemetry session** — queries `fight_telemetry_sessions` for `status = 'active'`
3. **Vision Engine status** — shows `vision_connected` and `hud_connected` flags + last heartbeat
4. **Recent strike events** — lists the last 10 `fight_telemetry_events` for the active session

Auto-refreshes every 5 seconds.

## Changes

### 1. `src/pages/admin/VisionDiagnostics.tsx` (new)
- Uses `AdminLayoutWithAI` wrapper (same as Dashboard)
- Four diagnostic cards with status indicators (green check / yellow warning / red error)
- Reads `VITE_SUPABASE_URL` env var to extract and verify Project ID
- Queries `fight_telemetry_sessions` and `fight_telemetry_events` via Supabase client
- `useEffect` with 5s polling interval for live updates
- Shows session ID, token (short), fighter names, heartbeat age, and a table of recent events

### 2. `src/App.tsx`
- Add lazy import for `VisionDiagnostics`
- Add route `<Route path="/vision-diagnostics" element={<VisionDiagnostics />} />` next to the AI strike monitor route

### 3. `src/components/AdminSidebar.tsx`
- Add entry `{ title: 'Vision Diagnostics', url: '/admin/vision-diagnostics', icon: Eye }` to `fightControlItems` array (Eye is already imported)

