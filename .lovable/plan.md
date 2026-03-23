

# Canonical Views + Frontend Migration

## Current State

- **19 files** query `fights` table directly with manual joins to `fighter_profiles`
- **27 files** query `fighter_profiles` directly
- Only 1 view exists: `vision_fight_context` (used by Vision engine only)
- Rankings already use `fighter_rankings` table with joins — working correctly
- Realtime hooks for `fighter_profiles` and `fighter_rankings` already exist and invalidate queries
- Fighter search uses an RPC function `search_fighters_for_gym` — not a view

## What We Will Do

### 1. SQL Migration — Create 2 canonical views

**A. `fights_full`** — Replaces all manual fight+fighter joins
```sql
CREATE OR REPLACE VIEW fights_full AS
SELECT
  f.*,
  COALESCE(NULLIF(fp1.name,''), CONCAT_WS(' ',fp1.first_name,fp1.last_name)) AS fighter_a_name,
  fp1.nickname AS fighter_a_nickname,
  fp1.avatar_url AS fighter_a_avatar,
  fp1.record_wins AS fighter_a_wins, fp1.record_losses AS fighter_a_losses, fp1.record_draws AS fighter_a_draws,
  fp1.weight_class AS fighter_a_weight_class, fp1.country AS fighter_a_country,
  COALESCE(NULLIF(fp2.name,''), CONCAT_WS(' ',fp2.first_name,fp2.last_name)) AS fighter_b_name,
  fp2.nickname AS fighter_b_nickname,
  fp2.avatar_url AS fighter_b_avatar,
  fp2.record_wins AS fighter_b_wins, fp2.record_losses AS fighter_b_losses, fp2.record_draws AS fighter_b_draws,
  fp2.weight_class AS fighter_b_weight_class, fp2.country AS fighter_b_country,
  COALESCE(NULLIF(fpw.name,''), CONCAT_WS(' ',fpw.first_name,fpw.last_name)) AS winner_name,
  e.name AS event_name, e.start_time AS event_date
FROM fights f
LEFT JOIN fighter_profiles fp1 ON f.fighter_a_id = fp1.id
LEFT JOIN fighter_profiles fp2 ON f.fighter_b_id = fp2.id
LEFT JOIN fighter_profiles fpw ON f.winner_id = fpw.id
LEFT JOIN bdg_event e ON f.event_id = e.id;
```

**B. `fights_hud`** — Lightweight for HUD/telemetry (active fights only, no heavy columns)
```sql
CREATE OR REPLACE VIEW fights_hud AS
SELECT fight_id, event_id, fight_number, status, weight_class,
  fighter_a_id, fighter_a_name, fighter_a_nickname,
  fighter_b_id, fighter_b_name, fighter_b_nickname,
  event_name
FROM vision_fight_context;  -- reuse existing view
```

We will NOT create a `search_fighters` view — the existing RPC `search_fighters_for_gym` already handles full-text search with parameters.

We will NOT create a `fighter_rankings` view — the table already works correctly with PostgREST joins.

### 2. Frontend Migration — Key consumers switch to views

Priority files that will switch from `fights` table to `fights_full` or `fights_hud`:

| File | Current | Change to |
|------|---------|-----------|
| `src/pages/admin/FightResults.tsx` | `fights` + joins | `fights_full` |
| `src/hooks/useEvents.tsx` (useFights) | `fights` + joins | `fights_full` |
| `src/pages/HudPublicDisplay.tsx` | `fights` + parallel queries | `fights_hud` |
| `src/hooks/useFightTelemetry.ts` | `fights` + parallel queries | `fights_hud` |
| `src/pages/admin/LiveEventsControl.tsx` | `fights` + joins | `fights_full` |
| `src/pages/judge/DigitalScorecard.tsx` | `fights` + joins | `fights_full` |
| `src/hooks/useFighterHistory.tsx` | `fights` + joins | `fights_full` |
| `src/pages/station/Station1Scoring.tsx` | `fights` + joins | `fights_hud` |
| `src/pages/station/Station2Scoring.tsx` | `fights` + joins | `fights_hud` |
| `src/pages/station/Station3RoundControl.tsx` | `fights` + joins | `fights_hud` |

**Write operations** (`INSERT`, `UPDATE` on fights) remain on the `fights` table — views are read-only.

### 3. RLS for Views

Views inherit RLS from underlying tables. The existing RLS on `fights`, `fighter_profiles`, and `bdg_event` will apply automatically. No additional policies needed.

### 4. What is NOT included

- **`search_fighters` view with `tsvector`**: The existing RPC `search_fighters_for_gym` already handles this. Adding a materialized view with search vectors is a separate optimization task.
- **Removing ALL direct `fighter_profiles` queries**: Many of these are for profile management (create, update, auth flows) — they must stay on the table. Only fight-context reads benefit from views.
- **ENUM migration for status**: Deferred as agreed in hardening phase.

## Files affected

| File | Change |
|------|--------|
| New SQL migration | `fights_full` view, `fights_hud` view |
| `src/pages/admin/FightResults.tsx` | Use `fights_full`, remove manual joins |
| `src/hooks/useEvents.tsx` | `useFights` uses `fights_full` |
| `src/pages/HudPublicDisplay.tsx` | Use `fights_hud`, eliminate parallel queries |
| `src/hooks/useFightTelemetry.ts` | Use `fights_hud` |
| `src/pages/admin/LiveEventsControl.tsx` | Use `fights_full` |
| `src/pages/judge/DigitalScorecard.tsx` | Use `fights_full` |
| `src/hooks/useFighterHistory.tsx` | Use `fights_full` |
| `src/pages/station/Station1Scoring.tsx` | Use `fights_hud` |
| `src/pages/station/Station2Scoring.tsx` | Use `fights_hud` |
| `src/pages/station/Station3RoundControl.tsx` | Use `fights_hud` |

