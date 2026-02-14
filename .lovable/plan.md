

# Mejoras al Sistema de Sincronizacion Bidireccional

## Estado Actual (Auditoria)

El sistema ya tiene sincronizacion bidireccional funcional y **0 inconsistencias**:

| Verificacion | Resultado |
|---|---|
| Perfiles con gym_id sin membresia ACTIVE | **0** |
| Membresias ACTIVE sin gym_id en perfil | **0** |
| Multiples membresias ACTIVE por peleador | **0** |

### Triggers existentes

**fighter_profiles:**
- `trg_sync_membership_from_gym_id` (BEFORE UPDATE) - Crea/transfiere membresias cuando cambia gym_id
- `trg_sync_gym_name_from_gym_id` (BEFORE UPDATE) - Sincroniza gym_name

**fighter_gym_memberships:**
- `trg_sync_fighter_gym` - Sincroniza gym_id de vuelta al perfil
- `trg_sync_fighter_gym_on_membership` - Duplicado funcional del anterior

### Lo que falta vs lo que propone el archivo subido

| Caracteristica | Estado actual | Accion |
|---|---|---|
| Sync UPDATE profiles -> memberships | Ya funciona | Mantener |
| Sync INSERT profiles -> memberships | **No existe** | Implementar |
| Sync memberships -> profiles | Ya funciona | Mantener |
| Validacion de duplicados ACTIVE | Indice unique existe | No necesario (trigger redundante) |
| Tabla de logs/auditoria | **No existe** | Implementar |
| Vistas utiles | **No existen** | Implementar (adaptadas) |
| Funciones de utilidad | **No existen** | Implementar |

## Adaptaciones Necesarias

El archivo SQL subido fue escrito para otro esquema. Las diferencias criticas:

| Archivo subido usa | Tu proyecto usa |
|---|---|
| `gimnasios` | `gyms` |
| `nombre`, `apellido`, `nombre_completo` | `first_name`, `last_name` |
| `codigo` (en gimnasios) | `slug` (en gyms) |

Todas las vistas y funciones se adaptaran a tu esquema real.

## Plan de Implementacion

### Paso 1: Mejorar trigger de profiles para manejar INSERT

Modificar `sync_membership_from_gym_id()` para que tambien actue en INSERT (cuando se crea un peleador con gym_id desde el inicio). Actualmente solo actua en UPDATE.

### Paso 2: Crear tabla de logs de auditoria

```text
fighter_gym_membership_logs
  - id (UUID PK)
  - fighter_id (FK -> fighter_profiles)
  - gym_id (FK -> gyms)
  - old_gym_id (FK -> gyms)
  - action (TEXT: JOINED, LEFT, TRANSFERRED, REJOINED)
  - status_before (TEXT)
  - status_after (TEXT)
  - changed_at (TIMESTAMPTZ)
  - changed_by (UUID)
  - notes (TEXT)
```

Con trigger automatico en `fighter_gym_memberships` que registra cada cambio.

### Paso 3: Crear vistas utiles (adaptadas)

- `v_fighters_current_gym` - Peleadores con su gimnasio actual, dias en el gym
- `v_fighter_gym_history` - Historial completo de membresias
- `v_gym_statistics` - Estadisticas por gimnasio (peleadores activos, total historico, promedio de dias)

### Paso 4: Crear funciones de utilidad

- `get_fighter_gym_history(p_fighter_id)` - Retorna historial con nombres de gimnasio y duracion
- `can_join_gym(p_fighter_id, p_gym_id)` - Verifica si un peleador puede unirse

### Paso 5: Limpiar trigger duplicado

Eliminar `trg_sync_fighter_gym_on_membership` que es un duplicado de `trg_sync_fighter_gym`. Tener dos triggers haciendo lo mismo puede causar actualizaciones dobles.

### Paso 6: Agregar RLS a tabla de logs

Solo admins pueden leer los logs de auditoria.

## Seccion Tecnica

### Migracion SQL unica

Se creara una sola migracion que:

1. Reemplaza `sync_membership_from_gym_id()` para soportar INSERT + UPDATE
2. Crea `fighter_gym_membership_logs` con RLS
3. Crea la funcion `log_membership_changes()` y su trigger
4. Crea las 3 vistas adaptadas a tu esquema (`gyms`, `first_name`/`last_name`)
5. Crea las 2 funciones de utilidad
6. Elimina el trigger duplicado `trg_sync_fighter_gym_on_membership`

### Lo que NO se implementa del archivo subido

- **Trigger de validacion de duplicados**: Redundante porque ya existe el indice `unique_active_membership` que previene esto a nivel de base de datos (mas eficiente que un trigger)
- **Backfill**: Ya se ejecuto anteriormente y la verificacion muestra 0 inconsistencias
- **ON CONFLICT (fighter_id, gym_id)**: El archivo subido asume un indice unique en (fighter_id, gym_id), pero tu indice es en (fighter_id) WHERE status='ACTIVE'. Se adapta el SQL para usar `ON CONFLICT DO NOTHING` que funciona con tu indice existente

### Archivos de codigo (sin cambios)

Los hooks existentes (`useGymFighters`, `useGymDashboard`, `useGymMembership`, `FighterGymTab`) ya funcionan correctamente. Las vistas y funciones nuevas quedan disponibles para uso futuro pero no requieren cambios inmediatos en el frontend.

