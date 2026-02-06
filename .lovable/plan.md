
# Auditoria Completa: Sistema de Edicion de Perfiles de Peleadores

## Resumen Ejecutivo

El sistema de edicion de perfiles tiene **multiples problemas de arquitectura** que causan que los datos no se guarden o no se muestren correctamente despues de editar. Identifique 6 problemas criticos y presento el plan de correccion.

---

## Problemas Identificados

### Problema 1: Desconexion de Eventos (CRITICO)

**Ubicacion:** `FightersProfiles.tsx` linea 55, `useFighterProfiles.tsx` linea 454

| Componente | Evento que ESCUCHA | Evento que DISPARA |
|------------|-------------------|-------------------|
| FightersProfiles.tsx | `fighter-profile-updated` | - |
| useFighterProfiles.adminUpdateFighterProfile | - | `admin-fighter-updated` |
| useAdminFighters.tsx | `admin-fighter-updated` | - |
| useRealtimeFighterUpdates | - | `fighter-profile-updated` |

**Problema:** El modal usa `adminUpdateFighterProfile` de `useFighterProfiles` que dispara `admin-fighter-updated`, pero la pagina de admin escucha `fighter-profile-updated`. Aunque `useAdminFighters` escucha el evento correcto, hay confusion en el flujo.

---

### Problema 2: Closure Stale en useAdminFighters

**Ubicacion:** `useAdminFighters.tsx` lineas 173-180

```typescript
useEffect(() => {
  const onAdminUpdated = () => {
    fetchFighters(); // Esta funcion puede estar STALE
  };
  window.addEventListener('admin-fighter-updated', onAdminUpdated);
  return () => window.removeEventListener('admin-fighter-updated', onAdminUpdated);
}, []); // <-- DEPENDENCIAS VACIAS - fetchFighters no esta incluido
```

**Problema:** El `fetchFighters` capturado en el closure puede ser una version antigua de la funcion.

---

### Problema 3: Doble Sistema de Estado Sin Sincronizacion

**Ubicacion:** Hooks `useAdminFighters` y `useFighterProfiles`

Ambos hooks mantienen su propia lista de peleadores con `useState`:

```text
useAdminFighters.fighters (useState) ←→ NO SINCRONIZADO ←→ useFighterProfiles.fighters (useState)
```

La pagina de admin usa datos de `useAdminFighters`, pero el modal actualiza via `useFighterProfiles`.

---

### Problema 4: RPC con COALESCE que Preserva Valores Null

**Ubicacion:** Funcion SQL `admin_update_fighter_profile`

```sql
height_cm = COALESCE((p_profile_data->>'height_cm')::INTEGER, height_cm),
```

Si el frontend envia `0` o `null`, COALESCE preserva el valor antiguo en lugar de actualizarlo.

---

### Problema 5: Modal Cierra Antes de Confirmar Refresh

**Ubicacion:** `FighterEditModal.tsx` lineas 286-292

```typescript
const success = await adminUpdateFighterProfile(fighter.id, sanitizedData);
if (success) {
  toast({ title: "Actualizacion exitosa!" });
  onClose(); // El modal cierra INMEDIATAMENTE
}
```

El modal se cierra antes de que la lista tenga tiempo de refrescarse, mostrando datos antiguos.

---

### Problema 6: Formulario de Usuario Falta Campos Criticos

**Ubicacion:** `UserFighterProfileEditForm.tsx` funcion `user_update_fighter_profile`

El RPC de usuario NO incluye estos campos que si puede editar:
- `first_name`, `last_name` (identidad)
- `country`, `birthdate`, `birthplace`, `gender` (datos personales)
- `record_wins`, `record_losses`, `record_draws` (cuando licencia no esta activa)

---

## Plan de Correccion

### Fase 1: Unificar Sistema de Eventos

**Archivos a modificar:**
- `src/hooks/useFighterProfiles.tsx`
- `src/hooks/useAdminFighters.tsx`
- `src/pages/admin/FightersProfiles.tsx`

**Cambios:**
1. Estandarizar a un unico evento: `fighter-profile-updated`
2. Incluir metadata util en el evento (fighterId, source, fields)

```typescript
// useFighterProfiles.tsx - Cambiar linea 454
window.dispatchEvent(new CustomEvent('fighter-profile-updated', {
  detail: { 
    fighterId, 
    source: 'admin-update',
    fields: Object.keys(profileData) 
  }
}));
```

---

### Fase 2: Corregir Closure Stale

**Archivo:** `src/hooks/useAdminFighters.tsx`

**Cambios:**
```typescript
// Usar useCallback para fetchFighters
const fetchFighters = useCallback(async () => {
  // ... codigo existente
}, [toast]);

// Incluir fetchFighters en dependencias
useEffect(() => {
  const onAdminUpdated = () => {
    fetchFighters();
  };
  window.addEventListener('fighter-profile-updated', onAdminUpdated);
  return () => window.removeEventListener('fighter-profile-updated', onAdminUpdated);
}, [fetchFighters]); // <-- INCLUIR DEPENDENCIA
```

---

### Fase 3: Eliminar Hook Duplicado

**Cambio de arquitectura:**

Opcion A: Eliminar `useAdminFighters` y usar solo `useFighterProfiles` con React Query
Opcion B: Migrar ambos a React Query con cache compartido

**Recomendacion:** Opcion B - Usar React Query para ambos con claves compartidas

```typescript
// Nuevo patron con React Query
const { data: fighters } = useQuery({
  queryKey: ['admin-fighters'],
  queryFn: fetchAdminFighters,
});
```

---

### Fase 4: Corregir Logica COALESCE en RPC

**Archivo:** Nueva migracion SQL

**Cambio critico:**
```sql
-- ANTES: Preserva valor si JSON tiene null
height_cm = COALESCE((p_profile_data->>'height_cm')::INTEGER, height_cm),

-- DESPUES: Respeta null explicito del JSON
height_cm = CASE 
  WHEN p_profile_data ? 'height_cm' THEN 
    NULLIF((p_profile_data->>'height_cm')::INTEGER, 0)
  ELSE height_cm 
END,
```

---

### Fase 5: Agregar Delay Antes de Cerrar Modal

**Archivo:** `src/components/admin/FighterEditModal.tsx`

```typescript
const success = await adminUpdateFighterProfile(fighter.id, sanitizedData);
if (success) {
  toast({ title: "Actualizacion exitosa!" });
  
  // Esperar a que el refresh se complete antes de cerrar
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Forzar refresh manual para asegurar datos actualizados
  window.dispatchEvent(new CustomEvent('fighter-profile-updated', {
    detail: { fighterId: fighter.id }
  }));
  
  onClose();
}
```

---

### Fase 6: Completar RPC de Usuario

**Archivo:** Nueva migracion SQL para `user_update_fighter_profile`

Agregar campos faltantes:
```sql
-- Agregar campos de identidad (con validacion de cambios menores)
first_name = CASE 
  WHEN p_profile_data ? 'first_name' THEN p_profile_data->>'first_name'
  ELSE first_name 
END,
last_name = CASE 
  WHEN p_profile_data ? 'last_name' THEN p_profile_data->>'last_name'
  ELSE last_name 
END,
country = CASE 
  WHEN p_profile_data ? 'country' THEN p_profile_data->>'country'
  ELSE country 
END,
-- ... etc para todos los campos permitidos
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useAdminFighters.tsx` | useCallback + dependencias correctas + evento unificado |
| `src/hooks/useFighterProfiles.tsx` | Evento unificado + verificacion post-update |
| `src/components/admin/FighterEditModal.tsx` | Delay antes de cerrar + forzar refresh |
| `src/components/UserFighterProfileEditForm.tsx` | Asegurar todos los campos se envian |
| `src/pages/admin/FightersProfiles.tsx` | Escuchar evento unificado |
| Nueva migracion SQL | Corregir COALESCE + completar user RPC |

---

## Orden de Implementacion

1. **Migracion SQL** - Corregir logica COALESCE y completar user RPC
2. **useAdminFighters.tsx** - Corregir closure stale y evento
3. **useFighterProfiles.tsx** - Unificar evento
4. **FighterEditModal.tsx** - Agregar delay y verificacion
5. **UserFighterProfileEditForm.tsx** - Asegurar campos completos
6. **FightersProfiles.tsx** - Limpiar listeners duplicados

---

## Pruebas de Validacion

### Test 1: Admin Edita Perfil
1. Abrir modal de Willis Yang
2. Cambiar apodo a "Test Nickname"
3. Guardar cambios
4. Verificar que el apodo se muestra inmediatamente en la lista
5. Refrescar pagina y verificar persistencia

### Test 2: Usuario Edita Su Perfil
1. Login como Willis Yang
2. Ir a dashboard de licencia
3. Editar biografia
4. Guardar cambios
5. Verificar actualizacion inmediata

### Test 3: Sincronizacion de Rankings
1. Admin cambia nivel de "Amateur" a "Semi-profesional"
2. Verificar que el ranking se actualiza
3. Verificar persistencia despues de refresh

---

## Resumen Tecnico

| Problema | Impacto | Solucion |
|----------|---------|----------|
| Desconexion de eventos | Datos no se refrescan | Evento unificado |
| Closure stale | Refresh con datos antiguos | useCallback + deps |
| Hooks duplicados | Estados desincronizados | React Query compartido |
| COALESCE preserva null | Campos no se actualizan | Logica CASE explicita |
| Modal cierra rapido | Usuario ve datos viejos | Delay + refresh forzado |
| RPC usuario incompleto | Campos no se guardan | Completar funcion SQL |

La implementacion de estas correcciones asegurara que tanto administradores como usuarios puedan editar perfiles con actualizacion inmediata y persistente.
