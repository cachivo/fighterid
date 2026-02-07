
# Diagnóstico y Corrección: Error de Mateo Starozze en Ranking Equivocado

## Diagnóstico del Error

### Datos Encontrados

| Campo | Valor |
|-------|-------|
| **Peleador** | Mateo Starozze |
| **Perfil** | Disciplina: Boxeo, Nivel: Amateur |
| **Inscripción actual** | BDG_PRO (Boxeo Profesional) |
| **Inscripción correcta** | HHF_AMATEUR (Boxeo Amateur) |

### Causa Raíz

La función `admin_update_fighter_profile` tiene un **defecto de diseño**:

```sql
-- PROBLEMA: Actualiza nivel en TODAS las inscripciones sin validar compatibilidad
UPDATE fighter_rankings
SET level = COALESCE(v_level, level)
WHERE fighter_id = p_fighter_id AND is_active = true;
```

**Flujo que causó el error:**
1. Mateo fue creado inicialmente como Profesional/Semi de Boxeo
2. Se inscribió automáticamente en BDG_PRO (correcto para ese momento)
3. Alguien cambió su nivel a "Amateur" desde el panel de admin
4. La función actualizó su ranking en BDG_PRO con nivel "Amateur"
5. BDG_PRO **no permite Amateur** (solo Profesional y Semi-profesional)
6. Mateo **debería haberse movido** a HHF_AMATEUR

### Configuración de Organizaciones de Boxeo

| Organización | Niveles Permitidos |
|--------------|-------------------|
| BDG_PRO | Profesional, Semi-profesional |
| HHF_AMATEUR | Amateur |

---

## Solución en Dos Fases

### Fase 1: Corrección Inmediata de Datos

Migración SQL para mover a Mateo a la organización correcta:

```sql
-- 1. Desactivar inscripción incorrecta en BDG_PRO
UPDATE fighter_rankings
SET is_active = false, updated_at = now()
WHERE fighter_id = '55a30550-b731-4248-99f5-50c3d874dfd2'
  AND organization_id = (SELECT id FROM ranking_organizations WHERE code = 'BDG_PRO');

-- 2. Inscribir en HHF_AMATEUR (organización correcta para Amateur de Boxeo)
INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
SELECT 
  '55a30550-b731-4248-99f5-50c3d874dfd2',
  ro.id,
  'Amateur',
  'Peso Ligero',
  4, -- Mantener sus puntos actuales
  true
FROM ranking_organizations ro
WHERE ro.code = 'HHF_AMATEUR'
ON CONFLICT (fighter_id, organization_id) 
DO UPDATE SET is_active = true, level = 'Amateur', points = 4;
```

### Fase 2: Mejora del Sistema

Actualizar `admin_update_fighter_profile` para incluir **migración automática** cuando un peleador de Boxeo cambia de nivel:

```sql
-- Nueva lógica: Migrar peleadores de Boxeo entre organizaciones
IF v_discipline = 'Boxeo' AND v_level IS NOT NULL THEN
  -- Si cambia a Amateur, mover a HHF_AMATEUR
  IF v_level = 'Amateur' THEN
    -- Desactivar de BDG_PRO
    UPDATE fighter_rankings fr
    SET is_active = false
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id
      AND fr.organization_id = ro.id
      AND ro.code = 'BDG_PRO';
      
    -- Activar/crear en HHF_AMATEUR
    INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
    SELECT p_fighter_id, ro.id, 'Amateur', COALESCE(v_weight_class, 'Peso Ligero'), 0, true
    FROM ranking_organizations ro WHERE ro.code = 'HHF_AMATEUR'
    ON CONFLICT (fighter_id, organization_id) 
    DO UPDATE SET is_active = true, level = 'Amateur';
  
  -- Si cambia a Pro/Semi, mover a BDG_PRO  
  ELSIF v_level IN ('Profesional', 'Semi-profesional') THEN
    -- Desactivar de HHF_AMATEUR
    UPDATE fighter_rankings fr
    SET is_active = false
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id
      AND fr.organization_id = ro.id
      AND ro.code = 'HHF_AMATEUR';
      
    -- Activar/crear en BDG_PRO
    INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
    SELECT p_fighter_id, ro.id, v_level, COALESCE(v_weight_class, 'Peso Ligero'), 0, true
    FROM ranking_organizations ro WHERE ro.code = 'BDG_PRO'
    ON CONFLICT (fighter_id, organization_id) 
    DO UPDATE SET is_active = true, level = v_level;
  END IF;
END IF;
```

---

## Flujo Corregido

```text
ANTES (defectuoso):
+------------------+     +------------------+     +------------------+
| Admin cambia     |     | Actualiza nivel  |     | Peleador queda   |
| nivel a Amateur  | --> | en BDG_PRO       | --> | en organización  |
|                  |     | (sin validar)    |     | INCORRECTA       |
+------------------+     +------------------+     +------------------+

DESPUÉS (correcto):
+------------------+     +------------------+     +------------------+
| Admin cambia     |     | Detecta cambio   |     | Migra a          |
| nivel a Amateur  | --> | de nivel Boxeo   | --> | HHF_AMATEUR      |
|                  |     |                  |     | automáticamente  |
+------------------+     +------------------+     +------------------+
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Corrección de datos de Mateo + mejora de RPC |

---

## Verificación Post-Implementación

1. Verificar que Mateo ya no aparece en BDG_PRO
2. Verificar que Mateo aparece en HHF_AMATEUR con sus 4 puntos
3. Probar cambiar nivel de otro peleador Amateur → Pro y viceversa
4. Confirmar que la migración automática funciona

---

## Resumen Técnico

- **Error**: La función RPC actualiza niveles sin validar compatibilidad con la organización
- **Afectado**: 1 peleador (Mateo Starozze)
- **Solución**: Corrección de datos + lógica de migración automática para Boxeo
- **Impacto**: Evita futuros errores de inscripción incorrecta
