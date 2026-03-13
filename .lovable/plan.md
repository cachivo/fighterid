

## Plan: Ajuste Cromático Global — Fase 3: Páginas Públicas, Componentes de Fighter y Páginas Restantes

### Problema

Quedan ~1200 instancias de colores hardcoded en ~40 archivos. Los más visibles para el usuario son las páginas públicas (FighterProfile, Fighters, Predicciones), el componente DigitalFighterToken (tarjeta de peleador), LicenseAuth (aún tiene el tema púrpura completo), GymPendingInvitation, GymShowcase, y el RefereeControlRoom.

### Alcance: 15 archivos de mayor impacto visual

**Grupo A — Auth pendientes (2 archivos):**
1. `src/pages/license/LicenseAuth.tsx` — Copia exacta del viejo Auth púrpura (blobs, inputs, botones). Migrar al mismo patrón Combat ya aplicado en `Auth.tsx`.
2. `src/pages/gym/GymPendingInvitation.tsx` — `bg-purple-600/15`, `border-purple-500/30`, `text-purple-400`. Migrar a `bg-primary/15`, `border-primary/30`, `text-primary`.

**Grupo B — Componentes de Fighter (2 archivos):**
3. `src/components/DigitalFighterToken.tsx` — 30+ instancias de `purple-*`, `slate-*`, `green-400`, `yellow-400`. Migrar a `primary`, `muted`, `fighter-success`, `fighter-warning`.
4. `src/pages/FighterProfile.tsx` — `getStatusColor` con `bg-green-500`, `bg-blue-500`, `bg-yellow-500`. Record bar con `text-green-400`. Ligas con `text-yellow-500`. Migrar a tokens fighter-*.

**Grupo C — Páginas públicas (3 archivos):**
5. `src/pages/Fighters.tsx` — `bg-green-500/10`, `text-green-600`, `border-green-500/50`. Migrar a `fighter-success`.
6. `src/pages/Predicciones.tsx` — `getStateColor` con `bg-green-100 text-green-800`, `bg-blue-100 text-blue-800`, `bg-gray-100`. Migrar a tokens fighter-* sobre fondo oscuro.
7. `src/components/sections/GymShowcase.tsx` — `text-gray-400`, `text-gray-500`, `border-purple-neon-primary/30` (OK pero `text-gray-*` debe ser `text-muted-foreground`).

**Grupo D — Scoring/Referee (3 archivos):**
8. `src/pages/referee/RefereeControlRoom.tsx` — `text-purple-600 border-purple-600 hover:bg-purple-50`, `hover:bg-red-50`. Migrar a `text-primary border-primary hover:bg-primary/10`.
9. `src/components/station/RoundTimerDisplay.tsx` — `text-red-500`, `text-yellow-500`, `text-green-500`, `bg-red-500`, `bg-yellow-500`, `bg-green-500`. Migrar a `fighter-danger`, `fighter-warning`, `fighter-success`.
10. `src/components/admin/RoundControlPanel.tsx` — `bg-green-50`, `bg-yellow-50`, `bg-blue-50`, `bg-green-950`, `bg-yellow-950`, `bg-blue-950`, `bg-green-500`, `bg-yellow-500`, `bg-blue-500`. Migrar a tokens fighter-* con fondos dark.

**Grupo E — Admin restantes (3 archivos):**
11. `src/components/admin/SettlementConsole.tsx` — Múltiples colores hardcoded en status badges y tablas.
12. `src/pages/admin/EventosPelea.tsx` — `text-green-600`, `bg-green-600`, `bg-blue-500/5`. Migrar instancias restantes.
13. `src/components/admin/LiveControl.tsx` — Status indicators con colores hardcoded.

**Grupo F — Gym pages (2 archivos):**
14. `src/pages/gym/RequestFight.tsx` — `bg-green-500/10 text-green-400`, `text-green-400`. Migrar a `fighter-success`.
15. `src/pages/FightResults.tsx` — Colores de resultado con hardcoded green/red.

### Regla de migración (misma que Fase 2)

| Hardcoded | Token |
|---|---|
| `green-*` (success/win/active) | `fighter-success` |
| `red-*` (danger/loss) | `fighter-danger` / `destructive` |
| `yellow-*`/`amber-*` (warning/draw/pending) | `fighter-warning` |
| `blue-*` (info/corner azul) | `fighter-info` |
| `gray-*`/`slate-*` (neutral) | `muted` / `muted-foreground` |
| `purple-600/15` (blobs) | `bg-primary/15` |
| `border-purple-500/30` | `border-primary/30` |
| `text-purple-400` | `text-primary` |
| `bg-slate-950/95` | `bg-card` |
| `bg-slate-900/50` | `bg-secondary` |
| `hover:bg-purple-50` | `hover:bg-primary/10` |

### Cambios clave por archivo

**LicenseAuth.tsx**: Replicar exactamente los mismos cambios ya hechos en `Auth.tsx` — blobs rojos, card `bg-card`, inputs `bg-secondary`, botones `bg-primary`, steps `bg-primary` en vez de `bg-purple-600`.

**DigitalFighterToken.tsx**: Avatar ring `ring-primary/20`, fallback `bg-muted text-muted-foreground`, nickname `text-primary/70`, record W/L/D `text-fighter-success`/`text-fighter-danger`/`text-fighter-warning`, license `text-primary`, glow `from-primary/20 to-primary/10`, QR `from-primary to-primary/80`.

**FighterProfile.tsx**: `getStatusColor` → tokens fighter-*. Record bar: `text-fighter-success` (wins), `text-fighter-danger` (losses). Ligas: `text-fighter-warning` en vez de `text-yellow-500`.

**RoundTimerDisplay.tsx / RoundControlPanel.tsx**: Timer colors a fighter-* tokens. Panel backgrounds: `bg-fighter-success/10 dark:bg-fighter-success/5` en vez de `bg-green-50 dark:bg-green-950`.

### Archivos NO incluidos (Fase 4)
- `AIStrikeOverlay.tsx` — Red/Blue corner colors son intencionales para diferenciación
- `AggressionButton.tsx` — Red/Blue variant buttons son funcionales
- Station scoring pages — UI especializada de jueces
- ~25 archivos con menos de 5 instancias cada uno

### Resultado esperado
Todas las páginas públicas, de auth, de fighter y de referee usarán exclusivamente el tema Combat UFC con tokens semánticos. Se eliminan las últimas referencias prominentes a púrpura, slate y colores light-mode.

