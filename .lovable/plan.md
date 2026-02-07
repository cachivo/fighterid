

# Plan de Corrección: Error de Tipo ENUM en `discipline`

## Diagnóstico Confirmado

### Error Exacto
```
CASE types discipline and text cannot be matched
```

**Causa**: La función `admin_update_fighter_profile` intenta asignar un valor `text` (`p_profile_data->>'discipline'`) a una columna de tipo `discipline` (ENUM).

### Análisis de Tipos de Columna

| Campo | Tipo en BD | Requiere Cast |
|-------|-----------|---------------|
| `discipline` | **USER-DEFINED (ENUM)** | **SÍ** → `::discipline` |
| `gender` | text | No |
| `level` | text | No |
| `stance` | text | No |
| `weight_class` | text | No |
| `record_type` | text | No |

### Valores Válidos del ENUM `discipline`
```
MMA, Boxeo, Judo, JiuJitsu, Kickboxing, MuayThai, Grappling, Otro
```

---

## Solución Propuesta

### Migración SQL: Corregir Cast de `discipline`

La única línea que necesita cambiar es agregar el cast explícito y manejar valores vacíos/nulos:

```sql
-- ANTES (causa el error):
discipline = CASE WHEN p_profile_data ? 'discipline' 
  THEN p_profile_data->>'discipline' ELSE discipline END,

-- DESPUÉS (correcto):
discipline = CASE 
  WHEN p_profile_data ? 'discipline' 
       AND p_profile_data->>'discipline' IS NOT NULL 
       AND p_profile_data->>'discipline' != '' 
  THEN (p_profile_data->>'discipline')::discipline 
  ELSE discipline 
END,
```

### Validación Adicional

También se debe verificar que el valor enviado sea uno de los ENUMs válidos. Si se envía un valor inválido (ej: "Boxing" en lugar de "Boxeo"), la base de datos rechazará la operación con un error claro.

---

## Implementación Técnica

### Archivo: Nueva Migración SQL

```sql
-- Drop y recrear la función con el cast correcto
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(...)
RETURNS jsonb
AS $$
BEGIN
  UPDATE fighter_profiles
  SET
    -- ... otros campos ...
    
    -- CORREGIDO: Cast explícito a ::discipline para tipo ENUM
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' 
           AND p_profile_data->>'discipline' IS NOT NULL 
           AND p_profile_data->>'discipline' != '' 
      THEN (p_profile_data->>'discipline')::discipline 
      ELSE discipline 
    END,
    
    -- ... resto de campos sin cambios ...
  WHERE id = p_fighter_id;
END;
$$;
```

---

## Verificación Post-Implementación

Una vez aplicada la migración, el guardado debería funcionar correctamente. Para validar:

1. Abrir el modal de edición de un peleador
2. Cambiar cualquier campo (ej: BoxRec URL)
3. Guardar cambios → Sin error
4. Verificar en la base de datos que el campo se guardó

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Corregir cast `::discipline` en la función RPC |

---

## Resumen

- **Problema**: `text` no es compatible con `discipline` (ENUM) en expresión CASE
- **Solución**: Agregar cast explícito `::discipline` con validación de null/vacío
- **Impacto**: Todos los campos se guardarán correctamente tras la corrección

