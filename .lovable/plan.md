
# Canonical Views — COMPLETED

## What was done

### SQL Migration
- Created `fights_full` view: joins fights + fighter_profiles (A, B, winner) + bdg_event
- Created `fights_hud` view: lightweight wrapper over `vision_fight_context`

### Frontend Migration (10 files)
All fight data reads now use canonical views instead of direct table queries with manual joins:

| File | View |
|------|------|
| `src/hooks/useEvents.tsx` (useFights) | `fights_full` |
| `src/pages/admin/FightResults.tsx` | `fights_full` |
| `src/pages/admin/LiveEventsControl.tsx` | `fights_full` (via useFights) |
| `src/pages/judge/DigitalScorecard.tsx` | `fights_full` |
| `src/hooks/useFighterHistory.tsx` | `fights_full` |
| `src/pages/HudPublicDisplay.tsx` | `fights_hud` |
| `src/hooks/useFightTelemetry.ts` | `fights_hud` |
| `src/pages/station/Station1Scoring.tsx` | `fights_hud` |
| `src/pages/station/Station2Scoring.tsx` | `fights_hud` |
| `src/pages/station/Station3RoundControl.tsx` | `fights_hud` |

### Write operations
INSERT/UPDATE on fights remain on the `fights` table (views are read-only).
