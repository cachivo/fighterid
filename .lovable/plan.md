

# Fase 4: Actualizar Admin de Gimnasios y Entrenadores

## Resumen

Actualizar las paginas de admin (`GimnasiosAdmin` y `EntrenadoresAdmin`) para usar el nuevo esquema relacional (`gym_staff`, `gym_disciplines`, `disciplines`) en lugar de la tabla legacy `coaches` y los arrays de strings `disciplinas`.

---

## Cambios Principales

### 1. AdminSidebar: Renombrar entrada "Entrenadores" a "Staff de Gimnasios"

Cambiar el item del sidebar de "Entrenadores" a "Staff de Gimnasios" para reflejar el nuevo modelo.

### 2. GimnasiosAdmin.tsx: Agregar selector de disciplinas y gestion de staff

**Cambios en el formulario de creacion:**
- Reemplazar el campo de texto libre "Disciplinas (separadas por coma)" por un selector multi-check usando la tabla `disciplines`
- Crear un hook `useAllDisciplines()` que trae las disciplinas activas de la tabla `disciplines`
- Al crear un gimnasio, insertar tambien las relaciones en `gym_disciplines`

**Cambios en el listado:**
- Mostrar el conteo de staff activo en cada card
- Agregar boton "Ver Dashboard" que enlaza a `/gym/{gymId}/dashboard`

### 3. AdminGymCard.tsx: Mostrar staff count y link al dashboard

- Agregar un badge con el numero de staff activos (query ligera a `gym_staff`)
- Agregar boton "Dashboard" que navega a `/gym/{gymId}/dashboard`

### 4. GymEditModal.tsx: Selector de disciplinas relacional

- Reemplazar el campo de texto `disciplinas` por checkboxes de la tabla `disciplines`
- Al guardar, sincronizar `gym_disciplines` (delete + insert de las seleccionadas)

### 5. EntrenadoresAdmin.tsx -> StaffGimnasiosAdmin.tsx

Transformar la pagina completamente:

**Antes:** Creaba un registro en la tabla `coaches` con nombre/apellido/avatar propio.

**Ahora:**
- Lista todo el staff de todos los gimnasios (query a `gym_staff` + `app_user` + `gyms`)
- Formulario de "Agregar Staff": seleccionar un gimnasio, buscar un usuario existente por email/handle, asignar rol (OWNER, HEAD_COACH, ASSISTANT_COACH)
- Acciones: cambiar rol, marcar como primary, desactivar

### 6. Nuevos hooks necesarios

**`useAllDisciplines()`** - en `src/hooks/gyms/useGymDisciplines.ts` (ya existe el archivo, agregar esta funcion):
- Trae todas las disciplinas activas de la tabla `disciplines`
- Para el selector en admin

**`useAllGymStaff()`** - en `src/hooks/gyms/useGymStaff.ts` (agregar):
- Query global de todo el staff de todos los gimnasios (para la vista admin)
- Join con `app_user` y `gyms`

### 7. Componentes a deprecar (sin eliminar)

- `AdminCoachCard.tsx` - ya no se usa desde `EntrenadoresAdmin` pero se mantiene por compatibilidad
- `CoachEditModal.tsx`, `DeleteCoachDialog.tsx` - idem

---

## Archivos a Modificar

| Archivo | Accion |
|---------|--------|
| `src/components/AdminSidebar.tsx` | Renombrar "Entrenadores" a "Staff de Gimnasios" |
| `src/hooks/gyms/useGymDisciplines.ts` | Agregar `useAllDisciplines()` |
| `src/hooks/gyms/useGymStaff.ts` | Agregar `useAllGymStaff()` |
| `src/hooks/gyms/index.ts` | Exportar nuevas funciones |
| `src/pages/admin/GimnasiosAdmin.tsx` | Selector de disciplinas relacional |
| `src/components/admin/AdminGymCard.tsx` | Staff count + link dashboard |
| `src/components/admin/GymEditModal.tsx` | Disciplinas con checkboxes |
| `src/pages/admin/EntrenadoresAdmin.tsx` | Reescribir como "Staff de Gimnasios" |

## Archivos Nuevos

Ninguno - todo se resuelve modificando los existentes.

---

## Detalles Tecnicos

### useAllDisciplines hook
```typescript
export function useAllDisciplines() {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### useAllGymStaff hook
```typescript
export function useAllGymStaff() {
  return useQuery({
    queryKey: ['all-gym-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_staff')
        .select('*, gyms(id, nombre, slug)')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // fetch user details in batch
      const userIds = data.map(s => s.user_id);
      const { data: users } = await supabase
        .from('app_user')
        .select('id, first_name, last_name, avatar_url, handle, email')
        .in('id', userIds);
      return data.map(s => ({
        ...s,
        user: users?.find(u => u.id === s.user_id),
      }));
    },
    staleTime: 60_000,
  });
}
```

### Gym creation with disciplines
Al crear un gimnasio, despues del insert en `gyms`, insertar las disciplinas seleccionadas en `gym_disciplines`:

```typescript
// After gym creation
if (selectedDisciplines.length > 0) {
  await supabase.from('gym_disciplines').insert(
    selectedDisciplines.map(id => ({ gym_id: newGym.id, discipline_id: id }))
  );
}
```

### Staff admin - Busqueda de usuarios
Para agregar staff, se busca un usuario existente en `app_user` por handle o email, luego se inserta en `gym_staff` con el rol seleccionado.

### Roles display
```text
OWNER         -> "Propietario" (badge dorado)
HEAD_COACH    -> "Entrenador Principal" (badge azul)  
ASSISTANT_COACH -> "Asistente" (badge gris)
```

