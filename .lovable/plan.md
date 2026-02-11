

# Modulo de Gestion de Gimnasios y Entrenadores v1.0

## Analisis del Estado Actual vs. Requerimientos

### Lo que ya existe
- Tablas `gyms`, `gym_staff`, `fighter_gym_memberships` con constraint `unique_active_membership`
- `AssignFighterToGymModal` basico (solo busqueda por nombre, sin filtros)
- `GymDashboard`, `GymFighters`, `GymStaffManagement` pages
- Hooks: `useGymMembership`, `useAddMembership`, `useTransferFighter`, `useGymStaff`
- Roles en `gym_staff` table: `OWNER`, `HEAD_COACH`, `ASSISTANT_COACH`
- Admin panel en `/admin/gimnasios`

### Lo que falta (gap analysis)
1. **Roles en `user_roles`**: No existen `gym_admin`, `head_coach`, `assistant_coach` como roles del sistema
2. **Buscador con filtros**: El modal actual solo filtra por nombre, sin disciplina/nivel/peso
3. **Menu "Mi Gimnasio"**: No existe deteccion automatica de staff para mostrar acceso al dashboard
4. **Busqueda server-side**: Actualmente carga TODOS los fighters client-side (no escalable)
5. **Mobile UX**: Dashboard funcional pero sin optimizaciones tactiles ni safe-area

---

## FASE 1 - Buscador Mejorado + Filtros (Prioridad Inmediata)

### 1.1 Mejorar `AssignFighterToGymModal` con filtros avanzados

**Archivo**: `src/components/admin/AssignFighterToGymModal.tsx`

Agregar 3 filtros dropdown debajo del campo de busqueda:
- **Disciplina**: MMA, Boxeo (desde `ENABLED_DISCIPLINES`)
- **Nivel**: Amateur, Semi-profesional, Profesional (desde `FIGHTER_LEVELS`)
- **Peso**: Todas las categorias (desde `WEIGHT_CLASSES`)

Layout: `grid grid-cols-3 gap-2` para los filtros.
Cada fighter en la lista mostrara badges de disciplina, nivel y record.

Estados nuevos: `filterDiscipline`, `filterLevel`, `filterWeight` (default `'__none__'`).

Logica de filtrado:
```text
fighters
  .filter(discipline === filter OR filter === '__none__')
  .filter(level === filter OR filter === '__none__')
  .filter(weight_class === filter OR filter === '__none__')
  .filter(name/nickname includes search text)
  .slice(0, 30)
```

Resetear todos los filtros en `handleClose`.

### 1.2 Agregar badge de record en la lista de resultados

Cada fighter card en el modal mostrara:
- Avatar + nombre + apodo
- Badge disciplina (MMA/Boxeo)
- Badge nivel (Amateur/Semi-Pro/Pro)
- Badge peso
- Record (W-L-D)

---

## FASE 2 - Roles del Sistema + Acceso Condicional

### 2.1 Nuevos roles en `user_roles`

**Migracion SQL**: Agregar valores al enum `app_role`:

```text
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gym_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_coach';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant_coach';
```

Estos roles se asignaran manualmente desde `/admin/user-roles` por la cuenta Master.

### 2.2 Menu "Mi Gimnasio" condicional en Header

**Archivo**: `src/components/Header.tsx`

Agregar logica para detectar si el usuario logueado tiene membership activa en `gym_staff`:

```text
SI usuario tiene registro activo en gym_staff
  -> Mostrar item "Mi Gimnasio" en menu movil
  -> Link a /gym/{gym_id}/dashboard
```

Nuevo hook: `useMyGymStaff()` que consulta `gym_staff` filtrado por `auth.uid()` y `active = true`.

### 2.3 Matriz de permisos en el dashboard

El dashboard `/gym/:gymId/dashboard` verificara:
- `gym_admin` y `head_coach`: pueden agregar/remover peleadores
- `assistant_coach`: solo lectura del dashboard
- Nadie puede editar record oficial ni ranking

---

## FASE 3 - Busqueda Server-Side (Performance)

### 3.1 RPC `search_fighters_for_gym`

**Migracion SQL**: Crear funcion RPC optimizada:

```text
create or replace function search_fighters_for_gym(
  p_search text default null,
  p_discipline text default null,
  p_level text default null,
  p_weight_class text default null,
  p_limit int default 15,
  p_offset int default 0
)
returns table (
  id uuid,
  first_name text,
  last_name text,
  nickname text,
  avatar_url text,
  discipline text,
  level text,
  weight_class text,
  mma_record_wins int,
  mma_record_losses int,
  mma_record_draws int,
  active_gym_id uuid,
  active_gym_name text
)
```

Esta funcion:
- Filtra por disciplina, nivel, peso y texto (ilike en nombre/apodo)
- Hace LEFT JOIN a `fighter_gym_memberships` para traer gimnasio activo
- Siempre paginada (max 15 resultados)
- Usa indices existentes

### 3.2 Hook `useFighterSearch`

**Nuevo archivo**: `src/hooks/gyms/useFighterSearch.ts`

```text
useQuery({
  queryKey: ['fighter-search', { search, discipline, level, weight, page }],
  queryFn: () => supabase.rpc('search_fighters_for_gym', params),
  keepPreviousData: true,
  enabled: open, // solo cuando el modal esta abierto
})
```

### 3.3 Migrar `AssignFighterToGymModal` al nuevo hook

Reemplazar `useAdminFighters()` (que carga todo) por `useFighterSearch` con debounce de 300ms en el campo de texto.

---

## FASE 4 - Mobile Optimization del Dashboard

### 4.1 `GymDashboard.tsx`
- Agregar `pb-20` para safe-area inferior
- Boton "Agregar Peleador" prominente si el usuario tiene permisos

### 4.2 `GymDashboardHeader.tsx`
- Avatar responsive: `h-16 w-16 sm:h-20 sm:w-20`
- `text-balance` en nombre del gimnasio
- Badge de owner con `max-w-full truncate`

### 4.3 `GymStatsCards.tsx`
- `snap-x snap-mandatory` para scroll tactil
- Reducir `min-w-[120px]` a `min-w-[100px]`

### 4.4 `GymFighterCard.tsx`
- `active:scale-[0.98]` para feedback tactil
- Mostrar disciplina y estado de licencia

### 4.5 Pantalla "Agregar Peleador" mobile-first

**Nuevo archivo**: `src/pages/gym/GymAddFighter.tsx`

Ruta: `/gym/:gymId/add-fighter`

Estructura:
- Input de busqueda grande (44px altura)
- Chips horizontales scrolleables para filtros activos
- Cards verticales de resultados (no tabla)
- Boton "Agregar" grande en cada card
- Validaciones antes de agregar (membership activa, licencia)

---

## FASE 5 - Validaciones de Integridad

### 5.1 Verificaciones pre-asignacion

Antes de agregar un peleador al gimnasio:
1. Verificar que no tenga membership activa (o ofrecer transferencia)
2. Verificar que no este suspendido (`active = true`)
3. Verificar licencia activa (consulta a `fighter_licenses`)

Si falla alguna -> modal claro con el motivo.

### 5.2 Invalidacion de cache realtime

Al agregar/transferir peleador:
- Invalidar `gym-fighters`, `gym-fighter-count`, `gym-dashboard`
- No recargar toda la pantalla, solo el peleador afectado

---

## Resumen de Archivos

| Archivo | Accion | Fase |
|---------|--------|------|
| `src/components/admin/AssignFighterToGymModal.tsx` | Agregar filtros disciplina/nivel/peso + badges | 1 |
| Migracion SQL (enum roles) | Agregar gym_admin, head_coach, assistant_coach | 2 |
| `src/hooks/gyms/useMyGymStaff.ts` | **Nuevo** - Detectar si usuario es staff | 2 |
| `src/components/Header.tsx` | Agregar item "Mi Gimnasio" condicional | 2 |
| Migracion SQL (RPC search) | Crear `search_fighters_for_gym` | 3 |
| `src/hooks/gyms/useFighterSearch.ts` | **Nuevo** - Hook de busqueda paginada | 3 |
| `src/pages/gym/GymDashboard.tsx` | Safe-area + boton agregar peleador | 4 |
| `src/components/gym/GymDashboardHeader.tsx` | Avatar responsive + text-balance | 4 |
| `src/components/gym/GymStatsCards.tsx` | Snap scroll + min-width reducido | 4 |
| `src/components/gym/GymFighterCard.tsx` | Feedback tactil + disciplina | 4 |
| `src/pages/gym/GymAddFighter.tsx` | **Nuevo** - Pantalla mobile agregar peleador | 4 |
| `src/App.tsx` | Agregar ruta `/gym/:gymId/add-fighter` | 4 |
| `src/hooks/gyms/index.ts` | Exportar nuevos hooks | 3-4 |

## Recomendacion de Implementacion

Sugiero implementar **Fase 1 primero** (filtros en el buscador existente) ya que es lo que desbloquea la clasificacion inmediata de peleadores desde `/admin/gimnasios`. Las fases 2-5 se pueden iterar despues una vez que la asignacion basica funcione correctamente.

