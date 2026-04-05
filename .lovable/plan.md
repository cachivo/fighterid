

# Add Fighter Validation to /start Endpoint

## Problem
The `/start` endpoint allows sessions to begin even when no fighters are assigned, resulting in orphaned telemetry data with no useful combat context.

## Change

In `supabase/functions/ai-strike-ingest/index.ts`, add a check after fetching the fight context (line 88) and before the lifecycle check (line 90):

```typescript
// 1c. Validate fighters are assigned
if (!ctx.fighter_a_id || !ctx.fighter_b_id) {
  return json({
    error: 'No se puede iniciar — la pelea no tiene ambos peleadores asignados.',
    missing: {
      fighter_a: !ctx.fighter_a_id,
      fighter_b: !ctx.fighter_b_id,
    },
  }, 422);
}
```

This returns a `422 Unprocessable Entity` with details on which fighter slot is empty, so the engine or admin can fix it before retrying.

## Files affected

| File | Change |
|------|--------|
| `supabase/functions/ai-strike-ingest/index.ts` | Add fighter assignment guard after context fetch |

