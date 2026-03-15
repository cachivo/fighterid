

# Separación de Gimnasios por Disciplina (MMA vs Boxeo)

## Problema
Actualmente, un gym_owner/admin ve todos los gimnasios sin distinción de disciplina. Se necesita que un usuario con acceso a MMA no vea ni gestione gimnasios de Boxeo y viceversa.

## Diseño

### 1. Nueva tabla `user_discipline_access`
Registra qué disciplinas puede gestionar cada usuario. Se asigna desde el módulo de gestión de roles.

```text
user_discipline_access
├── id (uuid PK)
├── user_id (uuid FK → auth.users)
├── discipline (text: 'MMA' | 'Boxeo')
├── created_at (timestamptz)
└── UNIQUE(user_id, discipline)
```

RLS: solo admins/super_admins pueden escribir; el usuario puede leer sus propios registros.

### 2. Hook `useUserDisciplineAccess`
Nuevo hook que retorna las disciplinas asignadas al usuario autenticado. Se usa para filtrar datos en:
- **Admin**: `GimnasiosAdmin.tsx` — filtra la lista de gimnasios por disciplina del usuario
- **Admin**: `EntrenadoresAdmin.tsx` — filtra staff por gimnasios de su disciplina
- **Gym Dashboard**: `useMyGymStaff` — solo muestra gimnasios de disciplinas autorizadas
- **Gym Add Fighter**: filtra peleadores por disciplina autorizada

### 3. UI de asignación en RoleEditDialog
Cuando se asigna un rol `gym_owner`, `gym_coach` o `gym_assistant`, aparecen checkboxes adicionales para seleccionar disciplinas: **MMA**, **Boxeo**, o ambas. Al guardar, se insertan/eliminan filas en `user_discipline_access`.

### 4. Filtrado en consultas existentes
- `useGyms()` y `GimnasiosAdmin`: agregar filtro WHERE disciplinas contiene alguna de las disciplinas autorizadas del usuario
- `useMyGymStaff()`: filtrar resultado por disciplina del gimnasio
- Los super_admin/admin sin restricción ven todo (bypass)

### Archivos a modificar
- **Nuevo**: `src/hooks/useUserDisciplineAccess.ts`
- **Migración SQL**: crear tabla `user_discipline_access` con RLS
- `src/components/admin/roles/RoleEditDialog.tsx` — agregar selector de disciplinas
- `src/pages/admin/GimnasiosAdmin.tsx` — filtrar por disciplina autorizada
- `src/pages/admin/EntrenadoresAdmin.tsx` — filtrar por disciplina
- `src/hooks/gyms/useMyGymStaff.ts` — filtrar por disciplina del gym

### Lo que NO cambia
- Estructura de `user_roles` (los roles se mantienen igual)
- Rutas y layout del admin panel
- Gym dashboard individual (ya está scoped por gymId)
- Flujo de invitación de gimnasios

