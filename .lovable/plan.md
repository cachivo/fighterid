

# Separación de Administración por Disciplina + FEDEHBOX

## Resumen

Crear paneles administrativos separados para MMA (`/admin/mma/*`) y Boxeo (`/admin/boxeo/*`) con sidebars independientes, y reemplazar BDG_PRO por FEDEHBOX-Olímpico en la base de datos.

## Cambios

### 1. Migration SQL — Reemplazar BDG_PRO por FEDEHBOX

- `UPDATE ranking_organizations SET code = 'FEDEHBOX', name = 'Federación de Boxeo de Honduras', short_name = 'FEDEHBOX', allowed_levels = ARRAY['Olímpico', 'Profesional', 'Semi-profesional'], description = '...' WHERE code = 'BDG_PRO'`
- Actualizar `HHF_AMATEUR` description si es necesario
- Actualizar triggers que referencian `BDG_PRO` → `FEDEHBOX` (trigger `auto_enroll_fighter_ranking`, función `handle_boxing_level_migration`)
- Agregar `'Olímpico'` como nivel válido donde corresponda

### 2. Routing — Paneles separados

Estructura nueva:
```text
/admin           → Dashboard general (selector de disciplina)
/admin/mma/*     → Panel MMA (sidebar MMA)
/admin/boxeo/*   → Panel Boxeo (sidebar Boxeo)
/admin/system/*  → SuperAdmin (roles, config, assets) — compartido
```

Cambios en `App.tsx`:
- Mantener `/admin` como landing con cards de selección MMA / Boxeo
- Agregar rutas `/admin/mma/*` y `/admin/boxeo/*` que usan layouts con sidebars específicos
- Las rutas compartidas (email, comunidad, sistema) quedan en ambos o en `/admin/system/*`

### 3. Sidebar por Disciplina

Crear `AdminSidebarMMA.tsx` y `AdminSidebarBoxeo.tsx` (o parametrizar el actual):

**MMA** — items relevantes:
- Dashboard MMA, Eventos, Peleadores MMA, Rankings MMA, Gimnasios MMA, Control de Peleas, Vision/IA

**Boxeo** — items relevantes:
- Dashboard Boxeo, Eventos, Peleadores Boxeo, Rankings Boxeo (HHF/FEDEHBOX), Gimnasios Boxeo

**Compartidos** (en ambos sidebars o sección "Sistema"):
- Licencias, Email, Comunidad, Aliados, Roles, Config

### 4. Layout por Disciplina

Crear `AdminDisciplineLayout.tsx` que recibe `discipline` como prop y renderiza el sidebar correspondiente. Usar `useUserDisciplineAccess` para validar acceso.

### 5. Dashboard Admin General

Modificar `/admin` (Dashboard) para mostrar dos cards grandes: "MMA" y "Boxeo", que navegan a `/admin/mma` y `/admin/boxeo`. Solo mostrar las disciplinas a las que el usuario tiene acceso.

### 6. Filtrado automático en páginas

Las páginas dentro de `/admin/mma/*` y `/admin/boxeo/*` recibirán la disciplina del contexto (via URL param o context) y filtrarán automáticamente los datos. Ejemplo: Peleadores en `/admin/mma/fighters` solo muestra `discipline = 'MMA'`.

### 7. Actualización de triggers

Funciones SQL que referencian `BDG_PRO`:
- `auto_enroll_fighter_ranking` → cambiar a `FEDEHBOX`
- `handle_boxing_level_migration` → cambiar a `FEDEHBOX`
- Cualquier referencia hardcoded a `BDG_PRO`

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Nueva migration SQL | Renombrar BDG_PRO→FEDEHBOX, actualizar triggers |
| `src/App.tsx` | Nuevas rutas `/admin/mma/*`, `/admin/boxeo/*` |
| `src/components/AdminSidebar.tsx` | Parametrizar por disciplina |
| `src/components/AdminLayout.tsx` | Crear variante con disciplina |
| `src/pages/admin/Dashboard.tsx` | Selector de disciplina con cards |
| Nuevo: `src/components/AdminDisciplineLayout.tsx` | Layout wrapper con contexto de disciplina |
| Nuevo: `src/contexts/DisciplineContext.tsx` | React context para propagar disciplina activa |
| `src/pages/admin/FightersProfiles.tsx` | Filtrar por disciplina del contexto |
| `src/pages/admin/RankingsManagement.tsx` | Pre-seleccionar disciplina del contexto |
| `src/pages/admin/GimnasiosAdmin.tsx` | Filtrar por disciplina |
| `src/pages/admin/EventosPelea.tsx` | Filtrar por disciplina |

## Orden de implementación

1. Migration SQL (FEDEHBOX + triggers)
2. DisciplineContext + AdminDisciplineLayout
3. Routing en App.tsx
4. Sidebar parametrizado
5. Dashboard con selector
6. Filtrado en páginas admin

