

# Paleta UFC Negro/Rojo -- Overhaul Completo del Tema

## Resumen

Transformar el sistema de diseno de FighterID de purpura/azul neon a una estetica negra/roja inspirada en UFC. Incluye cambios en CSS variables, fuentes, componentes y nuevas clases utilitarias de combate.

---

## Fase 1: Tipografia -- Barlow Condensed

**Archivo**: `src/index.css`

- Agregar import de Google Fonts: `Barlow Condensed` (pesos 600, 700, 800)
- Aplicar `font-family: 'Barlow Condensed'` con `text-transform: uppercase` y `letter-spacing: 0.05em` a `h1, h2, h3`
- Mantener Inter para cuerpo de texto

**Archivo**: `tailwind.config.ts`

- Agregar `'barlow-condensed': ['Barlow Condensed', 'sans-serif']` a `fontFamily`

---

## Fase 2: Variables CSS -- Remapeo de Colores

**Archivo**: `src/index.css`

Reemplazar toda la paleta de variables CSS:

| Variable | Antes (purpura/azul) | Despues (negro/rojo) |
|----------|---------------------|----------------------|
| `--background` | `210 15% 8%` | `0 0% 5%` (#0D0D0D) |
| `--foreground` | `210 40% 98%` | `0 0% 95%` |
| `--card` | `210 15% 12%` | `0 0% 8%` (#141414) |
| `--border` | `210 12% 30%` | `0 0% 18%` (#2E2E2E) |
| `--primary` | purpura/azul | `0 84% 44%` (#CE1010) |
| `--purple-neon-primary` | `215 25% 50%` | `0 84% 44%` (rojo UFC) |
| `--purple-neon-secondary` | `220 20% 55%` | `0 84% 35%` (rojo oscuro) |
| `--purple-neon-glow` | `215 18% 65%` | `0 84% 55%` (rojo glow) |
| `--ring` | azul | `0 84% 44%` (rojo) |

- Eliminar modo claro (siempre dark mode): mover los valores dark a `:root` y eliminar bloque `.dark`
- Actualizar gradientes: reemplazar hsl purpura/azul con hsl rojo
- Actualizar sombras: reemplazar tonos azules con rojo `hsl(0 84% 44% / opacity)`
- Actualizar animaciones neon: cambiar `hsl(285...)` y `hsl(215...)` a `hsl(0 84% 44%...)`
- Cambiar `*:focus-visible` outline a `hsl(0 84% 44%)` (rojo)
- Agregar scrollbar styling: thumb rojo al hover

---

## Fase 3: Nuevas Clases CSS de Combate

**Archivo**: `src/index.css` (en `@layer components`)

```css
/* Esquinas cortadas diagonales estilo UFC */
.combat-cut { clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
.combat-cut-lg { clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px); }

/* Card con borde rojo izquierdo */
.combat-card { border-left: 3px solid hsl(0 84% 44%); }

/* Badge EN VIVO con punto pulsante */
.status-live { ... con dot animado rojo }

/* Etiqueta uppercase Barlow Condensed */
.ufc-label { font-family: 'Barlow Condensed'; text-transform: uppercase; letter-spacing: 0.1em; }

/* Colores de record */
.stat-win { color: #22c55e; }
.stat-loss { color: #ef4444; }
.stat-draw { color: #eab308; }
```

---

## Fase 4: Componentes Actualizados

### Botones (`src/components/ui/button.tsx`)

- `hero`: `from-purple-neon-primary to-purple-neon-secondary` ya se remapea automaticamente via CSS variables (cambiadas en Fase 2)
- Agregar `rounded-sm` en vez de `rounded-md` para esquinas mas afiladas
- El remapeo de variables CSS hace que todos los variants (neon, cyber, urban, vote) se actualicen automaticamente

### Cards (`src/components/ui/card.tsx`)

- Agregar borde izquierdo rojo de 3px por defecto: `border-l-[3px] border-l-primary`
- Hover con glow rojo: `hover:shadow-[0_0_15px_hsl(0_84%_44%/0.15)]`

### Header (`src/components/Header.tsx`)

- Cambiar `bg-background/90 backdrop-blur-md` a `bg-[#0D0D0D] border-b-[#2E2E2E]` (negro solido, siempre opaco)

### Hero (`src/components/Hero.tsx`)

- Reemplazar `from-purple-900/20 via-black to-blue-900/20` con `from-red-950/30 via-[#0D0D0D] to-black`
- Reemplazar `rgba(139,92,246,...)` (purpura) con `rgba(206,16,16,...)` (rojo)
- Reemplazar `rgba(59,130,246,...)` (azul) con `rgba(206,16,16,0.08)`

### UrbanDecorations (`src/components/UrbanDecorations.tsx`)

- Reemplazar `hsl(280_60%_55%)` con `hsl(0_84%_44%)` (rojo)
- Reemplazar `hsl(220_50%_50%)` con `hsl(0_84%_30%)`

### Badge (`src/components/ui/badge.tsx`)

- Los variants `neon`, `cyber`, `glow` se remapean automaticamente via CSS variables

### PageHeader (`src/components/ui/page-header.tsx`)

- El gradiente `from-primary via-accent to-primary` se actualiza automaticamente al cambiar `--primary` y `--accent`

---

## Fase 5: Otros Archivos con Referencias Directas

Archivos que usan colores hardcoded de purpura/azul que necesitan actualizacion manual:

| Archivo | Cambio |
|---------|--------|
| `src/pages/EventDetail.tsx` | `purple-900/8` -> `red-950/8`, `blue-900/6` -> `red-900/6` |
| `src/components/ProfileIncompleteNotification.tsx` | `purple-900/90` -> `red-950/90`, `purple-500/30` -> `red-500/30` |
| `src/components/sections/LeagueSelector.tsx` | Ya usa variables CSS, se actualiza solo |
| `src/components/StrategicAllies.tsx` | Ya usa `purple-neon-primary`, se actualiza solo |

---

## Fase 6: Tailwind Config

**Archivo**: `tailwind.config.ts`

- Agregar `'barlow-condensed'` a fontFamily
- Las referencias a `purple-neon-primary` etc. ya apuntan a CSS variables, asi que el remapeo en CSS es suficiente
- Agregar color `'cyan-neon'` si no existe (ya existe, se remapea via CSS)

---

## Archivos a Modificar

| Archivo | Cambio Principal |
|---------|-----------------|
| `src/index.css` | Variables CSS, fuentes, clases de combate, scrollbar, focus ring, animaciones |
| `tailwind.config.ts` | Agregar font-family Barlow Condensed |
| `src/components/ui/button.tsx` | Esquinas mas afiladas (rounded-sm) |
| `src/components/ui/card.tsx` | Borde izquierdo rojo, hover glow rojo |
| `src/components/Header.tsx` | Fondo negro solido |
| `src/components/Hero.tsx` | Gradientes rojo/negro |
| `src/components/UrbanDecorations.tsx` | Ambient lights rojos |
| `src/pages/EventDetail.tsx` | Nebula effects rojo |
| `src/components/ProfileIncompleteNotification.tsx` | Colores rojo |
| `index.html` | Agregar link preconnect a Google Fonts |

**Total: 10 archivos modificados, 0 nuevos**

---

## Notas Importantes

- **Estaciones de jueces** (Station1/Station2): Los paneles rojo/azul se preservan intactos ya que usan colores Tailwind directos (`red-950`, `blue-950`), no variables CSS del tema.
- **Modo oscuro forzado**: Se elimina el bloque `.dark` y se colocan los valores oscuros directamente en `:root`. La app siempre sera dark mode.
- **El archivo ZIP subido** no pudo parsearse. El plan se basa enteramente en la descripcion textual del usuario.

