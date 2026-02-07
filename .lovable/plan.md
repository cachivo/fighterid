
# Auditoría Completa: Corrección de Campos No Guardados y Sincronización en Tiempo Real

## Diagnóstico Confirmado

### BUG CRÍTICO #1: 14 Campos Faltantes en la Función RPC

La función `admin_update_fighter_profile` está **incompleta**. El frontend envía estos campos, pero la función SQL **NO los guarda**:

| Campo | Estado | Evidencia |
|-------|--------|-----------|
| `boxrec_url` | NO SE GUARDA | Confirmado: NULL en BD a pesar de envío |
| `tapology_url` | NO SE GUARDA | No incluido en UPDATE |
| `stance` | NO SE GUARDA | No incluido en UPDATE |
| `gender` | NO SE GUARDA | No incluido en UPDATE |
| `birthdate` | NO SE GUARDA | No incluido en UPDATE |
| `birthplace` | NO SE GUARDA | No incluido en UPDATE |
| `document_type` | NO SE GUARDA | No incluido en UPDATE |
| `document_number` | NO SE GUARDA | No incluido en UPDATE |
| `emergency_contact_relation` | NO SE GUARDA | Solo se guarda name y phone |
| `medical_allergies` | NO SE GUARDA | No incluido en UPDATE |
| `medical_conditions` | NO SE GUARDA | No incluido en UPDATE |
| `insurance_company` | NO SE GUARDA | No incluido en UPDATE |
| `insurance_policy` | NO SE GUARDA | No incluido en UPDATE |
| `record_type` | NO SE GUARDA | No incluido en UPDATE |

### BUG #2: Inconsistencia de Eventos (Rankings No Se Actualiza)

```text
+------------------------+     +---------------------------+
|   FighterEditModal     |     |   RankingsManagement      |
|   FighterProfiles      |     |                           |
|                        |     |                           |
|  Dispatch:             |     |  Escucha:                 |
|  'fighter-profile-     | --> |  'admin-fighter-updated'  |
|   updated'             |     |                           |
|                        |     |  NUNCA RECIBE EVENTO!     |
+------------------------+     +---------------------------+
```

**Resultado**: El módulo de Rankings **no se actualiza** en tiempo real cuando se editan perfiles.

---

## Solución Propuesta

### Fase 1: Completar Función RPC (SQL Migration)

Actualizar `admin_update_fighter_profile` para incluir TODOS los campos:

```sql
UPDATE fighter_profiles
SET
  -- Campos existentes (ya implementados)
  first_name = ...,
  last_name = ...,
  -- etc.
  
  -- CAMPOS FALTANTES A AGREGAR:
  stance = CASE WHEN p_profile_data ? 'stance' 
    THEN p_profile_data->>'stance' ELSE stance END,
  gender = CASE WHEN p_profile_data ? 'gender' 
    THEN p_profile_data->>'gender' ELSE gender END,
  boxrec_url = CASE WHEN p_profile_data ? 'boxrec_url' 
    THEN p_profile_data->>'boxrec_url' ELSE boxrec_url END,
  tapology_url = CASE WHEN p_profile_data ? 'tapology_url' 
    THEN p_profile_data->>'tapology_url' ELSE tapology_url END,
  birthdate = CASE WHEN p_profile_data ? 'birthdate' 
    THEN (p_profile_data->>'birthdate')::date ELSE birthdate END,
  birthplace = CASE WHEN p_profile_data ? 'birthplace' 
    THEN p_profile_data->>'birthplace' ELSE birthplace END,
  document_type = CASE WHEN p_profile_data ? 'document_type' 
    THEN p_profile_data->>'document_type' ELSE document_type END,
  document_number = CASE WHEN p_profile_data ? 'document_number' 
    THEN p_profile_data->>'document_number' ELSE document_number END,
  emergency_contact_relation = CASE WHEN p_profile_data ? 'emergency_contact_relation' 
    THEN p_profile_data->>'emergency_contact_relation' ELSE emergency_contact_relation END,
  medical_allergies = CASE WHEN p_profile_data ? 'medical_allergies' 
    THEN p_profile_data->>'medical_allergies' ELSE medical_allergies END,
  medical_conditions = CASE WHEN p_profile_data ? 'medical_conditions' 
    THEN p_profile_data->>'medical_conditions' ELSE medical_conditions END,
  insurance_company = CASE WHEN p_profile_data ? 'insurance_company' 
    THEN p_profile_data->>'insurance_company' ELSE insurance_company END,
  insurance_policy = CASE WHEN p_profile_data ? 'insurance_policy' 
    THEN p_profile_data->>'insurance_policy' ELSE insurance_policy END,
  record_type = CASE WHEN p_profile_data ? 'record_type' 
    THEN p_profile_data->>'record_type' ELSE record_type END
WHERE id = p_fighter_id;
```

### Fase 2: Corregir Evento en RankingsManagement.tsx

**Archivo:** `src/pages/admin/RankingsManagement.tsx`
**Línea:** 41

```tsx
// ANTES (evento incorrecto - nunca se dispara)
window.addEventListener('admin-fighter-updated', handleFighterUpdate);

// DESPUÉS (evento correcto - unificado con el resto del sistema)
window.addEventListener('fighter-profile-updated', handleFighterUpdate);
```

### Fase 3: Agregar Suscripción Realtime al Módulo de Rankings

Para coherencia total, agregar `useRealtimeFighterUpdates()` en RankingsManagement.tsx:

```tsx
import { useRealtimeFighterUpdates } from '@/hooks/useRealtimeFighterUpdates';

export default function RankingsManagement() {
  // Existing code...
  
  // Agregar sincronización realtime
  useRealtimeFighterUpdates();
  
  // Rest of component...
}
```

---

## Archivos a Modificar

| Archivo | Tipo de Cambio | Impacto |
|---------|----------------|---------|
| SQL Migration | Agregar 14 campos al UPDATE | Campos se guardan correctamente |
| `RankingsManagement.tsx` | Cambiar nombre de evento | Rankings se actualiza en tiempo real |
| `RankingsManagement.tsx` | Agregar useRealtimeFighterUpdates | Sincronización completa con BD |

---

## Resultado Esperado

1. **Todos los campos** (boxrec_url, tapology_url, stance, gender, birthdate, etc.) **se guardarán correctamente**
2. **Rankings se actualizará** automáticamente cuando se editen perfiles
3. **Coherencia absoluta** entre todos los módulos admin (mismo evento, misma lógica)
4. **Sincronización en tiempo real** mediante realtime subscriptions de Supabase

---

## Secuencia de Implementación

1. **Migración SQL** - Agregar los 14 campos faltantes a la función RPC
2. **RankingsManagement.tsx** - Corregir nombre de evento
3. **RankingsManagement.tsx** - Agregar hook de realtime
4. **Prueba end-to-end** - Verificar que boxrec_url y otros campos se guardan
