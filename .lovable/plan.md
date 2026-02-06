
## Hallazgos (lo que está pasando realmente)

1. En tu cuenta (Moisés Cárdenas) **sí existe una licencia ACTIVA** en la base de datos:
   - `fighter_profiles.license_status = 'active'`
   - `fighter_profiles.primary_license_id = c6880f31-a6af-4101-92cc-e3c0b68946ea`
   - `fighter_licenses.id = c6880f31...` con `status = 'ACTIVE'` e `is_primary = true`

2. Pero el RPC que decide el estado para la app:
   - `check_user_license_status(auth_uid)`
   está respondiendo **“status: no_license”** (lo vimos en Network y Console del navegador), aunque en el `profile` viene “license_status: active” y el `primary_license_id`.

3. Resultado en UI:
   - `useLicenseAuth` interpreta `no_license` como “sin licencia” y deja `hasActiveLicense=false`
   - `/license/pending` se queda pegado mostrando “En revisión”
   - No redirige a `/license/dashboard`, por eso no ves tu Fighter ID, ni tu licencia, ni el flujo correcto como peleador.

Conclusión: ahora el problema ya no es “cache/realtime”; es que el **RPC está fallando al devolver la licencia** aunque existe. Hay que corregir esa lógica y además meter un “fallback” en frontend para que nunca vuelva a pasar.

---

## Objetivo del arreglo

- Que el estado mostrado en el Fighter ID sea **100% consistente** con la base de datos.
- Que si un peleador tiene `fighter_profiles.license_status = active` + `primary_license_id`, **SIEMPRE** sea tratado como ACTIVO y pueda entrar a:
  - `/license/dashboard` (Fighter ID)
  - ver su licencia
  - editar/subir información extra como peleador

---

## Cambios a implementar (DB + Frontend)

### A) Base de datos: rehacer `check_user_license_status` para que use `primary_license_id` como fuente principal

**Problema actual del RPC:** está buscando la licencia por `fighter_id/status/is_primary`, pero por alguna razón está devolviendo vacío en producción/cliente aunque la fila existe.

**Solución robusta (más fiable):**
1. Encontrar `app_user` por `auth_user_id` (igual que ahora)
2. Encontrar `fighter_profiles` activo del usuario (igual que ahora)
3. Para la licencia:
   - Primero: si `fighter_profiles.primary_license_id` existe, **traer la licencia por `id = primary_license_id`**
   - Validar `status`:
     - si `ACTIVE` → `active_license`
     - si `PENDING_REVIEW` o `APPLIED` → `pending_license`
   - Si `primary_license_id` no existe, hacer fallback (buscar por `fighter_id`, y escoger la más reciente/primaria)

**Implementación recomendada:**
- Reemplazar el function PL/pgSQL por una versión **LANGUAGE SQL con CTEs**, porque:
  - evita edge cases raros de `record` en PL/pgSQL
  - es más determinística
  - es más fácil de auditar

**Entregable:**
- Nueva migration SQL en `supabase/migrations/` con `CREATE OR REPLACE FUNCTION public.check_user_license_status(...) ...`

**Notas de seguridad:**
- Mantener `SECURITY DEFINER` + `SET row_security = off` como ya hicimos, para que el RPC no dependa de `auth.uid()` para “ver” la licencia (especialmente en flows donde el contexto JWT puede variar).

---

### B) Frontend: “Fallback de consistencia” en `useLicenseAuth`

Aunque el RPC quede bien, conviene blindar el frontend contra cualquier inconsistencia futura.

**Cambio:**
En `checkLicenseStatusOptimized`, cuando el RPC responda:
- `status === 'no_license'` pero `profile.license_status === 'active'` y existe `profile.primary_license_id`

Entonces:
1. Hacer un fetch directo:
   - `fighter_licenses` por `id = profile.primary_license_id`
2. Si viene `status='ACTIVE'`:
   - Forzar:
     - `setHasActiveLicense(true)`
     - `setLicenseData({ ...license, fighter_profiles: profile })`
     - redirigir `/license/pending` → `/license/dashboard`
3. Si la licencia no se puede traer por RLS (no debería, pero por si acaso):
   - construir un “licenseData mínimo” para permitir el dashboard:
     - `id = primary_license_id`
     - `status = 'ACTIVE'`
     - `license_number` desde el perfil (ya viene denormalizado)
     - `fighter_profiles = profile`

**Archivos:**
- `src/hooks/useLicenseAuth.tsx`

---

### C) Ajuste menor: rutas / pantallas para que no dependan de un único campo

**LicensePending.tsx**
- Actualmente solo redirige si `licenseData.status === 'ACTIVE'` o si polling ve `active_license`.
- Con los cambios A/B, ya debería funcionar, pero añadiremos una condición extra:
  - si `licenseData?.fighter_profiles?.license_status === 'active'` y `licenseData?.fighter_profiles?.primary_license_id` → redirigir

**LicenseProtectedRoute.tsx**
- Asegurar que si `licenseData.status` está undefined pero el perfil indica licencia activa, no lo mande a pending/onboarding.

**Archivos:**
- `src/pages/license/LicensePending.tsx`
- `src/components/LicenseProtectedRoute.tsx`

---

## Plan de ejecución (paso a paso)

1. **DB migration**
   - Crear migration que reemplace `check_user_license_status` con lógica:
     - usa `primary_license_id` primero
     - devuelve `active_license` y el objeto `license` completo
     - fallback a búsquedas por `fighter_id` solo si falta el primary
   - Regenerar/actualizar `src/integrations/supabase/types.ts` si el tipado cambió (idealmente mantener mismo shape: `{ status, profile, license }`).

2. **Frontend: fallback de consistencia**
   - Modificar `checkLicenseStatusOptimized`:
     - si RPC dice `no_license` pero el perfil dice `license_status='active'`, “autocorregir”
     - setear `hasActiveLicense` y `licenseData` correctamente
   - Dejar logs claros (solo debug) para confirmar en consola que activó el fallback.

3. **Rutas**
   - Ajustar `LicensePending` y `LicenseProtectedRoute` para que:
     - no se queden “pegados” si `status` viene incompleto
     - prioricen consistencia con `fighter_profiles.license_status` cuando aplique

---

## Criterios de aceptación (cómo sabremos que quedó)

Con el usuario Moisés (auth uid `a10df579-...`):

1. Al entrar a `/license/pending`:
   - en menos de 1–2s redirige a `/license/dashboard`
2. En `/license/dashboard`:
   - el badge de estado muestra **Activa**
   - se visualiza el Fighter ID y los datos de licencia
3. En `/profile`:
   - si ya es peleador con licencia, redirige correctamente al Fighter ID (dashboard)
4. En consola:
   - `RPC result` debe traer `status: active_license` y un objeto `license` (ya no solo `profile`)

---

## Nota importante sobre “Licencia” vs “Fighter ID”

Hoy, técnicamente el acceso al “Fighter ID” (dashboard) está gateado por el estado de la **licencia**. Si ustedes manejan “Fighter ID” como una entidad separada (por ejemplo un objeto/tabla distinta), luego podemos separar la lógica en dos estados:
- estado de licencia (médico/legal)
- estado de Fighter ID (perfil digital)

Pero primero hay que lograr que el gate actual sea correcto y consistente (esto es el bug que te está bloqueando ahora).

