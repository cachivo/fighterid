
# Auditoria y Correccion del Sistema de Edicion de Perfiles

## Problemas Identificados

### 1. Carga de Imagenes desde Admin Falla para Perfiles de Terceros

**Archivo afectado:** `src/lib/photoUtils.ts` (linea 76)

El codigo actual:
```typescript
const photoFileName = `${userId}/photo-${Date.now()}.webp`;
```

Usa el `user_id` del perfil del peleador, pero la politica RLS de storage verifica:
```sql
storage.foldername(name)[1] = auth.uid()::text
```

**Resultado:** Cuando un admin intenta subir foto para otro peleador, el `userId` (del peleador) no coincide con `auth.uid()` (del admin), y la subida falla silenciosamente.

**Ademas:** En `FighterEditModal.tsx` (linea 221-226):
```typescript
if (!fighter.user_id) {
  toast({
    title: "Advertencia",
    description: "No se puede subir avatar: usuario no valido..."
  });
}
```
Los perfiles creados manualmente por admin NO tienen `user_id`, por lo que NUNCA pueden recibir imagenes desde el modal de edicion.

---

### 2. No Hay Sincronizacion en Tiempo Real Global

**Hallazgo:** La busqueda `supabase.*channel.*subscribe` en componentes fuera de `useLicenseAuth` no encontro resultados.

- `useLicenseAuth.tsx` SI tiene suscripciones realtime (lineas 390-443)
- PERO estas solo actualizan el contexto de licencias, no los datos de perfiles publicos
- `FighterProfile.tsx`, `Fighters.tsx`, `Ranking.tsx` NO escuchan cambios en tiempo real
- Los cambios hechos por admin no se reflejan inmediatamente en otras vistas

---

### 3. Hooks de Actualizacion Duplicados e Inconsistentes

| Hook/Componente | Metodo de Actualizacion |
|-----------------|------------------------|
| `useFighterProfiles.tsx` | `adminUpdateFighterProfile` -> RPC `admin_update_fighter_profile` |
| `useAdminFighters.tsx` | `updateFighterProfile` -> RPC `admin_update_fighter_profile` |
| `UserFighterProfileEditForm.tsx` | Update directo a tabla `fighter_profiles` |

**Problema:** El formulario de usuario (`UserFighterProfileEditForm`) hace updates directos SIN usar el RPC, lo que:
- Salta la sincronizacion automatica a rankings
- No dispara eventos de notificacion cross-component
- Puede crear inconsistencias entre perfil y rankings

---

### 4. Invalidacion de Cache Incompleta

En `useFighterProfiles.tsx` (lineas 440-444):
```typescript
queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
queryClient.invalidateQueries({ queryKey: ['ranking-data'] });
queryClient.invalidateQueries({ queryKey: ['fighters'] });
```

**Falta invalidar:**
- `['fighter', fighterId]` - perfil individual
- `['license']` - datos de licencia
- `['userFighterProfile']` - perfil del usuario actual

---

### 5. Falta Feedback de Exito/Error Claro al Usuario

En `UserFighterProfileEditForm.tsx` (linea 272-277):
```typescript
const { error: updateError } = await supabase
  .from('fighter_profiles')
  .update(updates)
  .eq('id', profileId);

if (updateError) throw updateError;
```

No hay confirmacion visual del estado de la operacion mas alla de un toast. Los usuarios no saben si:
- La imagen esta subiendose
- El perfil se guardo correctamente
- Los datos se sincronizaron a rankings

---

## Plan de Correccion

### Fase 1: Arreglar Carga de Imagenes (Critico)

**A. Modificar politicas de Storage (migracion SQL):**
```sql
-- Permitir que admins suban fotos a cualquier carpeta
CREATE POLICY "Admins can upload any fighter photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Permitir que admins actualicen cualquier foto
CREATE POLICY "Admins can update any fighter photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);
```

**B. Modificar `src/lib/photoUtils.ts`:**
- Detectar si el usuario actual es admin
- Si es admin, usar su propio `auth.uid()` como carpeta base
- Alternativamente, crear carpeta por `fighterId` en lugar de `userId`

**C. Modificar `src/components/admin/FighterEditModal.tsx`:**
- Remover validacion de `fighter.user_id` para admins
- Permitir subida de avatar incluso si el perfil no tiene usuario vinculado

---

### Fase 2: Unificar Logica de Actualizacion

**A. Crear funcion RPC unificada para usuarios (`src/hooks/useFighterProfiles.tsx`):**
```typescript
const userUpdateFighterProfile = async (fighterId: string, profileData: Partial<FighterProfileData>) => {
  // Usar RPC en lugar de update directo
  const { error } = await supabase.rpc('user_update_fighter_profile', {
    p_fighter_id: fighterId,
    p_profile_data: profileData
  });
  
  // Invalidar todas las queries relevantes
  queryClient.invalidateQueries({ queryKey: ['fighter', fighterId] });
  queryClient.invalidateQueries({ queryKey: ['fighters'] });
  queryClient.invalidateQueries({ queryKey: ['userFighterProfile'] });
  queryClient.invalidateQueries({ queryKey: ['license'] });
  
  // Disparar evento global
  window.dispatchEvent(new CustomEvent('fighter-profile-updated', {
    detail: { fighterId }
  }));
  
  return !error;
};
```

**B. Modificar `UserFighterProfileEditForm.tsx`:**
- Importar y usar `userUpdateFighterProfile` del hook
- Eliminar updates directos a la tabla

---

### Fase 3: Implementar Sincronizacion en Tiempo Real Global

**A. Crear hook reutilizable `useRealtimeFighterUpdates.tsx`:**
```typescript
export function useRealtimeFighterUpdates(fighterId?: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('fighter-updates-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fighter_profiles',
          ...(fighterId && { filter: `id=eq.${fighterId}` })
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fighters'] });
          if (fighterId) {
            queryClient.invalidateQueries({ queryKey: ['fighter', fighterId] });
          }
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [fighterId, queryClient]);
}
```

**B. Integrar en componentes clave:**
- `FighterProfile.tsx`
- `LicenseDashboard.tsx`
- `Ranking.tsx`
- `FightersProfiles.tsx` (admin)

---

### Fase 4: Mejorar UX y Feedback

**A. Estados de carga claros:**
- Spinner durante subida de imagen
- Progress bar durante actualizacion de perfil
- Confirmacion visual de sincronizacion completada

**B. Mensajes de error especificos:**
- "Error de permisos: Contacta al administrador"
- "Error de conexion: Reintentando..."
- "Imagen demasiado grande: Maximo 5MB"

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/migrations/` | Nueva migracion para politicas de storage |
| `src/lib/photoUtils.ts` | Logica de carpetas por admin vs usuario |
| `src/components/admin/FighterEditModal.tsx` | Remover validacion user_id para admins |
| `src/components/UserFighterProfileEditForm.tsx` | Usar RPC en lugar de update directo |
| `src/hooks/useFighterProfiles.tsx` | Agregar funcion unificada + invalidacion completa |
| `src/hooks/useRealtimeFighterUpdates.tsx` | Nuevo hook para sincronizacion global |
| `src/pages/FighterProfile.tsx` | Integrar realtime hook |
| `src/pages/license/LicenseDashboard.tsx` | Integrar realtime hook |

---

## Resumen Tecnico

El sistema actual tiene tres fallas fundamentales:

1. **Storage RLS restrictivo**: Admins no pueden subir fotos a carpetas de otros usuarios
2. **Actualizaciones no centralizadas**: `UserFighterProfileEditForm` hace bypas del RPC
3. **Sin realtime global**: Solo licencias tienen suscripciones, no perfiles publicos

La solucion requiere:
1. Politicas de storage permisivas para admins
2. Un unico punto de entrada para actualizaciones (RPC)
3. Hook de realtime reutilizable en todos los componentes que muestran datos de peleadores

---

## Orden de Implementacion

1. Migracion SQL (politicas storage) - Critico
2. `photoUtils.ts` + `FighterEditModal.tsx` - Habilita subida admin
3. RPC unificado + `UserFighterProfileEditForm.tsx` - Consistencia de datos
4. Hook realtime + integracion - Sincronizacion en vivo
5. UX improvements - Feedback al usuario
