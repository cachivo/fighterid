
# Sincronizacion Completa: Gimnasios, Rankings y Campos de Edicion

## Diagnostico

Despues de analizar la base de datos y el codigo actual, estos son los problemas reales encontrados:

### Problema 1: Formularios admin usan texto libre para gimnasio
Los formularios `AdminFighterForm.tsx` y `FighterEditModal.tsx` tienen un campo `<Input>` de texto libre para el gimnasio. Esto significa que cada admin escribe el nombre diferente:
- "Dragones Templarios", "Dragones templarios", " dragones templarios" (3 variaciones, 6 peleadores)
- "Alfa & Omega MMA", "Alfa y omega", "Alfa y Omega MMA", "ALFA Y OMEGA MMA" (4 variaciones)
- "Lunaticos Team", "Lunático Team", "Lunaticos Team " (con espacio extra)

**Solucion**: Reemplazar el `<Input>` de texto por un `<Select>` con los gimnasios registrados en la tabla `gyms`, mas una opcion "Otro" para texto libre. Al seleccionar un gimnasio registrado, se asigna automaticamente el `gym_id`.

### Problema 2: Solo 3 gimnasios registrados de ~20 que existen
Hay al menos 20 gimnasios unicos en los datos pero solo 3 estan registrados en la tabla `gyms`. Los otros 17 solo existen como texto libre.

**Solucion**: Registrar los gimnasios faltantes en la tabla `gyms` y vincular los 45 peleadores pendientes.

### Problema 3: La tab "Gimnasio" del modal admin esta separada del formulario principal
El componente `FighterGymTab` (que ya tiene la UI para vincular/transferir gimnasios) existe pero opera independiente del formulario de edicion principal. No se refleja en el campo `gym_name` del formulario.

**Solucion**: Integrar ambos flujos - cuando el admin edita un peleador, el selector de gimnasio en el formulario principal debe sincronizar con `FighterGymTab`.

## Plan de Implementacion

### Paso 1: Registrar gimnasios faltantes (datos)

Crear los ~17 gimnasios que existen como texto libre pero no estan en la tabla `gyms`:

| Gimnasio | Peleadores |
|----------|-----------|
| Dragones Templarios | 6 |
| Alfa y Omega MMA | 4 |
| Martial Gang | 3 |
| Pericka MMA Brotherhood | 3 |
| Ortiz Hawaiian Kenpo MMA | 2 |
| Las Palmas Boxing Club | 2 |
| Espiritu de Guerrero | 2 |
| Club Titan MMA | 2 |
| Lunaticos Team (ya existe pero sin vincular) | 3 |
| Y otros con 1 peleador cada uno | ~18 |

Luego vincular automaticamente los `gym_id` de los 45 peleadores pendientes.

### Paso 2: Selector de gimnasio en formularios admin

Modificar `AdminFighterForm.tsx` y `FighterEditModal.tsx`:
- Reemplazar el `<Input>` de texto libre por un `<Select>` con dropdown de gimnasios registrados
- Agregar opcion "Independiente" y "Otro (texto libre)"
- Al seleccionar un gimnasio del dropdown, asignar `gym_id` automaticamente
- Mostrar el logo del gimnasio seleccionado como preview

### Paso 3: Verificar sincronizacion ranking-perfil

Validar que los triggers existentes funcionan correctamente:
- Cuando se cambia `discipline` en el perfil, se actualiza en rankings
- Cuando se cambia `level` en rankings, se refleja en el perfil
- Cuando se cambia `gym_id`, se actualiza `gym_name`

---

## Seccion Tecnica

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminFighterForm.tsx` | Reemplazar Input de gym_name por Select con gimnasios + asignacion de gym_id |
| `src/components/admin/FighterEditModal.tsx` | Mismo cambio: Select de gimnasios en lugar de texto libre |
| `src/hooks/useFighterProfiles.tsx` | Agregar `gym_id` a `AdminFighterFormData` |
| Migracion SQL (datos) | INSERT de gimnasios faltantes + UPDATE de gym_id en fighter_profiles |

### Cambio en AdminFighterForm

```text
ANTES:
<Label>Gimnasio/Academia</Label>
<Input value={formData.gym_name} onChange={...} placeholder="Ej: Gracie Barra" />

DESPUES:
<Label>Gimnasio/Academia</Label>
<Select value={selectedGymId} onValueChange={handleGymSelect}>
  <SelectItem value="none">Independiente</SelectItem>
  {gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
  <SelectItem value="other">Otro (escribir nombre)</SelectItem>
</Select>
{selectedGymId === 'other' && <Input value={formData.gym_name} ... />}
```

### Flujo de datos al guardar

```text
Si gym seleccionado del dropdown:
  → formData.gym_id = gym.id
  → formData.gym_name = gym.nombre (auto-rellenado)
  → Trigger DB sincroniza gym_name automaticamente

Si "Otro" seleccionado:
  → formData.gym_id = null
  → formData.gym_name = texto ingresado

Si "Independiente":
  → formData.gym_id = null
  → formData.gym_name = null
```

### Normalizacion de datos

Se usara un UPDATE con `LOWER(TRIM())` para hacer match fuzzy entre los nombres de texto libre y los gimnasios recien registrados, cubriendo variaciones de mayusculas, espacios y acentos.
