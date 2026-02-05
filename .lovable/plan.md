
# Plan: Sincronización Robusta + Corrección Estética de Tarjetas

## Diagnóstico Confirmado

### Problema 1: Sincronización
**Causa raíz identificada:** El usuario editó el perfil de Erick Tzoc a las **04:36:56**, pero la migración del trigger se aplicó a las **04:39:46** - es decir, **3 minutos DESPUÉS** de la edición.

```text
LÍNEA DE TIEMPO:
04:36:56 → Usuario edita perfil de Erick Tzoc (nivel: Semi-profesional)
04:39:46 → Migración del trigger se aplica
          ↳ Trigger no existía cuando se hizo la edición

RESULTADO: El perfil se actualizó pero el ranking NO porque el trigger aún no existía.
```

**Solución:** Hacer la sincronización DIRECTAMENTE en la función RPC además del trigger, garantizando que SIEMPRE se sincronice.

### Problema 2: Estético (Tarjetas Descuadradas)
El código actual solo muestra el apodo si existe:

```tsx
// Líneas 232-238 de FightersProfiles.tsx
<div>
  <CardTitle>{fighter.first_name} {fighter.last_name}</CardTitle>
  {fighter.nickname && (
    <p>"{fighter.nickname}"</p>  // ← Solo aparece si hay apodo
  )}
</div>
```

**Resultado visual:**

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Juan Pérez      │  │ Carlos López    │  │ Ana García      │
│ "El Destructor" │  │                 │  │ "La Tigresa"    │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Récord: 5-2-0   │  │ Récord: 3-1-0   │  │ Récord: 8-0-0   │
│ Peso: Ligero    │  │ Peso: Pluma     │  │ Peso: Gallo     │
│ ...             │  │ ...             │  │ ...             │
└─────────────────┘  └─────────────────┘  └─────────────────┘
     ↑                    ↑ DESCUADRADO        ↑
   (OK)                 (Sin apodo)          (OK)
```

**Solución:** Fijar altura mínima del contenedor del nombre para mantener uniformidad.

---

## Implementación

### Parte 1: Sincronización Directa en Función RPC (Base de Datos)

Modificar `admin_update_fighter_profile` para sincronizar directamente:

```sql
-- AL FINAL de la función, ANTES del RETURN, agregar:

-- Sincronizar a fighter_rankings si level o weight_class cambiaron
IF p_profile_data ? 'level' OR p_profile_data ? 'weight_class' THEN
  UPDATE public.fighter_rankings
  SET 
    level = CASE 
      WHEN p_profile_data ? 'level' 
        AND p_profile_data->>'level' NOT IN ('', 'null')
      THEN p_profile_data->>'level'
      ELSE level
    END,
    weight_class = CASE 
      WHEN p_profile_data ? 'weight_class' 
        AND p_profile_data->>'weight_class' NOT IN ('', 'null')
      THEN p_profile_data->>'weight_class'
      ELSE weight_class
    END,
    updated_at = now()
  WHERE fighter_id = p_fighter_id
    AND is_active = true;
END IF;
```

### Parte 2: Corregir Datos Existentes (One-time fix)

```sql
-- Sincronizar TODOS los registros desincronizados actuales
UPDATE fighter_rankings fr
SET 
  level = fp.level,
  weight_class = fp.weight_class,
  updated_at = now()
FROM fighter_profiles fp
WHERE fr.fighter_id = fp.id
  AND fr.is_active = true
  AND (fr.level IS DISTINCT FROM fp.level 
       OR fr.weight_class IS DISTINCT FROM fp.weight_class);
```

### Parte 3: Corrección Estética de Tarjetas

Modificar `FightersProfiles.tsx` para altura uniforme:

```tsx
// ANTES (líneas 232-239):
<div>
  <CardTitle className="text-lg">
    {fighter.first_name} {fighter.last_name}
  </CardTitle>
  {fighter.nickname && (
    <p className="text-sm text-muted-foreground">"{fighter.nickname}"</p>
  )}
</div>

// DESPUÉS:
<div className="min-h-[3rem]">  {/* Altura fija para uniformidad */}
  <CardTitle className="text-lg leading-tight">
    {fighter.first_name} {fighter.last_name}
  </CardTitle>
  <p className="text-sm text-muted-foreground h-5">
    {fighter.nickname ? `"${fighter.nickname}"` : '\u00A0'}  {/* Espacio invisible si no hay apodo */}
  </p>
</div>
```

**Resultado visual esperado:**

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Juan Pérez      │  │ Carlos López    │  │ Ana García      │
│ "El Destructor" │  │                 │  │ "La Tigresa"    │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Récord: 5-2-0   │  │ Récord: 3-1-0   │  │ Récord: 8-0-0   │
│ Peso: Ligero    │  │ Peso: Pluma     │  │ Peso: Gallo     │
│ ...             │  │ ...             │  │ ...             │
└─────────────────┘  └─────────────────┘  └─────────────────┘
     ↑                     ↑                    ↑
   (OK)               (UNIFORME)              (OK)
```

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| **Nueva migración SQL** | Agregar sincronización directa a la función RPC + fix de datos existentes | CRÍTICA |
| `src/pages/admin/FightersProfiles.tsx` | Agregar altura fija al contenedor de nombre/apodo | ALTA |

---

## Verificación Post-Implementación

1. **Sincronización:** Editar cualquier peleador desde Admin → El ranking debe actualizarse inmediatamente
2. **Estética:** Verificar que todas las tarjetas tengan la misma altura independientemente del apodo
3. **Query de validación:**
   ```sql
   -- Debe devolver 0 filas si todo está sincronizado
   SELECT fp.first_name, fp.level as profile, fr.level as ranking
   FROM fighter_profiles fp
   JOIN fighter_rankings fr ON fp.id = fr.fighter_id
   WHERE fp.level != fr.level AND fr.is_active = true;
   ```

---

## Resumen de Cambios

1. ✅ Sincronización directa en función RPC (no depender solo del trigger)
2. ✅ Fix automático de datos desincronizados existentes (Erick Tzoc)
3. ✅ Mantener trigger como respaldo
4. ✅ Tarjetas con altura uniforme independientemente del apodo
