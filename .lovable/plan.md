
# Correccion Completa del Sistema de Edicion de Perfiles

## Diagnostico - Causa Raiz del Error

### Error Critico Identificado

Los logs de la base de datos muestran:
```
ERROR: type "public.competition_discipline" does not exist
```

**Ubicacion del problema:** La funcion `admin_update_fighter_profile` actualmente en produccion tiene esta linea erronea (linea 40):
```sql
discipline = COALESCE(p_profile_data->>'discipline', discipline::TEXT)::public.competition_discipline
```

El tipo correcto que existe en la base de datos es `discipline`, NO `competition_discipline`.

### Evidencia en la Base de Datos

| Tipo existente | Valores del ENUM |
|----------------|------------------|
| `discipline` | MMA, Boxeo, Judo, JiuJitsu, Kickboxing, MuayThai, Grappling, Otro |

El tipo `competition_discipline` NO existe en `pg_type`.

---

## Problemas Secundarios Identificados

### 1. Formulario de Usuario Bypasa Sincronizacion

El componente `UserFighterProfileEditForm.tsx` (lineas 274-277) hace updates directos:
```typescript
const { error: updateError } = await supabase
  .from('fighter_profiles')
  .update(updates)
  .eq('id', profileId);
```

**Consecuencia:** Los cambios de usuarios (nivel, peso, disciplina) NO se sincronizan automaticamente a rankings.

### 2. Sin RPC para Usuarios

No existe una funcion `user_update_fighter_profile`. Solo existe `admin_update_fighter_profile`.

### 3. Politicas RLS Correctas

Las politicas de `fighter_profiles` SI permiten que usuarios actualicen su perfil:
```sql
UPDATE policy: EXISTS(SELECT 1 FROM app_user WHERE app_user.id = fighter_profiles.user_id AND auth_user_id = auth.uid()) OR is_admin()
```

Sin embargo, el update directo no sincroniza a rankings.

---

## Plan de Implementacion

### Fase 1: Corregir Funcion RPC (Critico)

**Archivo:** Nueva migracion SQL

Recrear `admin_update_fighter_profile` con el tipo correcto:

```sql
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(p_fighter_id uuid, p_profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- ... resto del codigo ...
-- CAMBIO CRITICO (linea ~40):
-- DE: ::public.competition_discipline
-- A:  ::public.discipline
discipline = CASE
  WHEN p_profile_data ? 'discipline' THEN
    CASE
      WHEN p_profile_data->>'discipline' IN ('', 'null') THEN NULL
      WHEN p_profile_data->>'discipline' = ANY (ARRAY['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'])
        THEN (p_profile_data->>'discipline')::discipline  -- tipo correcto
      ELSE discipline
    END
  ELSE discipline
END,
-- ... resto de la funcion ...
$function$;
```

### Fase 2: Crear RPC para Usuarios

**Archivo:** Nueva migracion SQL

Crear `user_update_fighter_profile` que:
1. Verifique que el usuario sea dueno del perfil
2. Aplique las mismas reglas de sincronizacion a rankings
3. Respete campos sensibles vs inmediatos

```sql
CREATE OR REPLACE FUNCTION public.user_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_owner_id UUID;
BEGIN
  -- Obtener user_id del caller
  SELECT id INTO v_user_id FROM public.app_user WHERE auth_user_id = auth.uid();
  
  -- Verificar propiedad del perfil
  SELECT user_id INTO v_owner_id FROM public.fighter_profiles WHERE id = p_fighter_id;
  
  IF v_user_id IS NULL OR v_user_id != v_owner_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own profile';
  END IF;
  
  -- Actualizar perfil (campos permitidos solamente)
  UPDATE public.fighter_profiles
  SET 
    nickname = COALESCE(p_profile_data->>'nickname', nickname),
    bio = COALESCE(p_profile_data->>'bio', bio),
    fighting_style = COALESCE(p_profile_data->>'fighting_style', fighting_style),
    -- ... demas campos permitidos ...
    updated_at = now()
  WHERE id = p_fighter_id;
  
  -- Sincronizar a rankings si cambia nivel/peso/disciplina
  -- (logica similar a admin_update_fighter_profile)
END;
$function$;
```

### Fase 3: Actualizar Frontend

**Archivo:** `src/components/UserFighterProfileEditForm.tsx`

Cambiar de update directo a RPC:

```typescript
// ANTES (update directo - sin sincronizacion):
const { error: updateError } = await supabase
  .from('fighter_profiles')
  .update(updates)
  .eq('id', profileId);

// DESPUES (usando RPC con sincronizacion):
const { error: updateError } = await supabase.rpc('user_update_fighter_profile', {
  p_fighter_id: profileId,
  p_profile_data: updates
});
```

### Fase 4: Verificar Hook de Realtime

El hook `useRealtimeFighterUpdates.tsx` ya fue creado pero necesita integrarse en:
- `LicenseDashboard.tsx` - (ya integrado)
- `FighterProfile.tsx` - (ya integrado)
- `FightersProfiles.tsx` - (ya integrado)

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Corregir `admin_update_fighter_profile` (tipo `discipline`) |
| Nueva migracion SQL | Crear `user_update_fighter_profile` |
| `src/components/UserFighterProfileEditForm.tsx` | Usar RPC en lugar de update directo |
| `src/hooks/useFighterProfiles.tsx` | Agregar `userUpdateFighterProfile` |

---

## Validacion Post-Implementacion

### Test 1: Admin edita perfil de Willis Yang
1. Abrir modal de edicion
2. Cambiar cualquier campo (ej: apodo)
3. Guardar cambios
4. Verificar toast de exito (no error)

### Test 2: Usuario edita su propio perfil
1. Login como Willis Yang
2. Ir a dashboard de licencia
3. Editar bio o estilo de pelea
4. Verificar actualizacion inmediata

### Test 3: Sincronizacion a rankings
1. Admin cambia nivel de Amateur a Semi-profesional
2. Verificar que ranking se actualiza automaticamente
3. Verificar que peleador aparece en liga correcta

---

## Resumen Tecnico

| Problema | Causa | Solucion |
|----------|-------|----------|
| Error al guardar perfil | Tipo `competition_discipline` no existe | Usar tipo `discipline` |
| Sin sincronizacion usuarios | Update directo sin RPC | Crear `user_update_fighter_profile` |
| Datos desactualizados | Sin realtime | Hook `useRealtimeFighterUpdates` |

La correccion del tipo de disciplina es CRITICA y debe aplicarse primero para que cualquier edicion funcione.
