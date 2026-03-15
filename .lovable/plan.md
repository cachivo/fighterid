

# Fix: HUD Not Loading Fight Data

## Root Causes

Two issues prevent the HUD from displaying data:

### 1. `fights` table RLS blocks anonymous reads
The fight exists in the DB but the RLS policy requires either admin auth, event creator auth, or the event to be `published=true` (it's `false`). The "live and finished" policy exists but may not be matching correctly for the anon role. The HUD is a **public display** — it must work without authentication.

**Fix**: Add a permissive RLS SELECT policy that allows reading any fight by its ID when accessed publicly. Since fights don't contain PII, this is safe.

```sql
CREATE POLICY "Anyone can read fights by id"
  ON fights FOR SELECT
  USING (true);
```

However, this is broad. A more targeted approach: drop the existing public policies and replace with a single one that covers published OR live/finished events. But the simplest fix that matches the current pattern is to set the event `published = true` so the existing policy works. **Recommended**: update the event to `published = true` AND fix the code issues below.

### 2. `rounds` table has no `number` column
The table uses `name` (not `number`). The HUD and realtime subscription query `number` which causes a 400 error.

**Fix**: Update `HudPublicDisplay.tsx` to select `name` instead of `number` from the `rounds` table, and map it in the `RoundData` interface.

## Changes

### Migration SQL
```sql
UPDATE bdg_event SET published = true 
WHERE id = 'e3e7db83-be4c-41ac-9cd6-2b121dbae04e';
```

### `src/pages/HudPublicDisplay.tsx`
- Change rounds query: `select('id, name, starts_at, status, duration_seconds')` → use `name` as the round identifier
- Update `RoundData` interface: `number` → `name: string`
- Update references to `round.number` → `round.name`

### `src/hooks/useFightTelemetry.ts`
- Same `fights` query will work once event is published (existing RLS policy allows it)
- No column changes needed here — it doesn't query `rounds`

## Files
- **Migration** — `UPDATE bdg_event SET published = true`
- **Edit** `src/pages/HudPublicDisplay.tsx` — fix `rounds` column name from `number` to `name`

