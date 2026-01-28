
# Plan: Implementar Edición y Eliminación de Gimnasios y Entrenadores

## Resumen
Agregar funcionalidad completa de CRUD (Editar y Eliminar) para gimnasios y entrenadores en el panel de administración. La base de datos y permisos ya están configurados.

---

## Cambios Requeridos

### 1. Hooks - Agregar funciones faltantes

**Archivo: `src/hooks/useGyms.tsx`**
- ✅ Ya existe `useUpdateGym` 
- ➕ Agregar `useDeleteGym` (soft-delete: `activo = false`)

**Archivo: `src/hooks/useCoaches.tsx`**
- ➕ Agregar `useUpdateCoach` 
- ➕ Agregar `useDeleteCoach` (soft-delete: `activo = false`)

---

### 2. Componentes de Admin - Modales de Edición

**Crear: `src/components/admin/GymEditModal.tsx`**
- Modal con formulario pre-poblado con datos del gimnasio
- Campos: nombre, descripción, ciudad, país, disciplinas, teléfono, WhatsApp, logo, banner
- Botón guardar que usa `useUpdateGym`

**Crear: `src/components/admin/CoachEditModal.tsx`**
- Modal con formulario pre-poblado con datos del entrenador
- Campos: nombre, apellidos, bio, gimnasio, especialidades, ciudad, país, teléfono, WhatsApp, avatar
- Botón guardar que usa `useUpdateCoach`

---

### 3. Componentes de Admin - Diálogos de Eliminación

**Crear: `src/components/admin/DeleteGymDialog.tsx`**
- Alert dialog de confirmación
- Mensaje de advertencia sobre desactivación
- Soft-delete (marca `activo = false`)

**Crear: `src/components/admin/DeleteCoachDialog.tsx`**
- Alert dialog de confirmación
- Soft-delete (marca `activo = false`)

---

### 4. Tarjetas de Admin con Acciones

**Crear: `src/components/admin/AdminGymCard.tsx`**
- Extiende `GymCard` existente
- Agrega botones de Editar y Eliminar (solo visibles para admin)
- Integra `GymEditModal` y `DeleteGymDialog`

**Crear: `src/components/admin/AdminCoachCard.tsx`**
- Extiende `CoachCard` existente
- Agrega botones de Editar y Eliminar
- Integra `CoachEditModal` y `DeleteCoachDialog`

---

### 5. Actualizar Páginas de Admin

**Archivo: `src/pages/admin/GimnasiosAdmin.tsx`**
- Reemplazar `GymCard` por `AdminGymCard`
- Agregar funcionalidad de refresh después de editar/eliminar

**Archivo: `src/pages/admin/EntrenadoresAdmin.tsx`**
- Reemplazar `CoachCard` por `AdminCoachCard`
- Agregar funcionalidad de refresh después de editar/eliminar

---

## Flujo de Usuario Final

```text
┌─────────────────────────────────────────────────────────┐
│           Admin Panel → Gimnasios / Escuelas            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │   Gym Card      │  │   Gym Card      │  [+ Crear]    │
│  │                 │  │                 │               │
│  │  [✏️ Editar]    │  │  [✏️ Editar]    │               │
│  │  [🗑️ Eliminar]  │  │  [🗑️ Eliminar]  │               │
│  └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────┘

         Click "Editar"            Click "Eliminar"
              ↓                          ↓
    ┌─────────────────┐       ┌─────────────────────────┐
    │  Modal Edición  │       │  ¿Estás seguro?         │
    │                 │       │                         │
    │  Nombre: [....]│       │  Esta acción desactivará│
    │  Ciudad: [....]│       │  el gimnasio.           │
    │  ...           │       │                         │
    │                 │       │  [Cancelar] [Eliminar]  │
    │  [Guardar]      │       └─────────────────────────┘
    └─────────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/useGyms.tsx` | Modificar - agregar `useDeleteGym` |
| `src/hooks/useCoaches.tsx` | Modificar - agregar `useUpdateCoach`, `useDeleteCoach` |
| `src/components/admin/GymEditModal.tsx` | Crear |
| `src/components/admin/CoachEditModal.tsx` | Crear |
| `src/components/admin/DeleteGymDialog.tsx` | Crear |
| `src/components/admin/DeleteCoachDialog.tsx` | Crear |
| `src/components/admin/AdminGymCard.tsx` | Crear |
| `src/components/admin/AdminCoachCard.tsx` | Crear |
| `src/pages/admin/GimnasiosAdmin.tsx` | Modificar |
| `src/pages/admin/EntrenadoresAdmin.tsx` | Modificar |

---

## Detalles Técnicos

### Soft Delete (Eliminación Suave)
En lugar de eliminar permanentemente, se marca `activo = false`. Esto:
- Preserva datos históricos
- Permite recuperación futura
- Es la mejor práctica para datos de negocio

### RLS (Seguridad)
Las políticas ya existen y permiten:
- **Admins**: Pueden editar/eliminar cualquier gimnasio o entrenador
- **Owners**: Solo pueden editar/eliminar sus propios registros

### Invalidación de Cache
Después de cada operación CRUD, se invalida `queryKey: ['gyms']` o `queryKey: ['coaches']` para refrescar automáticamente la lista.
