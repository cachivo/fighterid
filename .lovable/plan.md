
# Auditoria y Sincronizacion del Sistema de Licencias

## Resumen del Problema

El usuario reporta que licencias ya aprobadas aparecen como "en revision" en el perfil. Tras una auditoria completa, se identifico que:

| Capa | Estado |
|------|--------|
| Base de datos | Correcta - 59/60 licencias sincronizadas |
| Trigger de sincronizacion | Funcionando correctamente |
| Contexto React (useLicenseAuth) | Problema: No se actualiza cuando la licencia cambia |
| Cache de React Query | Problema: Datos antiguos persisten |
| Suscripcion Real-time | Problema: Solo escucha `fighter_profiles`, no `fighter_licenses` |

---

## Causa Raiz Identificada

El contexto `useLicenseAuth` tiene tres problemas:

1. **Suscripcion Real-time incompleta**: Solo escucha cambios en `fighter_profiles`, pero el estado de licencia cambia en `fighter_licenses`

2. **Cache no se invalida**: Cuando un admin aprueba una licencia, no se invalida el cache del usuario afectado

3. **RPC con datos obsoletos**: La funcion `check_user_license_status` se llama una vez al inicio y no se refresca automaticamente

---

## Cambios Propuestos

### Fase 1: Corregir Suscripcion Real-time en useLicenseAuth

Archivo: `src/hooks/useLicenseAuth.tsx`

Agregar suscripcion a cambios en `fighter_licenses` ademas de `fighter_profiles`:

```text
ANTES (lineas 331-350):
- Solo escucha cambios en fighter_profiles
- No detecta cuando admin aprueba licencia

DESPUES:
- Escucha cambios en fighter_licenses
- Detecta actualizaciones de status (PENDING_REVIEW -> ACTIVE)
- Actualiza contexto automaticamente
```

Cambio especifico:
- Agregar segundo canal de suscripcion para `fighter_licenses` usando el `license_id` actual
- Cuando se detecte cambio de `status` a `ACTIVE`, llamar `checkLicenseStatusOptimized`

### Fase 2: Mejorar Verificacion Directa en LicensePending

Archivo: `src/pages/license/LicensePending.tsx`

La verificacion directa actual (lineas 27-75) tiene un delay de 2 segundos. Mejorar:

- Reducir delay inicial a 500ms
- Agregar verificacion inmediata cuando `licenseData` cambia
- Usar suscripcion real-time directa a la licencia del usuario

### Fase 3: Invalidar Cache Correctamente

Archivo: `src/hooks/useLicenseSystem.ts`

En `approveLicense` mutation (lineas 84-100), agregar:

```typescript
onSuccess: (_, variables) => {
  // Invalidar queries locales
  qc.invalidateQueries({ queryKey: ['license', variables.licenseId] });
  qc.invalidateQueries({ queryKey: ['pending-licenses'] });
  
  // NUEVO: Broadcast para usuarios afectados
  supabase.channel('license-status-broadcast')
    .send({
      type: 'broadcast',
      event: 'license-approved',
      payload: { licenseId: variables.licenseId }
    });
}
```

### Fase 4: Agregar Listener de Broadcast en useLicenseAuth

Para que el usuario reciba la notificacion de que su licencia fue aprobada:

```typescript
// En useLicenseAuth.tsx, dentro del useEffect principal
const broadcastChannel = supabase
  .channel('license-status-broadcast')
  .on('broadcast', { event: 'license-approved' }, (payload) => {
    if (payload.payload.licenseId === licenseData?.id) {
      console.log('License approved notification received');
      checkLicenseStatusOptimized(user.id);
    }
  })
  .subscribe();
```

---

## Flujo de Datos Corregido

```text
FLUJO ACTUAL (problematico):
Admin aprueba licencia
       |
       v
DB: fighter_licenses.status = 'ACTIVE'
       |
       v
Trigger: Sincroniza a fighter_profiles.license_status
       |
       v
Usuario: Contexto NO se actualiza (no hay listener)
       |
       v
Usuario sigue viendo "En Revision"


FLUJO CORREGIDO:
Admin aprueba licencia
       |
       v
DB: fighter_licenses.status = 'ACTIVE'
       |
       +---> Trigger: Sincroniza a fighter_profiles
       |
       +---> Real-time: Notifica a usuario via postgres_changes
       |
       +---> Broadcast: Notifica via canal dedicado
       |
       v
Usuario: Contexto se actualiza automaticamente
       |
       v
Redireccion automatica a /license/dashboard
```

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/hooks/useLicenseAuth.tsx` | Agregar suscripcion a fighter_licenses + broadcast listener | CRITICA |
| `src/pages/license/LicensePending.tsx` | Mejorar verificacion directa, reducir delay | ALTA |
| `src/hooks/useLicenseSystem.ts` | Agregar broadcast en approveLicense | ALTA |
| `src/components/LicenseProtectedRoute.tsx` | Agregar verificacion de status en render | MEDIA |

---

## Implementacion Detallada

### useLicenseAuth.tsx - Suscripcion Real-time Mejorada

Lineas 331-360, reemplazar con:

```typescript
// Suscripcion dual: fighter_profiles Y fighter_licenses
if (user && licenseData?.id) {
  // Canal 1: Cambios en perfil de peleador
  const profileChannel = supabase
    .channel('fighter-profile-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'fighter_profiles'
    }, (payload) => {
      if (mounted) {
        retryCountRef.current = 0;
        checkLicenseStatusOptimized(user.id);
      }
    })
    .subscribe();

  // Canal 2: Cambios en licencia (NUEVO)
  const licenseChannel = supabase
    .channel(`license-changes-${licenseData.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'fighter_licenses',
      filter: `id=eq.${licenseData.id}`
    }, (payload) => {
      console.log('License status changed via real-time:', payload);
      if (mounted && payload.new?.status === 'ACTIVE') {
        setHasActiveLicense(true);
        setLicenseData(prev => ({ ...prev, status: 'ACTIVE' }));
        // Redirigir si estamos en pending
        if (window.location.pathname === '/license/pending') {
          window.location.href = '/license/dashboard';
        }
      }
    })
    .subscribe();

  // Canal 3: Broadcast de admin (NUEVO)
  const broadcastChannel = supabase
    .channel('license-approvals')
    .on('broadcast', { event: 'license-approved' }, (payload) => {
      if (payload.payload?.licenseId === licenseData.id) {
        console.log('License approval broadcast received');
        checkLicenseStatusOptimized(user.id);
      }
    })
    .subscribe();
}
```

### LicensePending.tsx - Verificacion Mejorada

Lineas 27-75, mejorar verificacion directa:

```typescript
// Verificacion directa mejorada - ejecutar inmediatamente
useEffect(() => {
  const directLicenseCheck = async () => {
    if (!user || hasActiveLicense || isRedirecting) return;
    
    try {
      // Consulta directa sin delay
      const { data, error } = await supabase.rpc('check_user_license_status', {
        p_auth_user_id: user.id
      });
      
      if (data?.status === 'active_license') {
        console.log('Direct RPC check found ACTIVE license');
        setIsRedirecting(true);
        navigate('/license/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Direct license check error:', error);
    }
  };

  // Ejecutar inmediatamente y luego cada 5 segundos
  directLicenseCheck();
  const interval = setInterval(directLicenseCheck, 5000);
  
  return () => clearInterval(interval);
}, [user, hasActiveLicense, isRedirecting, navigate]);
```

### useLicenseSystem.ts - Broadcast en Aprobacion

En `approveLicense` mutation (lineas 84-100):

```typescript
const approveLicense = useMutation({
  mutationFn: async ({ licenseId, level }) => {
    const { error } = await supabase.rpc('approve_license', {
      p_license_id: licenseId,
      p_level: level
    });
    if (error) throw error;
  },
  onSuccess: async (_, variables) => {
    // Invalidar caches
    qc.invalidateQueries({ queryKey: ['license', variables.licenseId] });
    qc.invalidateQueries({ queryKey: ['pending-licenses'] });
    
    // Broadcast para notificar al usuario (NUEVO)
    await supabase.channel('license-approvals').send({
      type: 'broadcast',
      event: 'license-approved',
      payload: { licenseId: variables.licenseId }
    });
  }
});
```

---

## Verificacion de Datos Existentes

Se verifico la base de datos y los datos estan correctos:

| Metrica | Valor |
|---------|-------|
| Total licencias activas | 59 |
| Licencias sincronizadas correctamente | 59 (100%) |
| Licencias desincronizadas | 0 |
| Licencias pendientes | 0 |
| Licencias suspendidas | 1 |

El trigger `sync_fighter_license_data` funciona correctamente.

---

## Beneficios Esperados

| Metrica | Antes | Despues |
|---------|-------|---------|
| Tiempo de actualizacion de estado | Manual (refresh) | Automatico (< 1s) |
| Usuarios viendo estado incorrecto | Posible | Eliminado |
| Canales de sincronizacion | 1 (parcial) | 3 (completo) |
| Necesidad de refresh manual | Frecuente | Nunca |

---

## Seccion Tecnica

### Por que el problema ocurre

El contexto `useLicenseAuth` usa el RPC `check_user_license_status` que se ejecuta:
1. Al cargar la pagina
2. Manualmente con `refreshLicense()`

Pero NO se ejecuta cuando:
- Un admin aprueba la licencia
- El estado cambia en la base de datos

### Solucion: Triple Capa de Sincronizacion

```text
Capa 1: postgres_changes
        - Escucha cambios directos en fighter_licenses
        - Mas rapido pero requiere RLS configurado

Capa 2: broadcast
        - Admin envia notificacion al aprobar
        - Funciona incluso si RLS bloquea postgres_changes

Capa 3: polling
        - Verificacion periodica cada 5s en /license/pending
        - Respaldo si las otras capas fallan
```

### Tablas Involucradas

```text
fighter_licenses
  - id (PK)
  - status ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED')
  - fighter_id (FK -> fighter_profiles)

fighter_profiles  
  - id (PK)
  - license_status ('active', 'suspended', etc)
  - primary_license_id (FK -> fighter_licenses)

Trigger: sync_fighter_license_data
  - Se ejecuta en INSERT/UPDATE/DELETE de fighter_licenses
  - Actualiza fighter_profiles.license_status automaticamente
```

