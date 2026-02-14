

# Sincronizacion de Gimnasios en Perfiles de Peleadores

## Problema Detectado

Despues de analizar la base de datos actual:

- **68 peleadores activos**
- Solo **4** tienen un `gym_id` vinculado formalmente a un gimnasio registrado
- **61** tienen `gym_name` como texto libre (sin vinculo real al gimnasio)
- **3** no tienen gimnasio asignado de ninguna forma

Esto significa que el 90% de los peleadores muestran un nombre de gimnasio escrito a mano, sin enlace al perfil del gimnasio, y las tarjetas de peleador (FighterCard) ni siquiera muestran el gimnasio.

## Solucion en 3 Partes

### Parte 1: Mostrar el gimnasio en todas las vistas

**FighterCard (tarjeta en listados)**
- Agregar una linea debajo del pais mostrando el nombre del gimnasio
- Si tiene `gym_id`, mostrar el nombre oficial del gimnasio (desde la tabla `gyms`)
- Si solo tiene `gym_name` (texto libre), mostrarlo con un icono diferente
- Si no tiene gimnasio, mostrar "Independiente" en gris

**FighterProfile (pagina de perfil)**
- Mover la seccion de gimnasio a una posicion mas prominente (justo debajo de la disciplina, antes del record)
- Mostrar el logo del gimnasio si esta disponible
- Si tiene `gym_id`, enlazar al dashboard del gimnasio

**Ranking (tabla de posiciones)**
- Agregar columna/badge con el nombre del gimnasio junto al nombre del peleador

### Parte 2: Enriquecer las queries con datos del gimnasio

**useFightersQuery** (listado general)
- Modificar el `select` para incluir la relacion con `gyms`: nombre y logo
- Esto permite mostrar el gym en las tarjetas sin queries adicionales

**useFighterByIdQuery** (perfil individual)
- Agregar join a `gyms` ademas del join existente a `coaches`
- Traer `nombre`, `logo_url`, `slug` del gimnasio vinculado

### Parte 3: Sincronizar gym_name con gym_id

Crear una migracion de base de datos que:

1. **Normalice los nombres de gimnasio existentes**: Para los 61 peleadores que tienen `gym_name` como texto libre pero no tienen `gym_id`, intentar hacer match con gimnasios registrados en la tabla `gyms` (por nombre similar)

2. **Trigger de sincronizacion**: Cuando se asigna un `gym_id` a un peleador (via membresía o admin), actualizar automaticamente el campo `gym_name` con el nombre oficial del gimnasio

3. **Trigger inverso**: Cuando se actualiza el nombre de un gimnasio en la tabla `gyms`, propagar el cambio a todos los `fighter_profiles` que tienen ese `gym_id`

---

## Seccion Tecnica

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/fighters/useFightersQuery.ts` | Agregar join a `gyms(nombre, logo_url, slug)` en el select |
| `src/hooks/fighters/useFighterByIdQuery.ts` | Agregar join a `gyms(nombre, logo_url, slug)` junto al de coaches |
| `src/components/FighterCard.tsx` | Mostrar nombre del gimnasio con icono de edificio |
| `src/pages/FighterProfile.tsx` | Mover seccion gimnasio arriba, mostrar logo si disponible |
| `src/components/sections/Ranking.tsx` | Mostrar gym_name junto al nombre del peleador en la tabla |
| `src/hooks/useFighterProfiles.tsx` | Actualizar `getFighterById` para incluir join a gyms |
| Migracion SQL | Trigger de sync gym_name y normalizacion de datos existentes |

### Query modificada (useFightersQuery)

```text
supabase
  .from('fighter_profiles')
  .select('*, gym:gyms!gym_id(nombre, logo_url, slug)', { count: 'exact' })
```

### Trigger de sincronizacion (SQL)

Se creara un trigger `sync_gym_name_on_membership` que:
- Al insertar/actualizar una membresia ACTIVE en `fighter_gym_memberships`, actualiza `fighter_profiles.gym_id` y `fighter_profiles.gym_name`
- Al actualizar `gyms.nombre`, propaga a todos los `fighter_profiles` con ese `gym_id`

### Normalizacion de datos existentes

Se ejecutara un UPDATE que haga match entre `gym_name` (texto libre) y `gyms.nombre` para vincular automaticamente los peleadores que ya tienen el nombre correcto pero no el ID. Los que no coincidan se dejaran como estan (texto libre) para revision manual.

### Visualizacion en FighterCard

```text
+----------------------------------+
|  [Avatar]  Nombre Apellido       |
|            "Nickname"            |
|            Peso Ligero | Honduras|
|            Gimnasio: Team X  [G] |  <-- NUEVO
+----------------------------------+
|  Record: 3-1-0  | Compite: MMA  |
+----------------------------------+
```

Los peleadores sin gimnasio mostraran "Independiente" con un badge gris, lo que facilita identificar rapidamente quienes necesitan ser asignados.

