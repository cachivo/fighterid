

# Reestructuracion del Sistema de Gimnasios - Nivel Produccion

## Estado Actual

- **3 gimnasios** activos, **0 entrenadores**, **0 peleadores vinculados** a gimnasios
- Tablas actuales: `gyms` (columnas en espanol), `coaches` (tabla independiente, NO vinculada a `app_user`)
- `fighter_profiles` tiene `gym_id`, `coach_id`, `gym_name` (columnas directas, sin historial)
- UI: listado basico + detalle con entrenadores como sub-lista

Dado que no hay datos de coaches ni vinculaciones fighter-gym, podemos hacer la migracion limpia sin riesgo de perder datos.

---

## Fase 1: Migracion SQL (Esquema Nuevo)

### 1.1 Tabla `disciplines` (nueva)
Reemplaza los arrays de strings (`disciplinas` en gyms, `especialidades` en coaches) por una tabla relacional escalable.

### 1.2 Tabla `gym_staff` (reemplaza `coaches`)
- Vincula `app_user.id` como staff del gimnasio (OWNER, HEAD_COACH, ASSISTANT_COACH)
- Elimina la necesidad de una tabla `coaches` separada con su propio nombre/avatar (usa datos de `app_user` o `fighter_profiles`)
- Un usuario puede ser staff Y peleador simultaneamente

### 1.3 Tabla `fighter_gym_memberships` (reemplaza `fighter_profiles.gym_id`)
- Historial de membresias (ACTIVE, INACTIVE, TRANSFERRED, SUSPENDED)
- Constraint unico: solo 1 membresia activa por peleador
- Referencia opcional a `coach_user_id` (el entrenador asignado)

### 1.4 Tabla `gym_disciplines` (relacion N:N)
Vincula gimnasios con disciplinas disponibles.

### 1.5 Vista materializada `gym_stats_summary`
- Cuenta fighters activos, total victorias/derrotas/empates
- Refresh automatico via trigger en `fighter_gym_memberships`

### 1.6 Indices y RLS
- Indices en slugs, memberships, staff
- RLS: datos publicos para lectura, staff activo para escritura
- Funcion `is_gym_staff()` tipo SECURITY DEFINER para evitar recursion

### 1.7 Columnas legacy
- Las columnas `gym_id`, `coach_id`, `gym_name` en `fighter_profiles` se mantienen temporalmente pero se marcan como deprecated
- La tabla `coaches` se mantiene pero se deja de usar (soft deprecation)

```text
Esquema de relaciones:

app_user
  |
  +-- gym_staff (role: OWNER/HEAD_COACH/ASSISTANT_COACH)
  |     |
  |     +-- gyms
  |           |
  |           +-- gym_disciplines --> disciplines
  |           |
  |           +-- fighter_gym_memberships
  |                 |
  |                 +-- fighter_profiles
  |                 +-- coach_user_id --> app_user
```

---

## Fase 2: Hooks de Dominio (React Query)

### 2.1 `src/hooks/gyms/useGymDashboard.ts`
- Fetch gym + stats + staff + top fighters en una sola query
- `queryKey: ['gym-dashboard', gymId]`
- `staleTime: 60_000`

### 2.2 `src/hooks/gyms/useGymFighters.ts`
- Lista de fighters del gimnasio via `fighter_gym_memberships`
- Paginacion server-side (limit 15)
- Filtros por disciplina y nivel

### 2.3 `src/hooks/gyms/useGymStaff.ts`
- CRUD de staff del gimnasio
- Mutations con invalidacion automatica

### 2.4 `src/hooks/gyms/useGymMembership.ts`
- Vincular/desvincular fighter de un gimnasio
- Transferir fighter entre gimnasios (marca anterior como TRANSFERRED)

### 2.5 Refactorizar `useGyms.tsx` existente
- Mantener como wrapper compatible pero delegando a los nuevos hooks
- Marcar como deprecated

---

## Fase 3: UI Mobile-First

### 3.1 Rutas nuevas
```text
/gimnasios                    -- Listado publico (ya existe, se mejora)
/gimnasios/:slug              -- Detalle publico (ya existe, se mejora)
/gym/dashboard                -- Dashboard privado del staff
/gym/fighters                 -- Peleadores del gimnasio
/gym/staff                    -- Gestion de staff
```

### 3.2 Componentes nuevos
```text
src/components/gym/
  GymDashboardHeader.tsx      -- Shield + nombre + stats horizontales
  GymStatsCards.tsx            -- Cards con scroll horizontal (fighters activos, wins, rank)
  GymFighterCard.tsx           -- Card mobile con avatar, record, nivel, entrenador
  GymStaffCard.tsx             -- Card de staff con rol y acciones
  GymMembershipActions.tsx     -- Vincular/desvincular fighter
```

### 3.3 Pantallas
```text
src/pages/gym/
  GymDashboard.tsx             -- Vista principal del staff
  GymFighters.tsx              -- Lista de peleadores con filtros
  GymStaffManagement.tsx       -- Gestion de roles del gimnasio
```

### 3.4 Principios de diseno mobile
- Cards verticales, nunca tablas
- Botones min 44px de alto con `touch-manipulation`
- Stats en scroll horizontal
- Skeleton loading en cada seccion
- Breakpoint `xs: 380px` para gama baja

---

## Fase 4: Admin - Actualizacion

### 4.1 `GimnasiosAdmin.tsx`
- Formulario de creacion actualizado con selector de disciplinas (de la tabla `disciplines`)
- Gestion de staff desde el detalle del gimnasio

### 4.2 `EntrenadoresAdmin.tsx`
- Se transforma en "Staff de Gimnasios"
- En lugar de crear un "coach" independiente, se asigna un `app_user` existente como staff

---

## Orden de Ejecucion

| Paso | Descripcion | Riesgo |
|------|------------|--------|
| 1 | Migracion SQL: tablas nuevas, indices, RLS | Bajo (no modifica tablas existentes) |
| 2 | Seed de disciplinas (MMA, Boxeo, Muay Thai, BJJ, etc.) | Ninguno |
| 3 | Hooks de dominio en `src/hooks/gyms/` | Bajo (archivos nuevos) |
| 4 | Dashboard mobile del gimnasio | Bajo (rutas nuevas) |
| 5 | Actualizar paginas publicas existentes | Medio (reemplaza queries) |
| 6 | Actualizar admin | Medio (cambia flujo de entrenadores) |
| 7 | Deprecar columnas legacy (`gym_id`, `coach_id` en fighter_profiles) | Fase futura |

---

## Detalles Tecnicos

### SQL Migration (resumen)
```sql
-- Tabla disciplines
CREATE TABLE disciplines (id, name, slug, is_active, created_at)

-- Tabla gym_disciplines (N:N)
CREATE TABLE gym_disciplines (gym_id, discipline_id)

-- Tipo enum gym_staff_role
CREATE TYPE gym_staff_role AS ENUM ('OWNER','HEAD_COACH','ASSISTANT_COACH')

-- Tabla gym_staff
CREATE TABLE gym_staff (id, gym_id, user_id, role, is_primary, active, created_at)
  UNIQUE(gym_id, user_id)

-- Tipo enum membership_status
CREATE TYPE membership_status AS ENUM ('ACTIVE','INACTIVE','TRANSFERRED','SUSPENDED')

-- Tabla fighter_gym_memberships
CREATE TABLE fighter_gym_memberships (id, fighter_id, gym_id, coach_user_id, status, joined_at, left_at)
  UNIQUE INDEX on (fighter_id) WHERE status = 'ACTIVE'

-- Vista materializada gym_stats_summary
-- Indices en slugs, memberships, staff
-- RLS con funcion is_gym_staff() SECURITY DEFINER
```

### Hook Pattern
```typescript
// useGymFighters.ts
export function useGymFighters(gymId: string, filters?: { page?: number }) {
  return useQuery({
    queryKey: ['gym-fighters', gymId, filters],
    queryFn: async () => {
      const { data, count } = await supabase
        .from('fighter_gym_memberships')
        .select('*, fighter:fighter_profiles(*)', { count: 'exact' })
        .eq('gym_id', gymId)
        .eq('status', 'ACTIVE')
        .range(from, to);
      return { fighters: data, totalCount: count };
    },
    staleTime: 30_000,
  });
}
```

### Consideraciones de Seguridad
- `is_gym_staff(user_id, gym_id)` como SECURITY DEFINER para RLS sin recursion
- Solo staff con rol OWNER puede agregar/remover otros staff
- Datos publicos (nombre, logo, disciplinas) visibles para todos
- Datos internos (fighters, stats) visibles solo para staff autenticado y admins

