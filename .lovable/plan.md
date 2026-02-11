

# Coherencia en Busqueda de Peleadores + Sincronizacion de Datos

## Problema Principal

La funcion `search_fighters_for_gym` devuelve TODOS los peleadores, incluyendo los que ya estan vinculados a otro gimnasio. Esto permite que un gimnasio vea peleadores que no estan disponibles, rompiendo la logica de negocio.

## Cambios

### 1. Modificar RPC: Excluir peleadores con gimnasio activo

Actualizar la funcion `search_fighters_for_gym` agregando un parametro `p_gym_id` (el gimnasio que esta buscando) y un filtro que excluya peleadores que ya tengan membresía activa en OTRO gimnasio.

Logica:
- Peleadores SIN gimnasio: aparecen (disponibles)
- Peleadores en ESTE gimnasio: aparecen con etiqueta "Ya vinculado" (boton deshabilitado, como ya funciona)
- Peleadores en OTRO gimnasio: NO aparecen en la lista

El filtro SQL adicional seria:

```text
AND (m.gym_id IS NULL OR m.gym_id = p_gym_id)
```

Esto elimina del resultado a cualquier peleador cuya membresía activa sea de un gimnasio diferente.

### 2. Actualizar el hook useFighterSearch

Agregar parametro `gymId` al hook para pasarlo como `p_gym_id` a la funcion RPC.

### 3. Actualizar GymAddFighter.tsx

Pasar `gymId` al hook `useFighterSearch` para que la consulta filtre correctamente.

### 4. Actualizar AssignFighterToGymModal.tsx

Pasar `gymId` al hook `useFighterSearch` para mantener la misma logica en el modal del panel admin.

### 5. Trigger de sincronizacion (del plan anterior)

Crear trigger `sync_fighter_gym_from_membership` para mantener `fighter_profiles.gym_id` y `gym_name` actualizados automaticamente cuando se crean o transfieren membresías.

### 6. Corregir useGymFighters y GymFighterCard (del plan anterior)

- Agregar `discipline` y `boxeo_record_*` al query de `useGymFighters`
- Mostrar record correcto segun disciplina en `GymFighterCard`
- Corregir labels de nivel para coincidir con los valores de la BD

### 7. FighterProfile: mostrar gimnasio real (del plan anterior)

Usar datos de `fighter_gym_memberships` en vez del campo de texto libre `gym_name`.

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Modificar RPC `search_fighters_for_gym` (agregar `p_gym_id` y filtro) + trigger de sincronizacion + migracion de datos |
| `src/hooks/gyms/useFighterSearch.ts` | Agregar parametro `gymId` |
| `src/pages/gym/GymAddFighter.tsx` | Pasar `gymId` al hook |
| `src/components/admin/AssignFighterToGymModal.tsx` | Pasar `gymId` al hook |
| `src/hooks/gyms/useGymFighters.ts` | Agregar `discipline` y `boxeo_record_*` |
| `src/components/gym/GymFighterCard.tsx` | Record por disciplina + labels corregidos |
| `src/pages/FighterProfile.tsx` | Mostrar gimnasio real desde memberships |

## Resultado esperado

Un administrador de gimnasio solo vera peleadores DISPONIBLES (sin gimnasio) o los que ya estan en su propio gimnasio. No vera peleadores de otros gimnasios, eliminando confusion y errores de asignacion.

