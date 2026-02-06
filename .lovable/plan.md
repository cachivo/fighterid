
# Auditoría Completa del Sistema Fighter ID

## Resumen Ejecutivo

Se identificaron **6 problemas críticos** y **4 mejoras recomendadas** en el sistema de rankings, perfiles y sincronización de datos.

---

## Hallazgos Críticos

### 1. Inconsistencia de Niveles (Mayúsculas/Minúsculas)

**Problema**: Existen peleadores con nivel "AMATEUR" y otros con "Amateur", causando fragmentación de datos.

| Nivel | Cantidad |
|-------|----------|
| Amateur | 43 |
| AMATEUR | 1 |
| Profesional | 9 |
| Semi-profesional | 9 |

**Impacto**: Los filtros de ranking no agrupan correctamente a todos los peleadores del mismo nivel.

**Solución SQL**:
```sql
UPDATE fighter_profiles 
SET level = 'Amateur' 
WHERE level = 'AMATEUR';

UPDATE fighter_rankings 
SET level = 'Amateur' 
WHERE level = 'AMATEUR';
```

---

### 2. No Hay Recalculación Automática de Puntos

**Problema**: Cuando un administrador actualiza el récord de un peleador (mma_record_wins, boxeo_record_wins, etc.), los puntos en `fighter_rankings` NO se actualizan automáticamente.

**Flujo actual**:
```text
Admin edita récord en FighterEditModal
         ↓
admin_update_fighter_profile() actualiza fighter_profiles
         ↓
sync_fighter_profile_to_rankings() sincroniza level/weight_class
         ↓
[FALTA] Trigger para recalcular puntos
```

**Solución**: Crear trigger que recalcule puntos cuando cambien los récords.

---

### 3. BDG Pro Boxing Sin Puntos

**Estado actual**:
| Organización | Nivel | Peleadores | Con 0 pts | Promedio |
|--------------|-------|------------|-----------|----------|
| BDG_PRO | Semi-profesional | 1 | 1 | 0.0 |
| HHF_AMATEUR | Amateur | 4 | 0 | 5.8 |
| HHF_AMATEUR | AMATEUR | 1 | 0 | 8.0 |
| UCC_MMA | Amateur | 39 | 9 | 3.5 |
| UCC_MMA | Profesional | 9 | 2 | 12.7 |
| UCC_MMA | Semi-profesional | 7 | 2 | 6.0 |

---

### 4. 14 Rankings con 0 Puntos

**Distribución**:
- UCC_MMA Amateur: 9 peleadores
- UCC_MMA Profesional: 2 peleadores  
- UCC_MMA Semi-profesional: 2 peleadores
- BDG_PRO: 1 peleador

**Causa**: Peleadores sin récord registrado o récord solo en campos legacy.

---

### 5. Sin Historial de Ajustes de Puntos

La tabla `ranking_point_adjustments` está vacía (0 registros), lo que indica que:
- El sistema de ajuste manual nunca ha sido utilizado
- Los puntos actuales fueron migrados manualmente, no a través del flujo de auditoría

---

### 6. Ausencia de Triggers en fights_history

No hay triggers en la tabla `fights_history` para actualizar automáticamente récords y puntos cuando se registra una pelea.

---

## Sistema de Puntos Verificado

La fórmula de puntos está correctamente implementada:

```text
Puntos = (Victorias × 3) + (Empates × 1) - (Derrotas × 1)
```

**Verificación de muestra**:
| Peleador | Récord | Puntos Actuales | Esperado |
|----------|--------|-----------------|----------|
| Kevin Calona | 6-3-0 | 15 | 15 |
| Aaron Irias | 3-1-0 | 8 | 8 |
| Walter Luna | 30-17-1 | 74 | 74 |
| Exequiel Luna | 8-3-1 | 22 | 22 |

---

## Funciones Críticas del Sistema

### Funciones Existentes (Operativas)

| Función | Propósito | Estado |
|---------|-----------|--------|
| `admin_update_fighter_profile` | Actualiza perfil completo | OK |
| `user_update_fighter_profile` | Usuario edita su perfil | OK |
| `sync_fighter_profile_to_rankings` | Sincroniza level/weight_class | OK |
| `adjust_ranking_points` | Ajuste manual de puntos | OK |
| `enroll_fighter_in_ranking` | Inscribir en liga | OK |

### Funciones Faltantes

| Función | Propósito |
|---------|-----------|
| `recalculate_ranking_points` | Recalcular puntos desde récord |
| `sync_record_to_rankings` | Trigger para sincronizar puntos |

---

## Triggers Activos en fighter_profiles

| Trigger | Función | Propósito |
|---------|---------|-----------|
| audit_fighter_profile_trigger | audit_fighter_profile_changes | Auditoría de cambios |
| set_fighter_license_trigger | set_fighter_license | Auto-asignar licencia |
| sync_profile_to_rankings_trigger | sync_fighter_profile_to_rankings | Sync level/weight |
| trigger_update_completion | update_profile_completion | Score de completitud |

---

## Arquitectura de Datos

```text
┌─────────────────────┐      ┌────────────────────────┐
│   fighter_profiles  │      │   ranking_organizations │
│   ───────────────── │      │   ────────────────────  │
│   id                │      │   id                    │
│   discipline        │─────▶│   discipline            │
│   level             │      │   allowed_levels[]      │
│   weight_class      │      │   code (UCC_MMA, etc)   │
│   mma_record_*      │      └────────────────────────┘
│   boxeo_record_*    │               │
│   record_*  (legacy)│               │
└─────────────────────┘               │
         │                            │
         │      ┌─────────────────────┘
         │      │
         ▼      ▼
┌─────────────────────────────────────────┐
│           fighter_rankings              │
│   ─────────────────────────────────     │
│   fighter_id  →  fighter_profiles.id    │
│   organization_id  →  ranking_orgs.id   │
│   level                                 │
│   weight_class                          │
│   points  ← [NECESITA AUTO-SYNC]        │
│   is_active                             │
└─────────────────────────────────────────┘
```

---

## Plan de Correcciones

### Fase 1: Correcciones Inmediatas (SQL Manual)

1. **Normalizar niveles**:
```sql
UPDATE fighter_profiles SET level = 'Amateur' WHERE level = 'AMATEUR';
UPDATE fighter_rankings SET level = 'Amateur' WHERE level = 'AMATEUR';
```

2. **Recalcular puntos BDG_PRO**:
```sql
UPDATE fighter_rankings fr
SET points = (COALESCE(fp.boxeo_record_wins, 0) * 3) 
           + (COALESCE(fp.boxeo_record_draws, 0) * 1) 
           - (COALESCE(fp.boxeo_record_losses, 0) * 1)
FROM fighter_profiles fp, ranking_organizations ro
WHERE fr.fighter_id = fp.id 
  AND fr.organization_id = ro.id
  AND ro.code = 'BDG_PRO'
  AND fr.is_active = true;
```

### Fase 2: Automatización (Migración)

Crear trigger para recalcular puntos automáticamente cuando se actualiza el récord de un peleador.

### Fase 3: Validación

- Agregar check constraint para normalizar niveles
- Implementar logging de cambios de puntos

---

## Resumen de Integridad de Datos

| Métrica | Valor |
|---------|-------|
| Peleadores activos | 62 |
| Rankings activos | 61 |
| Rankings con 0 puntos | 14 (23%) |
| Ajustes de puntos registrados | 0 |
| Peleadores Boxeo | 7 |
| Peleadores MMA | 55 |

---

## Secciones Técnicas

### RPC admin_update_fighter_profile

La función actualiza campos en `fighter_profiles` y sincroniza `level` y `weight_class` a `fighter_rankings`, pero **NO sincroniza puntos**.

### Campos de Récord por Disciplina

- `mma_record_wins/losses/draws` - Para peleadores MMA
- `boxeo_record_wins/losses/draws` - Para peleadores Boxeo
- `record_wins/losses/draws` - Legacy (deprecado)

### Hook useOrganizationRanking

Correctamente implementado con fallback de récord:
1. Intenta usar campos específicos (mma_record_*, boxeo_record_*)
2. Si están vacíos, usa campos legacy (record_*)

---

## Acciones Requeridas del Usuario

1. Ejecutar SQL de normalización de niveles
2. Ejecutar SQL de recálculo de puntos para BDG_PRO
3. Aprobar migración para crear trigger de sincronización automática
