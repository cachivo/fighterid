

## Plan: Ajuste Cromático Global — Fase 4: Password Recovery, Stations, Betting, Social y License restantes

### Problema

Quedan ~300 instancias de colores hardcoded en ~15 archivos visibles. Los peores casos son:
- **License pages** (`LicenseSuspended.tsx`, `LicenseOnboarding.tsx`, `ResetPassword.tsx` license) con fondos `bg-blue-50`, `bg-amber-50`, `text-gray-800`, `bg-gray-100`
- **Auth pages** (`ForgotPassword.tsx`, `ResetPassword.tsx` auth) con `bg-green-50`, `bg-amber-50`, `text-green-600`
- **Station pages** con `bg-green-500`, `bg-yellow-500`, `bg-blue-*` (algunos blue son intencionales para esquina azul)
- **Admin** (`FightApproval.tsx`, `Betting.tsx`) con colores light-mode

### Alcance: 12 archivos

**Grupo A — Auth/Password Recovery (2 archivos):**
1. `src/pages/auth/ForgotPassword.tsx` — `bg-green-50 border-green-200 text-green-600/800`, `bg-amber-50 border-amber-200 text-amber-600/800` → `bg-fighter-success/10 border-fighter-success/30 text-fighter-success`, `bg-fighter-warning/10 border-fighter-warning/30 text-fighter-warning`
2. `src/pages/auth/ResetPassword.tsx` — Buscar colores hardcoded similares

**Grupo B — License pages restantes (3 archivos):**
3. `src/pages/license/LicenseSuspended.tsx` — `bg-blue-50 dark:bg-blue-950/20`, `text-blue-500/700/900`, `bg-amber-50 dark:bg-amber-950/20`, `hover:bg-gray-100 dark:hover:bg-gray-800` → tokens `fighter-info`, `fighter-warning`, `hover:bg-muted`
4. `src/pages/license/LicenseOnboarding.tsx` — `text-gray-800`, `text-gray-500` → `text-foreground`, `text-muted-foreground`
5. `src/pages/license/ResetPassword.tsx` — `bg-gray-50`, `bg-gray-100`, `text-gray-800/900`, `bg-gray-900 hover:bg-gray-800` → `bg-background`, `bg-muted`, `text-foreground`, `bg-primary hover:bg-primary/90`

**Grupo C — Station pages (3 archivos):**
6. `src/pages/station/Station1Scoring.tsx` — Connection dots: `bg-green-500` → `bg-fighter-success`, `bg-yellow-500` → `bg-fighter-warning`
7. `src/pages/station/Station2Scoring.tsx` — Connection dots igual. **Nota:** `blue-950/900/500` son intencionales (esquina azul), se mantienen como `fighter-info` equivalents
8. `src/pages/station/Station3RoundControl.tsx` — Status badges: `bg-green-500` → `bg-fighter-success`, `bg-yellow-500` → `bg-fighter-warning`, `bg-gray-500` → `bg-muted-foreground`. **Nota:** `blue-500/600` en "Esquina Azul" se migran a `fighter-info` para consistencia

**Grupo D — Admin restantes (2 archivos):**
9. `src/pages/admin/FightApproval.tsx` — `statusConfig` colors: `bg-yellow-500/20 text-yellow-400` → `bg-fighter-warning/20 text-fighter-warning`, `bg-blue-500/20 text-blue-400` → `bg-fighter-info/20 text-fighter-info`, `bg-green-500/20 text-green-400` → `bg-fighter-success/20 text-fighter-success`. Counter icons: `text-yellow-400` → `text-fighter-warning`, `text-green-400` → `text-fighter-success`
10. `src/pages/admin/Betting.tsx` — `getStateColor`: `bg-gray-100 text-gray-800` → `bg-muted text-muted-foreground`, `bg-green-100 text-green-800` → `bg-fighter-success/20 text-fighter-success`, `bg-yellow-100 text-yellow-800` → `bg-fighter-warning/20 text-fighter-warning`, `bg-blue-100 text-blue-800` → `bg-fighter-info/20 text-fighter-info`, `bg-purple-100 text-purple-800` → `bg-primary/20 text-primary`

**Grupo E — Social (2 archivos):**
11. `src/pages/social/UserProfile.tsx` — `bg-green-600` badge → `bg-fighter-success`
12. `src/components/social/FighterBadges.tsx` — Discipline colors still use hardcoded values. Migrate to themed palette using `primary`, `fighter-*`, and `destructive` tokens

### Regla de migración (consistente con fases anteriores)

| Hardcoded | Token |
|---|---|
| `bg-green-50/100`, `text-green-600/800` | `bg-fighter-success/10`, `text-fighter-success` |
| `bg-amber-50/100`, `text-amber-600/800` | `bg-fighter-warning/10`, `text-fighter-warning` |
| `bg-blue-50/100`, `text-blue-600/800` | `bg-fighter-info/10`, `text-fighter-info` |
| `bg-gray-50/100`, `text-gray-800/900` | `bg-muted/50`, `text-foreground` |
| `bg-gray-900 hover:bg-gray-800` | `bg-primary hover:bg-primary/90` |
| `hover:bg-gray-100 dark:hover:bg-gray-800` | `hover:bg-muted` |
| `bg-purple-100 text-purple-800` | `bg-primary/20 text-primary` |

### Nota sobre la licencia

Tu licencia **FGT-2025-006** está **ACTIVA** en la base de datos. La confusión visual probablemente se debe a que la página `/profile` (ProfileHub) muestra correctamente el badge "Activo" pero el fondo oscuro puede hacer que no se destaque suficiente. Verificaremos esto visualmente después de aplicar los cambios.

### Resultado esperado
Con esta fase se eliminan prácticamente todas las instancias prominentes de colores hardcoded. Quedarían solo archivos muy especializados (AIStrikeOverlay, AggressionButton) donde los colores red/blue son funcionales para diferenciación de esquinas.

