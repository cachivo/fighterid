

# Correccion: Vinculacion de Records con Rankings en Onboarding

## Problema Raiz

Hay un error de nombre de campo entre la base de datos y el codigo:

- La funcion RPC `create_fighter_profile_with_license` devuelve `profile_id`
- El hook `useOptimizedOnboarding.ts` espera `fighter_id`
- Como `result.fighter_id` es siempre `undefined`, la actualizacion de records por disciplina (MMA/Boxeo) **nunca se ejecuta**
- Los puntos del ranking se calculan usando los campos de disciplina (`mma_record_wins`, `boxeo_record_wins`), que quedan en 0
- Resultado: todos los peleadores nuevos aparecen con **0 puntos** en el ranking

Esto explica por que Jonathan Mejia tiene `record_wins=16` pero `boxeo_record_wins=0` y 0 puntos en el ranking.

---

## Solucion (2 cambios)

### 1. Actualizar la funcion RPC en la base de datos

Modificar `create_fighter_profile_with_license` para:

- **Escribir los records de disciplina directamente** en el INSERT (no depender de una actualizacion posterior)
- **Devolver `fighter_id`** en lugar de `profile_id` para compatibilidad con el frontend

Esto hace que todo sea atomico: perfil + licencia + records de disciplina + auto-inscripcion en ranking, todo en una sola transaccion.

### 2. Corregir el hook del frontend

En `useOptimizedOnboarding.ts`:

- Actualizar la interfaz `CreateProfileResult` para aceptar tanto `fighter_id` como `profile_id`
- Usar `result.fighter_id || result.profile_id` como fallback
- Eliminar la actualizacion separada de records por disciplina (ya no es necesaria porque el RPC lo hace)

### 3. Reparar datos existentes (migracion one-time)

Ejecutar una migracion SQL que copie los records legacy a los campos de disciplina para todos los perfiles que ya estan afectados, y recalcule los puntos del ranking.

---

## Detalles Tecnicos

### Cambio en RPC (SQL Migration)

```sql
-- Dentro del INSERT de fighter_profiles, agregar:
mma_record_wins = CASE WHEN p_discipline = 'MMA' THEN p_record_wins ELSE 0 END,
mma_record_losses = CASE WHEN p_discipline = 'MMA' THEN p_record_losses ELSE 0 END,
boxeo_record_wins = CASE WHEN p_discipline = 'Boxeo' THEN p_record_wins ELSE 0 END,
-- etc.

-- Cambiar el RETURN:
RETURN jsonb_build_object(
  'success', true,
  'user_id', v_user_id,
  'fighter_id', v_profile_id,  -- Renombrar de profile_id a fighter_id
  'license_id', v_license_id,
  'license_number', v_license_number
);
```

### Reparacion de datos existentes (SQL Migration)

```sql
-- Copiar records legacy a campos de disciplina donde esten vacios
UPDATE fighter_profiles
SET 
  mma_record_wins = record_wins,
  mma_record_losses = record_losses,
  mma_record_draws = record_draws
WHERE discipline = 'MMA' 
  AND COALESCE(mma_record_wins, 0) = 0 
  AND record_wins > 0;

-- Similar para Boxeo...
-- Luego recalcular puntos en fighter_rankings
```

### Cambio en useOptimizedOnboarding.ts

```typescript
// Antes:
interface CreateProfileResult {
  fighter_id: string; // Nunca llegaba porque RPC devuelve profile_id
}

// Despues:
interface CreateProfileResult {
  fighter_id: string; // Ahora el RPC devuelve este campo
}
// Y eliminar las lineas 107-121 (actualizacion manual de records)
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Actualizar RPC + reparar datos existentes |
| `src/hooks/useOptimizedOnboarding.ts` | Simplificar: eliminar actualizacion manual de records |

---

## Impacto

- Los nuevos peleadores apareceran inmediatamente en el ranking con sus puntos correctos
- Los peleadores existentes con 0 puntos seran reparados automaticamente
- Se elimina una race condition donde la actualizacion del record podia fallar silenciosamente

