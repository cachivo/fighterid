
# Herramientas de Asignacion de Peleadores a Gimnasios desde Admin

## Contexto

Actualmente el sistema tiene las tablas `fighter_gym_memberships` y `gym_staff` listas, pero **no existe UI en el panel de admin** para vincular peleadores a gimnasios. El usuario necesita poder clasificar y organizar a todos los peleadores existentes asignandolos a sus respectivos gimnasios.

## Quien puede editar los dashboards de gimnasios

- **Admins** (rol `admin` en `user_roles`): acceso total a todo, incluyendo dashboards de cualquier gimnasio
- **Staff del gimnasio** (registrados en `gym_staff`): solo pueden ver/editar el dashboard de SU gimnasio
- **Usuarios normales**: solo acceso de lectura a datos publicos del gimnasio

Las politicas RLS ya implementadas garantizan esto: lectura publica para todos, escritura solo para staff activo del gimnasio.

---

## Cambios a Implementar

### 1. Nuevo tab "Gimnasio" en el modal de detalle del peleador (`FighterDetailModal`)

Agregar un 8vo tab llamado "Gimnasio" entre "Deportivo" y "Ligas" que muestre:
- **Membresia activa**: nombre del gimnasio, fecha de ingreso, entrenador asignado
- **Historial**: membresias anteriores (TRANSFERRED, INACTIVE)
- **Acciones**: boton "Vincular a Gimnasio" o "Transferir" si ya tiene uno

### 2. Nuevo componente `FighterGymTab` (`src/components/admin/FighterGymTab.tsx`)

Componente dedicado que contiene:
- Vista de membresia actual (si existe) con opcion de desvincular
- Selector de gimnasio (dropdown con todos los gimnasios activos)
- Selector opcional de entrenador (staff del gimnasio seleccionado con rol HEAD_COACH o ASSISTANT_COACH)
- Boton "Vincular" que usa `useAddMembership`
- Boton "Transferir" que usa `useTransferFighter` (si ya tiene gimnasio)
- Historial de membresias anteriores

### 3. Accion rapida en la lista de peleadores (`FightersProfiles`)

Agregar un boton de icono (Building/Dumbbell) en cada card de peleador para asignar gimnasio rapidamente sin abrir el modal completo. Esto abre un mini-dialog con:
- Selector de gimnasio
- Boton confirmar

### 4. Filtro por gimnasio en la lista de peleadores

Agregar un dropdown "Gimnasio" en los filtros existentes de `FightersProfiles` para poder ver:
- "Sin gimnasio" (peleadores no asignados)
- Gimnasio especifico

Esto requiere un join ligero a `fighter_gym_memberships` al cargar los peleadores.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/FighterDetailModal.tsx` | Agregar tab "Gimnasio" (8 tabs total) |
| `src/components/admin/FighterGymTab.tsx` | **Nuevo** - Componente del tab de gimnasio |
| `src/pages/admin/FightersProfiles.tsx` | Agregar boton rapido de asignacion + filtro por gimnasio |
| `src/hooks/gyms/index.ts` | Verificar exports necesarios |

## Detalles Tecnicos

### FighterGymTab - Logica principal

```typescript
// Usa hooks existentes
import { useGymMembership, useAddMembership, useTransferFighter } from '@/hooks/gyms';
import { useGyms } from '@/hooks/useGyms';
import { useGymStaff } from '@/hooks/gyms';

// 1. Consulta membresia activa del peleador
const { data: membership } = useGymMembership(fighterId);

// 2. Lista de gimnasios para el selector
const { data: gyms } = useGyms();

// 3. Si selecciona gimnasio, carga staff para asignar coach
const { data: staff } = useGymStaff(selectedGymId);

// 4. Mutations
const addMembership = useAddMembership();
const transferFighter = useTransferFighter();
```

### Filtro "Sin Gimnasio" en FightersProfiles

Se consultara `fighter_gym_memberships` con una query ligera para obtener los `fighter_id` con membresia activa, y se filtrara client-side contra la lista de peleadores existente. No requiere cambio en el hook `useAdminFighters`.

### Tab layout actualizado

```text
Personal | Deportivo | Gimnasio | Ligas | Licencias | Documentos | Estado | Cambios
```

El grid del TabsList pasara de `grid-cols-7` a `grid-cols-8`.
