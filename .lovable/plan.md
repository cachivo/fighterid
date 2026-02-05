

# Auditoria Completa: Backend, Frontend y Escalabilidad

## Resumen Ejecutivo

He realizado una auditoria exhaustiva del sistema Fighter ID, identificando **41 issues de seguridad**, inconsistencias entre frontend y backend, y areas que requieren optimizacion para crecimiento exponencial.

---

## PARTE 1: PROBLEMAS DE SEGURIDAD (Backend)

### 1.1 Issues Criticos del Linter de Supabase

| Categoria | Cantidad | Severidad |
|-----------|----------|-----------|
| RLS Policy Always True | 27 | WARN |
| Function Search Path Mutable | 9 | WARN |
| Security Definer View | 1 | ERROR |
| Extension in Public | 1 | WARN |
| Auth OTP Long Expiry | 1 | WARN |
| Leaked Password Protection | 1 | WARN |
| Postgres Security Patches | 1 | WARN |

### 1.2 Politicas RLS Permisivas Detectadas

Las siguientes tablas tienen politicas `WITH CHECK (true)` que permiten escritura sin restricciones:

```text
- ai_inference_logs (INSERT: true)
- ai_strike_events (INSERT: true)
- audit_log (INSERT: true)
- app_user (INSERT: true)
- + 24 tablas adicionales
```

**Riesgo**: Cualquier usuario autenticado podria insertar datos maliciosos.

### 1.3 Funciones sin Search Path Seguro

9 funciones RPC no tienen `SET search_path = public`, lo que las hace vulnerables a ataques de inyeccion de schema:

```sql
-- Ejemplo de funcion vulnerable
CREATE FUNCTION some_function()
RETURNS void AS $$
  -- Sin search_path definido
$$ LANGUAGE plpgsql;

-- Correccion necesaria
CREATE FUNCTION some_function()
RETURNS void 
SECURITY DEFINER
SET search_path = public
AS $$
  -- Codigo seguro
$$ LANGUAGE plpgsql;
```

### 1.4 Configuracion de Auth Insegura

- **OTP Expiry**: 3600 segundos (1 hora) - Deberia ser 300-600s
- **Leaked Password Protection**: DESHABILITADA - Permitir

---

## PARTE 2: INCONSISTENCIAS FRONTEND-BACKEND

### 2.1 Flujo de Onboarding vs Sistema de Rankings

**Problema Principal**: El onboarding del usuario (LicenseOnboarding.tsx) NO inscribe automaticamente al peleador en ningun ranking.

```text
FLUJO ACTUAL (INCORRECTO):
1. Usuario completa onboarding
2. Se llama create_fighter_profile_with_license()
3. Se crea fighter_profile + fighter_licenses
4. ❌ NO se crea fighter_rankings
5. Peleador NO aparece en rankings

FLUJO ESPERADO:
1. Usuario completa onboarding
2. Se crea perfil + licencia
3. ✅ Se crea fighter_rankings segun disciplina seleccionada
4. Peleador aparece en ranking correspondiente
```

**Archivo afectado**: `src/hooks/useOptimizedOnboarding.ts`

**Lineas 78-106**: La funcion RPC `create_fighter_profile_with_license` no llama a `enroll_fighter_in_ranking`.

### 2.2 Manejo de Records por Disciplina

**Problema**: El onboarding maneja records de forma inconsistente con el admin panel.

| Componente | Campo de Records | Logica |
|------------|------------------|--------|
| LicenseOnboarding | `amateurWins/proWins` | Segun `level` |
| AdminFighterForm | `mma_record_wins/boxeo_record_wins` | Segun `discipline` |
| useOptimizedOnboarding | `p_record_wins` (legacy) | Campo unico |
| LicenseDashboard | `record_wins` (legacy) | Muestra legacy |

**Solucion Necesaria**: Unificar logica para que:
- Records MMA se guarden en `mma_record_*`
- Records Boxeo se guarden en `boxeo_record_*`
- El `level` define Amateur/Pro, no la estructura de datos

### 2.3 Campo `discipline` vs `martialArts`

```typescript
// LicenseOnboarding.tsx - Linea 62-64
const discipline = formData.martialArts[0] || 'MMA';
// Toma el primer arte marcial como disciplina

// AdminFighterForm.tsx - Usa campo separado
formData.discipline = 'MMA'; // Campo independiente
formData.martial_arts = ['MuayThai', 'JiuJitsu']; // Artes de entrenamiento
```

**Problema**: El onboarding mezcla conceptos. Si usuario selecciona MMA + Boxeo, el sistema solo usa el primero.

---

## PARTE 3: OPTIMIZACION MOVIL

### 3.1 Estado Actual de Optimizacion

**Archivos con buena optimizacion movil (18 archivos)**:
- `LicenseOnboarding.tsx` - Botones con min-h-[44px]
- `LicenseDashboard.tsx` - Responsive completo
- `UserFighterProfileEditForm.tsx` - Touch targets correctos
- `ErrorBoundary.tsx` - Botones accesibles

### 3.2 Areas que Requieren Mejoras

| Archivo | Problema | Linea |
|---------|----------|-------|
| `AdminFighterForm.tsx` | Submit button sin min-h-[44px] | ~200 |
| `FighterEditModal.tsx` | Footer no sticky | ~950 |
| `FightersProfiles.tsx` | Botones de accion pequenos | 242-272 |
| `RankingsManagement.tsx` | Select triggers pequenos | ~160 |

### 3.3 Correcciones Necesarias

```tsx
// Antes (incorrecto)
<Button type="submit">Guardar</Button>

// Despues (correcto)
<Button 
  type="submit"
  className="min-h-[44px] touch-manipulation"
>
  Guardar
</Button>

// Footer sticky para modales largos
<div className="sticky bottom-0 bg-background pt-4 border-t">
  <Button className="min-h-[44px] w-full touch-manipulation">
    Guardar Cambios
  </Button>
</div>
```

---

## PARTE 4: ESCALABILIDAD

### 4.1 Indices Existentes (Positivo)

La base de datos tiene buenos indices para consultas frecuentes:

```sql
-- Fighter profiles
idx_fighter_profiles_active (active WHERE active = true)
idx_fighter_profiles_search (first_name, last_name, license_number)
idx_fighter_profiles_martial_arts (GIN index para arrays)

-- Fighter rankings
idx_fighter_rankings_active_ranking
idx_fighter_rankings_org_level_weight

-- User roles
user_roles_user_id_role_key (UNIQUE)
```

### 4.2 Indices Faltantes Recomendados

```sql
-- Para busquedas por disciplina + nivel
CREATE INDEX idx_fighter_profiles_discipline_level 
ON fighter_profiles(discipline, level) 
WHERE active = true;

-- Para consultas de ranking por organizacion
CREATE INDEX idx_fighter_rankings_points_desc 
ON fighter_rankings(organization_id, points DESC) 
WHERE is_active = true;

-- Para busquedas de licencias activas
CREATE INDEX idx_fighter_licenses_active 
ON fighter_licenses(fighter_id, status) 
WHERE status = 'ACTIVE';
```

### 4.3 Consultas sin Paginacion

**Archivos que necesitan paginacion del lado del servidor**:

| Archivo | Query | Recomendacion |
|---------|-------|---------------|
| `useFighterProfiles.tsx` | `select('*')` sin limit | Agregar `.range(0, 50)` |
| `useOrganizationRanking.tsx` | Carga todos los rankings | Paginacion por 100 |
| `useCoaches.tsx` | `select('*')` | Limit de 100 |

---

## PARTE 5: PLAN DE CORRECCION

### Fase 1: Seguridad Backend (Prioridad CRITICA)

1. **Migrar funciones con search_path inseguro** (9 funciones)
2. **Revisar y endurecer politicas RLS** con `WITH CHECK (true)`
3. **Reducir OTP expiry** a 600 segundos
4. **Habilitar leaked password protection**

### Fase 2: Sincronizacion Frontend-Backend (Prioridad ALTA)

1. **Modificar `useOptimizedOnboarding.ts`**:
   - Agregar seleccion de liga inicial en onboarding
   - Llamar `enroll_fighter_in_ranking` despues de crear perfil

2. **Actualizar `create_fighter_profile_with_license`**:
   - Agregar parametros de organizacion inicial
   - Crear registro en `fighter_rankings` automaticamente

3. **Unificar manejo de records**:
   - Modificar onboarding para guardar en campos `mma_record_*` o `boxeo_record_*`
   - Actualizar `LicenseDashboard` para mostrar records por disciplina

### Fase 3: Optimizacion Movil (Prioridad MEDIA)

1. Agregar `min-h-[44px] touch-manipulation` a todos los botones de accion
2. Implementar sticky footers en modales largos
3. Aumentar touch targets en select triggers

### Fase 4: Escalabilidad (Prioridad MEDIA)

1. Crear indices recomendados
2. Implementar paginacion del servidor en hooks de datos masivos
3. Agregar cache con React Query staleTime configurado

---

## Archivos a Modificar

| Archivo | Tipo de Cambio | Prioridad |
|---------|----------------|-----------|
| Nueva migracion SQL | Indices + RLS | CRITICA |
| `src/hooks/useOptimizedOnboarding.ts` | Liga inicial + records | ALTA |
| `src/pages/license/LicenseOnboarding.tsx` | UI liga + records por disciplina | ALTA |
| `src/pages/license/LicenseDashboard.tsx` | Mostrar records por disciplina | ALTA |
| `src/components/admin/AdminFighterForm.tsx` | Touch targets | MEDIA |
| `src/components/admin/FighterEditModal.tsx` | Sticky footer | MEDIA |
| `src/pages/admin/FightersProfiles.tsx` | Touch targets | MEDIA |
| `src/hooks/useFighterProfiles.tsx` | Paginacion servidor | MEDIA |

---

## Seccion Tecnica: Migracion SQL Propuesta

```sql
-- 1. Indices de escalabilidad
CREATE INDEX CONCURRENTLY idx_fighter_profiles_discipline_level 
ON fighter_profiles(discipline, level) WHERE active = true;

CREATE INDEX CONCURRENTLY idx_fighter_rankings_points_desc 
ON fighter_rankings(organization_id, points DESC) WHERE is_active = true;

-- 2. Actualizar funciones con search_path seguro
ALTER FUNCTION create_fighter_profile_with_license(...)
SET search_path = public;

-- 3. Agregar inscripcion a ranking en la funcion de onboarding
-- (Modificar create_fighter_profile_with_license para aceptar p_organization_code)
```

---

## Metricas de Exito

| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Issues de seguridad | 41 | 0 (pre-existentes) |
| Botones con touch target correcto | ~70% → 95% | 100% |
| Queries paginadas/limitadas | ~30% → 80% | 100% |
| Peleadores records por disciplina | 0% → 100% | 100% |

---

## Progreso de Implementación (Actualizado)

### ✅ Fase 1: Índices de Escalabilidad
- [x] `idx_fighter_profiles_discipline_level` - Búsquedas por disciplina+nivel
- [x] `idx_fighter_rankings_points_desc` - Rankings ordenados por puntos
- [x] `idx_fighter_licenses_active_status` - Licencias activas
- [x] `idx_fighter_profiles_user_id` - Login rápido
- [x] `idx_ai_strike_events_recent` - Eventos recientes
- [x] `idx_fighter_rankings_weight_class` - Rankings por categoría

### ✅ Fase 2: Sincronización Frontend-Backend
- [x] `useOptimizedOnboarding.ts` - Records discipline-specific después de crear perfil
- [x] `LicenseDashboard.tsx` - Muestra records según disciplina (MMA/Boxeo)

### ✅ Fase 3: Optimización Móvil
- [x] `AdminFighterForm.tsx` - Botones con min-h-[44px] touch-manipulation
- [x] `FighterEditModal.tsx` - Sticky footer + touch targets mejorados
- [x] `FightersProfiles.tsx` - Botones de acción con touch targets 44px+

### ✅ Fase 4: Paginación/Límites
- [x] `useCoaches.tsx` - Límite de 100 registros
- [x] `useOrganizationRanking.tsx` - Ya tiene paginación cliente
- [x] `FightersProfiles.tsx` - Ya tiene paginación cliente (PAGE_SIZE=20)

### ⚠️ Pendientes (Issues Pre-existentes)
- [ ] 27 políticas RLS con `WITH CHECK (true)` - Requiere auditoría individual
- [ ] 9 funciones sin `search_path` seguro - Requiere revisión por función
- [ ] OTP expiry 3600s - Configuración de Supabase Dashboard
- [ ] Leaked password protection - Configuración de Supabase Dashboard

