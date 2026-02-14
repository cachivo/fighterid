

# Auditoria: Sincronizacion Peleadores - Gimnasios

## Hallazgos Criticos

### Problema Principal: 61 de 65 peleadores con gimnasio NO tienen membresia formal

| Metrica | Valor |
|---------|-------|
| Peleadores activos totales | 68 |
| Con `gym_id` asignado | 65 |
| Con membresia activa (`fighter_gym_memberships`) | **4** |
| **Desincronizados** (gym_id pero sin membresia) | **61** |
| Gimnasios activos | 27 |

Los 27 gimnasios estan afectados. Los mas criticos:

| Gimnasio | Peleadores sin membresia |
|----------|--------------------------|
| Lunaticos | 14 |
| Dragones Templarios | 6 |
| Alfa y Omega MMA | 4 |
| Club de Boxeo Chele Munguia | 3 |
| Pericka MMA Brotherhood | 3 |
| Martial Gang | 3 |
| (21 gimnasios mas) | 1-2 cada uno |

### Causa Raiz

Existen dos triggers de sincronizacion, pero ambos son **unidireccionales**:

1. `sync_fighter_gym_from_membership`: Cuando se crea una membresia ACTIVE, actualiza `gym_id` en el perfil del peleador. **Funciona correctamente.**

2. `sync_gym_name_from_gym_id`: Cuando se cambia `gym_id` en el perfil, solo actualiza `gym_name`. **NO crea la membresia correspondiente.**

Es decir: si un admin asigna un gimnasio directamente en el perfil del peleador (que es lo mas comun), el peleador aparece con gimnasio en su perfil pero **no aparece en el dashboard del gimnasio** porque no tiene registro en `fighter_gym_memberships`.

### Datos Positivos

- No hay inconsistencias inversas: los 4 peleadores con membresia activa tienen su `gym_id` correctamente sincronizado
- No hay peleadores con `gym_name` suelto sin `gym_id` (la normalizacion previa funciono)
- El indice unique para evitar doble membresia activa ya existe

---

## Plan de Correccion

### Paso 1: Backfill - Crear las 61 membresias faltantes

Ejecutar un INSERT masivo que cree registros en `fighter_gym_memberships` para todos los peleadores que tienen `gym_id` pero no tienen membresia activa. Esto poblara inmediatamente los dashboards de los 27 gimnasios.

```text
INSERT INTO fighter_gym_memberships (fighter_id, gym_id, status, joined_at)
SELECT fp.id, fp.gym_id, 'ACTIVE', COALESCE(fp.updated_at, fp.created_at)
FROM fighter_profiles fp
WHERE fp.gym_id IS NOT NULL AND fp.active = true
AND NOT EXISTS (
  SELECT 1 FROM fighter_gym_memberships fgm
  WHERE fgm.fighter_id = fp.id AND fgm.status = 'ACTIVE'
);
```

### Paso 2: Trigger de sincronizacion bidireccional

Crear un nuevo trigger en `fighter_profiles` que, cuando se asigne o cambie `gym_id`, automaticamente:

- Si se asigna un nuevo `gym_id`: cree una membresia ACTIVE (si no existe ya)
- Si se cambia de un gimnasio a otro: marque la anterior como TRANSFERRED y cree la nueva
- Si se limpia `gym_id` (NULL): marque la membresia actual como INACTIVE

Esto garantiza que sin importar COMO se asigne el gimnasio (admin form, RPC, import), la membresia siempre se crea.

### Paso 3: Verificacion post-correccion

Despues de aplicar ambos cambios, verificar que:
- Los 65 peleadores con gym_id tengan membresia activa
- Los dashboards de gimnasios muestren el conteo correcto
- El trigger funcione al asignar un gimnasio nuevo desde el panel admin

---

## Seccion Tecnica

### Migracion SQL

Se creara una sola migracion que:

1. Define la funcion `sync_membership_from_gym_id()` como trigger BEFORE UPDATE en `fighter_profiles`
2. Ejecuta el backfill de las 61 membresias

La funcion del trigger:

```text
sync_membership_from_gym_id()
  -- Solo si gym_id cambio
  IF OLD.gym_id IS DISTINCT FROM NEW.gym_id THEN
    -- Si habia gym anterior, marcar membresia como TRANSFERRED
    IF OLD.gym_id IS NOT NULL THEN
      UPDATE fighter_gym_memberships
      SET status = 'TRANSFERRED', left_at = NOW()
      WHERE fighter_id = NEW.id AND gym_id = OLD.gym_id AND status = 'ACTIVE';
    END IF;
    
    -- Si hay nuevo gym, crear membresia si no existe
    IF NEW.gym_id IS NOT NULL THEN
      INSERT INTO fighter_gym_memberships (fighter_id, gym_id, status)
      VALUES (NEW.id, NEW.gym_id, 'ACTIVE')
      ON CONFLICT DO NOTHING;  -- respeta unique_active_membership
    END IF;
  END IF;
```

### Archivos que NO necesitan cambios

Los hooks existentes (`useGymFighters`, `useGymDashboard`, `useGymMembership`) ya consultan `fighter_gym_memberships` correctamente. Una vez que las membresias existan, los dashboards se poblaran automaticamente sin cambios de codigo.

### Riesgo

Bajo. El backfill solo inserta registros faltantes (ON CONFLICT DO NOTHING). El trigger solo actua cuando `gym_id` realmente cambia. Los triggers existentes no entran en conflicto porque `sync_fighter_gym_from_membership` actua en la tabla de membresias (no en profiles).

