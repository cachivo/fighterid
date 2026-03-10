

## Plan: Ajuste Cromático Global — Migrar Auth, ProfileHub y Componentes al Tema Combat UFC

### Problema Detectado

Hay una inconsistencia cromática significativa. El sistema de diseño define un tema **negro (#0D0D0D) + rojo UFC (#CE1010)**, pero varias páginas y componentes aún usan colores de un tema anterior **púrpura/azul/slate**:

**Auth.tsx (peor caso):**
- `bg-purple-600/15`, `bg-blue-600/10` en los blobs de fondo
- `from-purple-600 to-blue-600` en botones
- `border-purple-500/30`, `bg-slate-950/95`, `bg-slate-900/50`
- `text-amber-400` en links

**AuthCallback.tsx:**
- `from-slate-950 via-purple-950/20 to-slate-950` fondo
- `border-purple-400` spinner

**PasswordStrength.tsx:**
- `text-yellow-500`, `text-green-500` — colores hardcoded en vez de tokens

**ProfileHub.tsx:**
- `bg-green-500/20 text-green-400`, `bg-yellow-500/20 text-yellow-400` — badges con colores hardcoded

**FightersProfilesCreate.tsx:**
- Usa tokens correctos (`text-primary`, `text-muted-foreground`), pero no tiene estética Combat (sin `font-barlow-condensed`, sin bordes rojos)

**SettlementConsole, RoundControlPanel, otros ~89 archivos:**
- Colores hardcoded (`text-blue-800`, `bg-green-100`, `text-gray-400`, etc.)

### Alcance de este cambio

Solo las páginas principales del flujo de usuario: **Auth.tsx**, **AuthCallback.tsx**, **PasswordStrength.tsx**, **ProfileHub.tsx**, **FightersProfilesCreate.tsx**, y **PageSkeleton.tsx**. Los 89 archivos restantes se abordarán en una fase posterior.

### Cambios por archivo

**1. `src/pages/Auth.tsx`**
- Fondo: `bg-black` con gradientes rojos (`bg-primary/15`) en vez de purple/blue blobs
- Card: `bg-card border-primary/30` en vez de `bg-slate-950/95 border-purple-500/30`
- Inputs: `bg-secondary border-border focus:border-primary` en vez de `bg-slate-900/50 border-purple-500/30`
- Botones: `bg-primary hover:bg-primary/90` en vez de gradient purple-blue
- Links: `text-primary` en vez de `text-amber-400`
- Textos: `text-foreground`, `text-muted-foreground` en vez de `text-white/60`
- Email panels: `bg-secondary border-border` en vez de `bg-slate-900/60 border-purple-500/20`

**2. `src/pages/AuthCallback.tsx`**
- Fondo: `bg-background` en vez de `from-slate-950 via-purple-950/20`
- Spinner: `border-primary` en vez de `border-purple-400`
- Success icon: `bg-fighter-success/20 text-fighter-success` en vez de `bg-green-500/20 text-green-500`

**3. `src/components/ui/password-strength.tsx`**
- Reemplazar `text-yellow-500` → `text-fighter-warning`, `[&>div]:bg-yellow-500` → `[&>div]:bg-fighter-warning`
- Reemplazar `text-green-500` → `text-fighter-success`, `[&>div]:bg-green-500` → `[&>div]:bg-fighter-success`

**4. `src/pages/profile/ProfileHub.tsx`**
- Status badges: usar tokens `fighter-success`, `fighter-warning`, `fighter-danger` en vez de `green-500`, `yellow-500`, `red-500`

**5. `src/pages/admin/FightersProfilesCreate.tsx`**
- Aplicar estética Combat: `font-barlow-condensed uppercase` en H1
- Agregar fondo oscuro consistente con el admin panel

**6. `src/components/ui/page-skeleton.tsx`**
- El auth skeleton debe usar `bg-black` para coincidir con Auth.tsx

### Resultado visual esperado
- Toda la experiencia de auth y perfiles usará exclusivamente negro, rojo UFC, y grises del sistema
- Zero colores púrpura, azul o slate visibles en el flujo principal
- Badges de estado usarán los tokens semánticos ya definidos en CSS (`fighter-success`, `fighter-warning`, `fighter-danger`)

