
# Auditoría y Reestructuración del Módulo de Gimnasios

## Problemas detectados

1. **Rol "Dueño" incorrecto**: El sistema usa "OWNER" / "Dueño" cuando debería ser "Main Coach" -- el coach principal es quien gestiona la escuela, no un "dueño".
2. **Dashboard no optimizado para móvil**: Las stats cards se desbordan, los botones de acción no están apilados correctamente para pantallas pequeñas.
3. **Permisos inconsistentes**: No hay distinción clara entre lo que puede hacer el Main Coach vs el Admin desde el panel de administración.
4. **Falta funcionalidad**: El Main Coach no puede editar el perfil del gimnasio desde su dashboard.

## Cambios

### 1. Renombrar "Dueño/OWNER" a "Main Coach" en toda la UI

Archivos afectados:
- `src/components/gym/GymDashboardHeader.tsx`: Cambiar `roleLabels` de "Dueño" a "Main Coach"
- `src/components/gym/GymStaffCard.tsx`: Misma corrección en `roleLabels`
- `src/components/admin/AssignGymOwnerModal.tsx`: Cambiar título de "Asignar Admin" a "Asignar Main Coach", actualizar textos
- `src/components/admin/AdminGymCard.tsx`: Actualizar tooltip del botón Crown
- `src/components/admin/roles/RoleEditDialog.tsx`: Cambiar label de "Dueño de Gym" a "Main Coach"
- `src/pages/gym/GymOnboarding.tsx`: Actualizar textos de confirmación

**Nota**: El valor en la base de datos (`OWNER` en gym_staff, `gym_owner` en user_roles) NO se cambia. Solo se modifica la etiqueta visual en la UI. Esto evita migraciones y mantiene compatibilidad.

### 2. Optimizar GymDashboard para móvil y gama baja

Archivo: `src/pages/gym/GymDashboard.tsx`

- Apilar botones de acción verticalmente (1 columna) en lugar de 3 en fila
- Agregar botón "Editar Gimnasio" visible solo para Main Coach (OWNER)
- Mejorar el padding y spacing para touch targets de 44px mínimo
- Los botones usan `w-full` en lugar de `flex-1` para evitar overflow

### 3. Agregar edición de perfil de gimnasio desde el dashboard del Main Coach

Archivo: `src/pages/gym/GymDashboard.tsx`

- Importar `GymEditModal` del admin
- Agregar botón "Editar Gimnasio" (con icono Pencil) visible solo cuando el rol es OWNER
- El modal reutiliza el componente existente `GymEditModal` que ya soporta edición completa (nombre, descripción, logo, banner, contacto, disciplinas)

### 4. Definir permisos claros por rol

```text
Acción                          | Main Coach (OWNER) | Head Coach | Assistant | Admin (panel)
--------------------------------|--------------------|-----------:|----------:|--------------
Ver dashboard del gym           |         Si         |     Si     |    Si     |      Si
Editar perfil del gimnasio      |         Si         |     No     |    No     |      Si
Agregar/remover peleadores      |         Si         |     Si     |    No     |      Si
Ver lista de peleadores         |         Si         |     Si     |    Si     |      Si
Editar record de pelea          |         No         |     No     |    No     |      Si
Gestionar staff                 |         Si         |     No     |    No     |      Si
Subir rendimientos de alumnos   |         Si         |     Si     |    No     |      Si
```

### 5. Ajustar permisos en el código

Archivo: `src/hooks/gyms/useMyGymStaff.ts`
- Agregar `canEditGymProfile` al return: `staffRecord.role === 'OWNER'`
- Agregar `canManageStaff` al return: `staffRecord.role === 'OWNER'`
- `canManageFighters` ya está correcto (OWNER o HEAD_COACH)

Archivo: `src/pages/gym/GymStaffManagement.tsx`
- Verificar que solo OWNER pueda remover staff (actualmente `canManage={true}` hardcodeado)
- Usar `useGymStaffRole` para determinar si el usuario puede gestionar

Archivo: `src/pages/gym/GymDashboard.tsx`
- Mostrar botón "Editar Gimnasio" solo si `canEditGymProfile`
- Mostrar botón "Staff" con ícono de settings solo si es OWNER; para otros mostrar solo vista

### 6. Corregir dimensiones del GymDashboardHeader para móvil

Archivo: `src/components/gym/GymDashboardHeader.tsx`
- Reducir banner height a `h-28` para dejar más espacio al contenido
- Avatar: mantener `h-16 w-16` sin variantes `sm:` (mobile-only)
- Nombre del gym: `text-lg` en lugar de `text-xl` para evitar overflow
- Badge del Main Coach: sin `max-w-full` que causa truncamiento

### 7. GymStatsCards: layout compacto

Archivo: `src/components/gym/GymStatsCards.tsx`
- Usar grid `grid-cols-4` fijo en lugar de scroll horizontal para 4 items (caben en 360px)
- Reducir padding interno a `p-2` y font sizes para gama baja
- Quitar scroll arrows innecesarios

## Detalle técnico

| Archivo | Acción |
|---------|--------|
| `src/components/gym/GymDashboardHeader.tsx` | Modificar: renombrar "Dueño" a "Main Coach", ajustar tamaños móvil |
| `src/components/gym/GymStaffCard.tsx` | Modificar: renombrar "Dueño" a "Main Coach" en roleLabels |
| `src/components/gym/GymStatsCards.tsx` | Modificar: grid-cols-4 fijo, padding compacto |
| `src/pages/gym/GymDashboard.tsx` | Modificar: botones apilados, agregar edición de gym, permisos granulares |
| `src/pages/gym/GymStaffManagement.tsx` | Modificar: verificar permisos reales antes de mostrar gestión |
| `src/hooks/gyms/useMyGymStaff.ts` | Modificar: agregar canEditGymProfile, canManageStaff al return |
| `src/components/admin/AssignGymOwnerModal.tsx` | Modificar: renombrar textos a "Main Coach" |
| `src/components/admin/AdminGymCard.tsx` | Modificar: actualizar tooltip |
| `src/components/admin/roles/RoleEditDialog.tsx` | Modificar: label "Main Coach" |
| `src/pages/gym/GymOnboarding.tsx` | Modificar: texto de confirmación |

No hay cambios en la base de datos. El valor `OWNER` en `gym_staff.role` y `gym_owner` en `user_roles` se mantienen intactos; solo cambian las etiquetas de la interfaz.
