

# Auditoría Mobile del Panel Admin + Auto-cierre del Sidebar

## Problema 1: Sidebar no se cierra al navegar (móvil)
En móvil, el sidebar se muestra como un panel overlay (Sheet). Al tocar un enlace, el sidebar se queda abierto cubriendo la pantalla en negro, confundiendo al usuario que no sabe cómo volver al contenido.

**Solución**: En `AdminSidebar.tsx`, usar el hook `useSidebar()` para llamar `setOpenMobile(false)` al hacer click en cualquier NavLink cuando `isMobile` es true.

## Problema 2: Módulos admin sin optimización mobile

Tras auditar los 26+ archivos en `src/pages/admin/`, estos son los módulos con problemas de responsividad en viewport ~390px:

### Tablas sin wrapper scrollable (se desbordan)
| Archivo | Problema |
|---------|----------|
| `LiveStreaming.tsx` | `<Table>` sin `overflow-x-auto`, 6 columnas fijas |
| `RankingsManagement.tsx` | Tabla de ranking sin wrapper scroll |
| `Betting.tsx` | Tabs `grid-cols-4` se comprimen; tablas sin scroll |

### Formularios con `grid-cols-2/3` sin breakpoint mobile
| Archivo | Problema |
|---------|----------|
| `OfficialsManagement.tsx` | 4 bloques `grid-cols-2` y 1 `grid-cols-3` sin `md:` prefix |
| `Sanctions.tsx` | 3 bloques `grid-cols-2` sin responsive |
| `FightResults.tsx` | `grid-cols-2` y `grid-cols-3` en formulario de resultado sin `md:` |
| `LiveEventsControl.tsx` | `grid-cols-2`, `grid-cols-3` fijos en fight cards |
| `Betting.tsx` | Formularios con `grid-cols-2` fijos |

### Tabs comprimidos
| Archivo | Problema |
|---------|----------|
| `Betting.tsx` | `grid-cols-4` en TabsList — texto ilegible en 390px |

## Plan de cambios

### 1. `AdminSidebar.tsx` — Auto-cierre en mobile
- Importar `useSidebar` (ya importado), usar `isMobile` y `setOpenMobile`
- Envolver cada `NavLink` con `onClick={() => isMobile && setOpenMobile(false)}`

### 2. `LiveStreaming.tsx` — Tabla responsive
- Envolver `<Table>` con `<div className="overflow-x-auto -mx-4 px-4">`

### 3. `RankingsManagement.tsx` — Tabla responsive
- Envolver tabla de ranking con wrapper scrollable

### 4. `Betting.tsx` — Tabs + tablas + formularios
- Cambiar `grid-cols-4` en TabsList a `grid-cols-2` en mobile
- Envolver tablas con wrapper scrollable
- Cambiar formularios `grid-cols-2` a `grid-cols-1 md:grid-cols-2`

### 5. `OfficialsManagement.tsx` — Formularios responsive
- Todos los `grid-cols-2` → `grid-cols-1 md:grid-cols-2`
- `grid-cols-3` → `grid-cols-2 md:grid-cols-3`

### 6. `Sanctions.tsx` — Formularios responsive
- Todos los `grid-cols-2` → `grid-cols-1 md:grid-cols-2`

### 7. `FightResults.tsx` — Formularios responsive
- `grid-cols-2` → `grid-cols-1 md:grid-cols-2`
- `grid-cols-3` → `grid-cols-1 md:grid-cols-3`

### 8. `LiveEventsControl.tsx` — Grids responsive
- `grid-cols-2` → `grid-cols-1 md:grid-cols-2` en fight cards
- `grid-cols-3` → `grid-cols-1 md:grid-cols-3` en scoring

### Archivos a modificar (8 archivos)
1. `src/components/AdminSidebar.tsx`
2. `src/pages/admin/LiveStreaming.tsx`
3. `src/pages/admin/RankingsManagement.tsx`
4. `src/pages/admin/Betting.tsx`
5. `src/pages/admin/OfficialsManagement.tsx`
6. `src/pages/admin/Sanctions.tsx`
7. `src/pages/admin/FightResults.tsx`
8. `src/pages/admin/LiveEventsControl.tsx`

