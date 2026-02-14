
# Prevencion de Duplicados y Completitud de Gimnasios

## Estado Actual

- **27 gimnasios** registrados en la tabla `gyms`, **0 duplicados** actualmente
- El campo `slug` tiene restriccion UNIQUE, pero el campo `nombre` **NO** tiene ninguna restriccion
- El formulario de "Crear Gimnasio" no verifica si ya existe un gimnasio con nombre similar antes de insertar
- De los 27 gimnasios, **24 tienen informacion incompleta** (sin descripcion, logo, ciudad, o administrador asignado)

## Solucion

### Parte 1: Restriccion de unicidad en base de datos

Agregar un indice unico sobre el nombre normalizado (minusculas, sin espacios extra) para que la base de datos misma rechace duplicados, sin importar si el admin escribe "Alfa y Omega MMA" o "alfa y omega mma".

Esto se implementa con un indice funcional:
```text
CREATE UNIQUE INDEX gyms_nombre_normalized_unique 
ON gyms (LOWER(TRIM(nombre))) 
WHERE activo = true;
```

Solo aplica a gimnasios activos, asi que si uno fue "eliminado" (activo=false), el nombre queda libre para reutilizar.

### Parte 2: Validacion en el formulario de creacion

Antes de enviar el formulario, verificar en tiempo real si ya existe un gimnasio con nombre similar:

- Al escribir el nombre, hacer una busqueda con debounce (300ms)
- Si encuentra un match, mostrar un aviso: "Ya existe un gimnasio con este nombre: [Nombre]. Puedes editarlo desde su tarjeta."
- Bloquear el boton "Crear" si hay duplicado

Lo mismo aplica al formulario de edicion: si cambias el nombre de un gimnasio existente, verificar que no colisione con otro.

### Parte 3: Indicadores de completitud en las tarjetas

Agregar a cada `AdminGymCard` un indicador visual del estado de completitud:

- Barra de progreso o badge mostrando que porcentaje de campos importantes estan llenos
- Campos evaluados: nombre (siempre lleno), descripcion, ciudad, telefono/whatsapp, disciplinas, logo, administrador asignado
- Gimnasios incompletos muestran un badge amarillo "Completar info"
- Gimnasios completos muestran un badge verde

---

## Seccion Tecnica

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Indice UNIQUE sobre `LOWER(TRIM(nombre))` donde `activo = true` |
| `src/pages/admin/GimnasiosAdmin.tsx` | Agregar verificacion de duplicados antes de crear; mostrar alerta si ya existe |
| `src/components/admin/GymEditModal.tsx` | Agregar verificacion de duplicados al cambiar nombre |
| `src/components/admin/AdminGymCard.tsx` | Agregar badge/barra de completitud |
| `src/hooks/useGyms.tsx` | Agregar hook `useCheckGymDuplicate(nombre)` para busqueda en tiempo real |

### Hook de verificacion de duplicados

```text
useCheckGymDuplicate(nombre: string, excludeId?: string)
  - Hace query: SELECT id, nombre FROM gyms WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(input)) AND activo = true AND id != excludeId
  - Retorna: { isDuplicate: boolean, existingGym: { id, nombre } | null }
  - Se ejecuta con debounce de 300ms
  - enabled: nombre.length >= 3
```

### Calculo de completitud en AdminGymCard

```text
Campos evaluados (7 total):
  1. descripcion  - tiene texto?
  2. ciudad       - tiene texto?
  3. telefono OR whatsapp - al menos uno?
  4. disciplinas  - tiene al menos 1?
  5. logo_url     - tiene URL?
  6. owner_id     - tiene admin asignado?
  7. email        - tiene email?

Porcentaje = campos llenos / 7 * 100
Badge: < 50% rojo, 50-85% amarillo, >= 86% verde
```

### Flujo de creacion con validacion

```text
Admin escribe nombre
  → debounce 300ms
  → Query a gyms por nombre normalizado
  → Si existe:
      Mostrar: "⚠️ Ya existe: [Nombre Oficial] - [Ciudad]"
      Boton "Crear" deshabilitado
  → Si no existe:
      Boton "Crear" habilitado
      Al enviar: INSERT con slug auto-generado
      Si falla por constraint UNIQUE: mostrar error amigable
```
