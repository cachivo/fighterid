

# Add AI Vision Motor shortcut to Admin Dashboard

## What
Add two new quick-access items in the "Acciones Rápidas" card on the admin dashboard:
1. **Motor de Visión AI (Demo)** — links to `/hud/demo` for the simulated demo mode
2. **Monitor de Golpes AI** — links to `/admin/ai-strike-monitor` for the existing strike monitor page

Both will use the `Eye` (or `Zap`) icon from lucide-react to visually distinguish them as AI Vision features, with a highlight border to make them stand out.

## Changes

### `src/pages/admin/Dashboard.tsx`
- Import `Eye` and `Zap` from lucide-react
- Add two new action rows inside the "Acciones Rápidas" card (after the existing 3 items):
  - **HUD Demo**: icon `Eye`, title "Motor de Visión AI (Demo)", description "Ver estadísticas de golpes en tiempo real (simulación)", button links to `/hud/demo`
  - **AI Strike Monitor**: icon `Zap`, title "Monitor de Golpes AI", description "Panel de control del motor de visión", button links to `/admin/ai-strike-monitor`

Single file edit, ~20 lines added.

