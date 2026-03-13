

## Plan: Ajuste Cromático Global — Fase 2: Migrar Páginas Admin, License, Social al Tema Combat UFC

### Problema

652 instancias de colores hardcoded (green-500, blue-500, gray-50, bg-white, etc.) en 29 archivos. Los screenshots muestran fondos blancos/claros, badges verdes/azules que rompen la estética negra UFC. El peor caso es `LicenseLayout.tsx` que usa `to-urban-light` (96% blanco) como fondo.

### Alcance: Los 15 archivos más visibles

**Grupo A — Layouts (impacto global):**
1. `src/components/LicenseLayout.tsx` — `to-urban-light` → `to-muted/10`

**Grupo B — Admin pages (10 archivos):**
2. `src/pages/admin/ValidacionLicencias.tsx` — `bg-green-50`, `text-green-600`, `bg-gray-50` → tokens fighter-*
3. `src/pages/admin/JudgeStationsSetup.tsx` — `text-green-600` → `text-fighter-success`
4. `src/pages/admin/LiveEventsControl.tsx` — `bg-green-500`, `bg-yellow-500`, `bg-blue-500` → fighter-* tokens
5. `src/pages/admin/PendingChangesHub.tsx` — `bg-green-500/10`, `text-green-600`, `bg-red-500/10` → fighter-* tokens
6. `src/pages/admin/JudgesManagement.tsx` — `from-blue-400`, `from-green-400`, `bg-gray-500` → fighter-* tokens
7. `src/pages/admin/OfficialsManagement.tsx` — `text-green-500`, `bg-yellow-500/20`, `bg-blue-500/20` → fighter-* tokens

**Grupo C — License pages (3 archivos):**
8. `src/pages/license/LicenseWelcome.tsx` — `text-green-500` → `text-fighter-success`
9. `src/pages/license/LicensePending.tsx` — `bg-green-500`, `text-blue-500`, `bg-gray-100` → fighter-* tokens
10. `src/pages/license/LicenseDashboard.tsx` — `bg-amber-600` → `text-fighter-warning`

**Grupo D — Social components (3 archivos):**
11. `src/components/social/PostCard.tsx` — `bg-blue-500`, `bg-green-500`, `bg-purple-500` → fighter-* tokens
12. `src/components/social/NotificationCard.tsx` — hardcoded color map → fighter-* tokens
13. `src/components/social/FighterBadges.tsx` — `bg-slate-500/10`, discipline colors → themed palette

**Grupo E — Social feed:**
14. `src/pages/SocialFeed.tsx` — `bg-green-500` dot → `bg-fighter-success`

**Grupo F — Button variants cleanup:**
15. `src/components/ui/button.tsx` — Rename `purple-neon-*` references to use cleaner token names (functionally OK since CSS vars are already red, but the code reads confusingly)

### Regla de migración

| Hardcoded color | Token semántico |
|---|---|
| `green-*` (success/active/connected) | `fighter-success` |
| `red-*` (danger/error/loss) | `fighter-danger` o `destructive` |
| `yellow-*` / `amber-*` (warning/pending) | `fighter-warning` |
| `blue-*` (info/national) | `fighter-info` |
| `gray-*` / `slate-*` (neutral) | `muted` / `muted-foreground` |
| `bg-green-50`, `bg-gray-50` (light bg) | `bg-fighter-success/10`, `bg-muted/50` |
| `bg-white` (content preview) | Keep for HTML email preview only |

### Cambios principales por archivo

**LicenseLayout.tsx**: `from-background to-urban-light` → `from-background to-background`

**ValidacionLicencias.tsx** (review modal): 
- `bg-green-50` → `bg-fighter-success/10`
- `text-green-600` → `text-fighter-success`
- `bg-gray-50` → `bg-muted/50`
- `text-gray-600` → `text-muted-foreground`

**LiveEventsControl.tsx**:
- Status badges: `bg-green-500` → `bg-fighter-success`, `bg-yellow-500` → `bg-fighter-warning`
- Connected counts: `text-green-500` → `text-fighter-success`
- Red/blue fighter bars: Keep differentiated but use `from-primary to-primary/80` and `from-fighter-info to-fighter-info/80`

**PendingChangesHub.tsx**:
- Approved: `bg-green-500/10 text-green-600` → `bg-fighter-success/10 text-fighter-success`
- Rejected: `bg-red-500/10 text-red-600` → `bg-fighter-danger/10 text-fighter-danger`
- Info: `bg-blue-500/10 text-blue-600` → `bg-fighter-info/10 text-fighter-info`

**LicensePending.tsx**:
- Step completed: `bg-green-500` → `bg-fighter-success`
- Info dots: `bg-blue-500` → `bg-primary`
- Hover: `hover:bg-gray-100 dark:hover:bg-gray-800` → `hover:bg-muted`

**Social PostCard/NotificationCard**:
- Post type dots: `bg-blue-500` → `bg-fighter-info`, `bg-green-500` → `bg-fighter-success`, `bg-purple-500` → `bg-primary`
- Notification colors: Map to fighter-* tokens

### Files NOT in this phase
- `EmailCampaignDetail.tsx` (`bg-white` for HTML preview is intentional)
- `SettlementConsole.tsx`, `RoundControlPanel.tsx` — specialized scoring UIs, separate phase
- Station scoring pages — separate phase
- ~15 remaining files with fewer instances

### Expected result
All admin, license, and social pages will use exclusively the dark Combat theme with semantic fighter-* tokens. Zero light-mode colors (green-50, gray-50) visible.

