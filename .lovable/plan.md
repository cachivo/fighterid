
# Auditoría y Estructura de Gimnasios: Asignación de Main Coach y Flujo de Administración

## Estado Actual

De 27 gimnasios activos, solo 3 tienen un Main Coach (OWNER) asignado en `gym_staff`:

| Gimnasio | Main Coach | Email |
|----------|-----------|-------|
| Club de Boxeo Chele Munguia | Jorge Luis Munguía Ortiz | chelemunguia123@gmail.com |
| Honduras Hood Fights | cachivo (Super Admin) | cachivo@gmail.com |
| Lunaticos | Show time | lunatime@hotmail.com |

Los otros **24 gimnasios no tienen Main Coach asignado**, lo que significa que nadie puede acceder a su dashboard para editarlos.

El campo `owner_id` en la tabla `gyms` esta en `null` para los 27 gimnasios -- la relacion de propiedad se maneja solo via `gym_staff`.

---

## Plan de Implementacion

### Paso 1: Sincronizar `gyms.owner_id` con `gym_staff`

Actualmente `owner_id` en la tabla `gyms` no se usa. Hay que sincronizarlo con los 3 OWNERs existentes en `gym_staff` para que el indicador de completitud funcione correctamente.

**Migracion SQL:**
- UPDATE `gyms` SET `owner_id` = user_id del OWNER activo para los 3 gimnasios que ya tienen Main Coach
- Crear un trigger que sincronice automaticamente `gyms.owner_id` cuando se inserta/actualiza/elimina un registro OWNER en `gym_staff`

### Paso 2: Restringir creacion de gimnasios solo a Super Admin

El codigo actual ya restringe el boton "Crear Gimnasio" con `isSuperAdmin` en `GimnasiosAdmin.tsx`. Esta logica esta correcta. No se necesitan cambios.

### Paso 3: Flujo de acceso post-login para Main Coach

Cuando un Main Coach selecciona "Gimnasio" al iniciar sesion:
1. El sistema busca su `gym_staff` activo con `role = 'OWNER'`
2. Lo redirige a `/gym/:gymId/dashboard`
3. Desde ahi puede editar el perfil, gestionar roster y staff

Este flujo ya se implemento en la correccion anterior de `Auth.tsx` y `AuthCallback.tsx`. Se verificara que funcione correctamente.

### Paso 4: Indicador visual de gimnasios sin Main Coach

En `AdminGymCard.tsx`, agregar un indicador visual claro cuando un gimnasio no tiene Main Coach asignado, facilitando al super admin identificar cuales necesitan asignacion.

### Paso 5: Validar que el dashboard del gimnasio sea editable solo por su Main Coach

Verificar que `GymDashboard`, `GymEditModal` y las herramientas de staff esten protegidas correctamente:
- Solo el Main Coach (OWNER) puede editar perfil del gimnasio y gestionar staff
- Head Coach y Assistant Coach pueden ver el dashboard pero no editar el perfil
- Cualquier usuario con rol `gym_staff` activo puede ver el dashboard de su gimnasio

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Sincronizar `gyms.owner_id` con OWNERs existentes + trigger automatico |
| `src/components/admin/AdminGymCard.tsx` | Agregar indicador cuando no hay Main Coach |
| `src/components/admin/AssignGymOwnerModal.tsx` | Actualizar tambien `gyms.owner_id` al asignar |

## Archivos a Verificar (sin cambios esperados)

| Archivo | Verificacion |
|---------|-------------|
| `src/pages/gym/GymDashboard.tsx` | Permisos de edicion por rol |
| `src/pages/Auth.tsx` | Redireccion al seleccionar modulo Gimnasio |
| `src/hooks/gyms/useMyGymStaff.ts` | Permisos correctos segun rol |

---

## Detalle Tecnico

### Migracion SQL

```sql
-- 1. Sincronizar owner_id actual
UPDATE gyms g SET owner_id = gs.user_id
FROM gym_staff gs
WHERE gs.gym_id = g.id AND gs.role = 'OWNER' AND gs.active = true;

-- 2. Trigger para mantener sincronizado
CREATE OR REPLACE FUNCTION sync_gym_owner_from_staff()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'OWNER' AND NEW.active = true THEN
    UPDATE gyms SET owner_id = NEW.user_id WHERE id = NEW.gym_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role = 'OWNER' AND NEW.active = true THEN
      UPDATE gyms SET owner_id = NEW.user_id WHERE id = NEW.gym_id;
    ELSIF OLD.role = 'OWNER' AND (NEW.active = false OR NEW.role != 'OWNER') THEN
      UPDATE gyms SET owner_id = NULL WHERE id = NEW.gym_id AND owner_id = OLD.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'OWNER' THEN
    UPDATE gyms SET owner_id = NULL WHERE id = OLD.gym_id AND owner_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### AdminGymCard - Indicador sin Main Coach

Se mostrara un badge de advertencia cuando `staffCount` no incluya un OWNER, con un boton rapido para asignar uno.

### AssignGymOwnerModal - Sincronizacion

Al asignar un nuevo OWNER en `gym_staff`, el trigger se encargara de actualizar `gyms.owner_id` automaticamente, pero tambien se actualizara `AssignGymOwnerModal` para que haga el update directo como respaldo.
