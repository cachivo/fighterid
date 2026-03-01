
# Correccion: Creacion de Perfiles - Campos y Base de Datos

## Problemas Encontrados

### 1. RPC `admin_create_fighter_profile` -- Campos faltantes en INSERT
La funcion SQL de creacion **no incluye** los siguientes campos que el formulario envia:
- **`gym_id`** -- el formulario permite seleccionar un gimnasio registrado, pero el RPC nunca lo inserta
- **`mma_record_wins/losses/draws`** -- los records por disciplina MMA se ignoran
- **`boxeo_record_wins/losses/draws`** -- los records por disciplina Boxeo se ignoran

Resultado: el peleador se crea sin gimnasio asociado y sin records por disciplina, aunque el admin los haya llenado.

### 2. RPC `admin_update_fighter_profile` -- Falta `gym_id`
La funcion de actualizacion maneja los records por disciplina correctamente, pero **no actualiza `gym_id`**. Si un admin asigna un gimnasio registrado, el campo se pierde en la base de datos.

### 3. Formulario -- Campos de base de datos que existen pero no estan en el formulario
La tabla `fighter_profiles` tiene columnas que el formulario no expone:
- `blood_type` (tipo de sangre)
- `document_type` / `document_number` (documento de identidad)
- `emergency_contact_name` / `emergency_contact_relation` / `emergency_contact_phone`
- `medical_allergies` / `medical_conditions`
- `insurance_company` / `insurance_policy`

Estos campos estan en el `AdminFighterFormData` type pero no tienen inputs en el formulario. Para el proceso de creacion basica no son obligatorios, pero seria bueno agregarlos en una seccion "Medico/Emergencia" del tab Personal.

## Solucion

### Paso 1: Migrar RPC `admin_create_fighter_profile`
Agregar al INSERT de la funcion SQL:
- `gym_id` con valor `NULLIF((p_profile_data->>'gym_id')::uuid, NULL)`
- `mma_record_wins` con `COALESCE((p_profile_data->>'mma_record_wins')::integer, 0)`
- `mma_record_losses`, `mma_record_draws` (igual patron)
- `boxeo_record_wins`, `boxeo_record_losses`, `boxeo_record_draws` (igual patron)

### Paso 2: Migrar RPC `admin_update_fighter_profile`
Agregar al UPDATE:
- `gym_id = CASE WHEN p_profile_data ? 'gym_id' AND p_profile_data->>'gym_id' IS NOT NULL THEN (p_profile_data->>'gym_id')::uuid WHEN p_profile_data ? 'gym_id' THEN NULL ELSE gym_id END`

### Paso 3: Agregar campos medicos al formulario
En `AdminFighterForm.tsx`, tab "Personal", agregar una seccion "Informacion Medica y Emergencia" con:
- Tipo de sangre (Select con opciones A+, A-, B+, B-, AB+, AB-, O+, O-)
- Tipo de documento + Numero de documento (dos inputs en grid)
- Contacto de emergencia: nombre, relacion, telefono (tres inputs)
- Alergias y condiciones medicas (textareas)
- Seguro: compania y poliza (dos inputs)

Tambien inicializar estos campos en el estado `formData` con valores vacios.

## Archivos a Modificar

| Recurso | Cambio |
|---------|--------|
| Migracion SQL | Reemplazar RPCs `admin_create_fighter_profile` y `admin_update_fighter_profile` |
| `src/components/admin/AdminFighterForm.tsx` | Agregar seccion medica/emergencia, inicializar campos |

## Detalle Tecnico de la Migracion SQL

```text
-- admin_create_fighter_profile: agregar al INSERT columns + VALUES
gym_id,
mma_record_wins, mma_record_losses, mma_record_draws,
boxeo_record_wins, boxeo_record_losses, boxeo_record_draws

-- admin_update_fighter_profile: agregar linea
gym_id = CASE WHEN p_profile_data ? 'gym_id' ...
```

**1 migracion SQL + 1 archivo TypeScript modificado.**
