

# Cola de aprobación admin — Gimnasios, Peleadores y Eventos

## Contexto

Actualmente las tres entidades se publican inmediatamente al crearse:
- **Gimnasios**: `gyms` no tiene campo de estado de aprobación.
- **Peleadores**: `fighter_profiles` se crea directo sin moderación (vía `FighterProfileForm`, `AdminFighterForm`, onboarding de licencia).
- **Eventos**: `bdg_event` se publica vía `EventImporter` y panel admin sin revisión.

Ya existe `PendingChangesHub` para *cambios* a perfiles existentes (vía `useProfileChangeRequests`), pero NO hay flujo de aprobación para *creaciones nuevas*.

## Diseño

### 1. Migración SQL — Estado de moderación unificado

Agregar columna `moderation_status` a las tres tablas con enum compartido:

```sql
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE gyms ADD COLUMN moderation_status moderation_status DEFAULT 'approved';
ALTER TABLE fighter_profiles ADD COLUMN moderation_status moderation_status DEFAULT 'approved';
ALTER TABLE bdg_event ADD COLUMN moderation_status moderation_status DEFAULT 'approved';

-- Auditoría
ALTER TABLE gyms ADD COLUMN moderation_reviewed_by uuid, ADD COLUMN moderation_reviewed_at timestamptz, ADD COLUMN moderation_notes text;
-- (mismas columnas para fighter_profiles y bdg_event)
```

**Default `approved`** para no romper datos existentes. Las nuevas inserciones desde formularios públicos/usuarios serán marcadas `pending` explícitamente.

### 2. Lógica de marcado al crear

Quién crea → estado:
- Admin/SuperAdmin crea → `approved` (omitir cola)
- Usuario regular / coach / formulario de invitación → `pending`

Aplicar en:
- `useCreateGym` → si no es admin, `pending`
- `useFighterMutations` (`useUserUpdateFighter` para auto-creación), `FighterProfileForm` submit, edge function `send-fighter-invitation` (cuando el invitado completa registro)
- `EventImporter` y creación manual de eventos → `pending` salvo admin

### 3. Filtros en lecturas públicas

Las queries que alimentan la web pública deben filtrar `moderation_status = 'approved'`:
- `useGyms`, `useGymsList`, `useGymsWithFighters` (público)
- `useFightersQuery`, `useFighterByIdQuery` (cuando no es contexto admin)
- `useEvents` (público)

Hooks admin (`useAdminFighters`, `GimnasiosAdmin` con `isSuperAdmin`) muestran todo.

### 4. RLS

Actualizar políticas SELECT públicas para requerir `moderation_status = 'approved' OR has_role(auth.uid(), 'admin')`.

### 5. Nueva página: `/admin/cola-aprobacion`

Archivo: `src/pages/admin/ApprovalQueue.tsx`

Estructura: tabs `Gimnasios | Peleadores | Eventos`, cada uno con badge contador.

Por cada item pendiente, una `Card` con:
- Datos clave (nombre, ciudad, disciplina, creador, fecha)
- Botón "Ver detalles" → modal con todos los campos
- Botones "Aprobar" / "Rechazar"
- Campo opcional de notas para rechazo

Acciones mutan `moderation_status`, `moderation_reviewed_by = auth.uid()`, `moderation_reviewed_at = now()`, `moderation_notes`.

### 6. Hook nuevo: `useApprovalQueue`

`src/hooks/useApprovalQueue.tsx` con queries:
- `usePendingGyms()`, `usePendingFighters()`, `usePendingEvents()`
- Mutaciones `approveItem(table, id, notes?)`, `rejectItem(table, id, notes)`
- Realtime subscription para refresco automático

### 7. Navegación admin

- Añadir entrada "Cola de Aprobación" en `AdminSidebar` con badge del total pendiente.
- Añadir card resumen en `AdminDashboard` con conteos por tipo.
- Ruta nueva en `App.tsx`: `/admin/cola-aprobacion` protegida con `AdminProtectedRoute`.

### 8. Notificaciones (mínimas)

- Al rechazar peleador/gimnasio creado vía invitación → email al creador con notas (reutilizar `send-fighter-invitation` patrón con plantilla nueva `notify-submission-rejected`).
- Al aprobar → toast en panel + opcional email de bienvenida.

Fase 1 incluye solo el toast; el email queda como mejora opcional.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear enum `moderation_status`, agregar columnas a `gyms`, `fighter_profiles`, `bdg_event`, actualizar RLS |
| `src/hooks/useApprovalQueue.tsx` | **Nuevo**: queries y mutaciones de la cola |
| `src/pages/admin/ApprovalQueue.tsx` | **Nuevo**: página con tabs y tarjetas de revisión |
| `src/hooks/useGyms.tsx` | Marcar `pending` si no admin; filtrar `approved` en lectura pública |
| `src/hooks/fighters/useFighterMutations.ts` | Marcar `pending` en creación de usuario |
| `src/hooks/fighters/useFightersQuery.ts` | Filtrar `approved` por defecto |
| `src/hooks/useEvents.tsx` | Marcar `pending` en creación no-admin; filtrar `approved` |
| `src/components/EventImporter.tsx` | Set `moderation_status: 'pending'` |
| `src/components/AdminSidebar.tsx` | Nueva entrada con badge contador |
| `src/pages/admin/Dashboard.tsx` | Card con totales pendientes |
| `src/App.tsx` | Ruta `/admin/cola-aprobacion` |

## Lo que NO cambia

- `useProfileChangeRequests` y `PendingChangesHub` siguen para *cambios* a perfiles existentes (uso distinto).
- Datos existentes: todos quedan `approved` por defecto.
- Los formularios desde admin omiten la cola (creación directa).

## Riesgos / consideraciones

- Las RLS necesitan revisión cuidadosa para no romper accesos de dueños viendo sus propias entidades pendientes.
- `bdg_event` tiene mucho código que asume visibilidad inmediata (HUD, transmisiones); validar que eventos `pending` no aparezcan en HUD público pero sí en panel admin.

