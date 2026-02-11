

# Fase 2: Roles del Sistema, Menu "Mi Gimnasio" y Correccion de Datos Stale

## Principio Clave: Una Sola Fuente de Verdad

**No se duplicaran roles.** La tabla `gym_staff` con su enum `gym_staff_role` (OWNER, HEAD_COACH, ASSISTANT_COACH) ya es la fuente de verdad para permisos de gimnasio. NO se agregaran valores al enum `app_role` - eso seria redundancia. El acceso al gimnasio se determina exclusivamente consultando `gym_staff`.

---

## Problema 1: Datos No Se Actualizan Tras Vincular Peleador

### Causa Raiz

Despues de vincular un peleador, `useAddMembership` invalida `gym-fighters` y `gym-dashboard`, pero:
- NO invalida `gym-fighter-count` (badge en AdminGymCard queda desactualizado)
- El `AssignFighterToGymModal` no fuerza refetch del dashboard si el usuario esta viendolo simultaneamente
- `staleTime` de 60 segundos en `useGymDashboard` previene que los datos se refresquen

### Solucion

**Archivo: `src/hooks/gyms/useGymMembership.ts`**

Agregar invalidacion de `gym-fighter-count` en `onSuccess` de ambas mutaciones (`useAddMembership` y `useTransferFighter`):

```text
onSuccess: (_, vars) => {
  queryClient.invalidateQueries({ queryKey: ['gym-membership', vars.fighterId] });
  queryClient.invalidateQueries({ queryKey: ['gym-fighters', vars.gymId] });
  queryClient.invalidateQueries({ queryKey: ['gym-fighter-count', vars.gymId] });
  queryClient.invalidateQueries({ queryKey: ['gym-dashboard', vars.gymId] });
}
```

Para `useTransferFighter`, invalidar tambien el gimnasio de origen:

```text
queryClient.invalidateQueries({ queryKey: ['gym-fighter-count', vars.fromGymId] });
queryClient.invalidateQueries({ queryKey: ['gym-fighters', vars.fromGymId] });
queryClient.invalidateQueries({ queryKey: ['gym-dashboard', vars.fromGymId] });
```

---

## Problema 2: Menu "Mi Gimnasio" para Staff

### Nuevo Hook: `useMyGymStaff`

**Nuevo archivo: `src/hooks/gyms/useMyGymStaff.ts`**

Consulta `gym_staff` para el usuario autenticado actual. Usa `app_user.auth_user_id` para mapear `auth.uid()` al `app_user.id` que es la FK en `gym_staff`.

```text
Flujo:
1. Obtener auth.uid() del usuario logueado
2. Buscar app_user.id donde auth_user_id = auth.uid()
3. Buscar gym_staff donde user_id = app_user.id AND active = true
4. Retornar { gymId, gymName, role } o null
```

Cache: `staleTime: 5 * 60 * 1000` (5 min) - no cambia frecuentemente.

### Modificar Header: Agregar "Mi Gimnasio"

**Archivo: `src/components/Header.tsx`**

En la seccion de navegacion movil (Sheet), despues del bloque "Navegacion", agregar condicionalmente:

```text
SI useMyGymStaff() retorna un gimnasio activo:
  Mostrar seccion "Mi Gimnasio" con:
  - Icono Dumbbell
  - Nombre del gimnasio
  - Link a /gym/{gymId}/dashboard
```

Tambien en el dropdown de desktop (dentro del DropdownMenu de la cuenta).

---

## Problema 3: Permisos en el Dashboard

### Modificar GymDashboard para verificar permisos

**Archivo: `src/pages/gym/GymDashboard.tsx`**

Usar `useMyGymStaff()` o consultar `gym_staff` para el gymId actual:
- Si el usuario es OWNER o HEAD_COACH: mostrar boton "Agregar Peleador"
- Si es ASSISTANT_COACH: solo lectura (sin boton de agregar)
- Si no es staff: redirigir a pagina de acceso denegado

### Agregar ruta mobile para agregar peleador

**Nuevo archivo: `src/pages/gym/GymAddFighter.tsx`**

Ruta: `/gym/:gymId/add-fighter`

Pantalla mobile-first que reutiliza la logica de `AssignFighterToGymModal` pero en formato de pagina completa:
- Input de busqueda grande (h-12)
- Filtros como chips horizontales scrolleables
- Cards verticales de resultados
- Boton "Agregar" en cada card
- Validaciones pre-asignacion (membership activa, fighter activo)

**Archivo: `src/App.tsx`** - Agregar ruta nueva

---

## Fase 4: Optimizacion Mobile del Dashboard

### `GymDashboardHeader.tsx`
- Avatar: `h-16 w-16 sm:h-20 sm:w-20`
- Nombre: `text-balance`
- Badge owner: `max-w-full truncate`

### `GymStatsCards.tsx`
- Agregar `snap-x snap-mandatory` al scroll container
- Reducir `min-w-[120px]` a `min-w-[100px]`
- Agregar `snap-start` a cada card

### `GymFighterCard.tsx`
- Agregar `active:scale-[0.98]` para feedback tactil
- Mostrar badge de disciplina junto al nivel

### `GymDashboard.tsx`
- Agregar `pb-20` para safe-area movil
- Boton "Agregar Peleador" prominente (condicional por permisos)

---

## Resumen de Archivos

| Archivo | Accion |
|---------|--------|
| `src/hooks/gyms/useGymMembership.ts` | Corregir invalidaciones de cache faltantes |
| `src/hooks/gyms/useMyGymStaff.ts` | **Nuevo** - Detectar si usuario es staff de algun gimnasio |
| `src/hooks/gyms/index.ts` | Exportar `useMyGymStaff` |
| `src/components/Header.tsx` | Agregar item "Mi Gimnasio" condicional |
| `src/pages/gym/GymDashboard.tsx` | Permisos + safe-area + boton agregar |
| `src/pages/gym/GymAddFighter.tsx` | **Nuevo** - Pantalla mobile agregar peleador |
| `src/App.tsx` | Agregar ruta `/gym/:gymId/add-fighter` |
| `src/components/gym/GymDashboardHeader.tsx` | Avatar responsive + truncate |
| `src/components/gym/GymStatsCards.tsx` | Snap scroll mobile |
| `src/components/gym/GymFighterCard.tsx` | Feedback tactil + disciplina badge |

## Lo que NO se hace (evitar duplicacion)

- **NO** se agregan roles al enum `app_role` - `gym_staff` ya maneja esto
- **NO** se crea tabla nueva de permisos - `gym_staff.role` + `gym_staff.active` es suficiente
- **NO** se duplica informacion de peleador en `fighter_gym_memberships` - solo FKs
- **NO** se crea RPC nuevo para busqueda (Fase 3 futura) - por ahora filtro client-side optimizado

