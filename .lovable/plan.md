

# Add `event_type` column to `fight_telemetry_events`

## Problem
The `fight_telemetry_events` table is missing the `event_type` column, which causes insert errors when the simulation panel or the Vision Engine tries to write data.

## Solution
Run a single migration to add the column:

```sql
ALTER TABLE public.fight_telemetry_events
ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'strike_attempted';
```

This adds the column with a safe default so existing rows and new inserts (from the simulation panel) work without changes to the frontend code.

## No code changes needed
The `VisionDiagnostics.tsx` simulation panel does not set `event_type` explicitly, so the `DEFAULT 'strike_attempted'` will apply automatically. No frontend files need to be modified.

