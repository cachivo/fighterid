
# Plan: Sincronización Completa de Disciplina + Corrección Visual Final

## DIAGNÓSTICO DE LA AUDITORÍA

### Hallazgo Crítico: Cambio de Disciplina No Sincronizado

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      INCOHERENCIA DETECTADA                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PELEADOR          │ PERFIL      │ RANKING ACTUAL  │ ESPERADO          │
│  ─────────────────────────────────────────────────────────────────────  │
│  Moises Cardenas   │ Boxeo       │ UCC_MMA (MMA)   │ BDG_PRO o HHF     │
│  Willis Yang       │ Boxeo       │ UCC_MMA (MMA)   │ BDG_PRO o HHF     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Causa Raíz

La función `admin_update_fighter_profile` sincroniza:
- ✅ `level` → fighter_rankings
- ✅ `weight_class` → fighter_rankings  
- ❌ `discipline` → **NO SINCRONIZA** (rankings incompatibles permanecen activos)

### Organizaciones Disponibles

| Código | Disciplina | Niveles Permitidos |
|--------|------------|-------------------|
| UCC_MMA | MMA | Amateur, Semi-profesional, Profesional |
| BDG_PRO | Boxeo | Profesional, Semi-profesional |
| HHF_AMATEUR | Boxeo | Amateur |

---

## SOLUCIÓN PROPUESTA

### Parte 1: Actualizar RPC para Sincronizar Disciplina

Modificar `admin_update_fighter_profile` para:

1. **Detectar cambio de disciplina**
2. **Desactivar rankings incompatibles** (donde la disciplina de la organización no coincide)
3. **Inscribir automáticamente** en la organización correcta según disciplina + nivel

```sql
-- Nueva lógica cuando cambia discipline:
IF p_profile_data ? 'discipline' THEN
  -- 1. Obtener nueva disciplina y nivel actual
  v_new_discipline := p_profile_data->>'discipline';
  SELECT level INTO v_current_level FROM fighter_profiles WHERE id = p_fighter_id;
  
  -- 2. Desactivar rankings de organizaciones con disciplina diferente
  UPDATE fighter_rankings fr
  SET is_active = false, updated_at = now()
  FROM ranking_organizations ro
  WHERE fr.organization_id = ro.id
    AND fr.fighter_id = p_fighter_id
    AND fr.is_active = true
    AND ro.discipline != v_new_discipline;
  
  -- 3. Inscribir automáticamente en organización correcta
  -- MMA → UCC_MMA
  -- Boxeo Amateur → HHF_AMATEUR
  -- Boxeo Pro/Semi → BDG_PRO
  v_target_org := CASE
    WHEN v_new_discipline = 'MMA' THEN 'UCC_MMA'
    WHEN v_new_discipline = 'Boxeo' AND v_current_level = 'Amateur' THEN 'HHF_AMATEUR'
    WHEN v_new_discipline = 'Boxeo' THEN 'BDG_PRO'
    ELSE NULL
  END;
  
  -- 4. Insertar si no existe ranking activo en la nueva org
  IF v_target_org IS NOT NULL THEN
    INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points)
    SELECT p_fighter_id, ro.id, v_current_level, fp.weight_class, 0
    FROM ranking_organizations ro, fighter_profiles fp
    WHERE ro.code = v_target_org AND fp.id = p_fighter_id
    ON CONFLICT DO NOTHING;
  END IF;
END IF;
```

### Parte 2: Corregir Datos Existentes (One-time fix)

```sql
-- Desactivar rankings incompatibles para Moises y Willis
UPDATE fighter_rankings fr
SET is_active = false, updated_at = now()
FROM fighter_profiles fp, ranking_organizations ro
WHERE fr.fighter_id = fp.id
  AND fr.organization_id = ro.id
  AND fr.is_active = true
  AND fp.discipline::text != ro.discipline;

-- Inscribir en organizaciones correctas según disciplina + nivel
INSERT INTO fighter_rankings (fighter_id, organization_id, weight_class, level, points)
SELECT 
  fp.id,
  ro.id,
  fp.weight_class,
  fp.level,
  0
FROM fighter_profiles fp
CROSS JOIN ranking_organizations ro
WHERE fp.discipline::text = ro.discipline
  AND fp.level = ANY(ro.allowed_levels)
  AND NOT EXISTS (
    SELECT 1 FROM fighter_rankings fr 
    WHERE fr.fighter_id = fp.id 
    AND fr.organization_id = ro.id 
    AND fr.is_active = true
  )
  -- Solo para peleadores que tienen disciplina pero no ranking correcto
  AND fp.discipline IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM fighter_rankings fr2
    JOIN ranking_organizations ro2 ON fr2.organization_id = ro2.id
    WHERE fr2.fighter_id = fp.id AND ro2.discipline != fp.discipline::text
  );
```

### Parte 3: Corregir Layout de Tarjetas (Altura Fija Real)

El fix anterior usó `h-[3.5rem]` pero no es suficiente para nombres largos. Necesitamos:

```tsx
// ANTES (insuficiente):
<div className="h-[3.5rem] flex flex-col justify-start overflow-hidden">

// DESPUÉS (solución robusta):
<div className="h-14 flex flex-col justify-center">
  <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
    {fighter.first_name} {fighter.last_name}
  </CardTitle>
  <p className="text-sm text-muted-foreground truncate mt-0.5">
    {fighter.nickname ? `"${fighter.nickname}"` : '\u00A0'}
  </p>
</div>
```

**Cambios clave:**
- `h-14` (56px) - altura fija estandarizada
- `line-clamp-1` - limita nombre a UNA sola línea (trunca con ...)
- `text-base` en lugar de `text-lg` - reduce tamaño para mejor fit
- `justify-center` - centra verticalmente cuando hay poco texto

---

## ARCHIVOS A MODIFICAR

| Archivo | Cambio | Criticidad |
|---------|--------|------------|
| **Nueva migración SQL** | Actualizar RPC + fix de datos existentes | CRÍTICA |
| `src/pages/admin/FightersProfiles.tsx` | Aplicar altura fija h-14 y line-clamp-1 | ALTA |

---

## FLUJO VISUAL POST-IMPLEMENTACIÓN

```text
┌─────────────────────────────────────────────────────────────────────────┐
│     ANTES DE CAMBIAR DISCIPLINA (Perfil: MMA, Ranking: UCC_MMA)        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  fighter_profiles          fighter_rankings                             │
│  ┌─────────────────┐      ┌─────────────────────────────┐               │
│  │ discipline: MMA │      │ UCC_MMA (MMA) - is_active: ✓ │              │
│  │ level: Amateur  │      │ points: 100                  │              │
│  └─────────────────┘      └─────────────────────────────┘               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                              ▼ Admin cambia disciplina a Boxeo ▼

┌─────────────────────────────────────────────────────────────────────────┐
│    DESPUÉS DE CAMBIAR DISCIPLINA (Perfil: Boxeo, Ranking: HHF_AMATEUR) │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  fighter_profiles          fighter_rankings                             │
│  ┌───────────────────┐    ┌─────────────────────────────┐               │
│  │ discipline: Boxeo │    │ UCC_MMA (MMA) - is_active: ✗ │ ← Desactivado│
│  │ level: Amateur    │    │ points: 100 (preservado)    │               │
│  └───────────────────┘    ├─────────────────────────────┤               │
│                           │ HHF_AMATEUR (Boxeo) - ✓     │ ← Nuevo       │
│                           │ points: 0 (inicio)          │               │
│                           └─────────────────────────────┘               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## VERIFICACIÓN POST-IMPLEMENTACIÓN

### Test 1: Sincronización de Disciplina
1. Abrir perfil de **Moises Cardenas** en Perfiles de Peleadores
2. Verificar que ahora aparece en **BDG Pro** o **HHF Amateur** (según su nivel)
3. Verificar que YA NO aparece en **UCC MMA**

### Test 2: Cambio de Disciplina en Vivo
1. Seleccionar un peleador con disciplina MMA
2. Cambiar disciplina a Boxeo desde tab Combate
3. Verificar automáticamente:
   - Ranking de MMA se desactiva
   - Se crea ranking en organización de Boxeo correcta

### Test 3: Uniformidad Visual
1. Verificar que TODAS las tarjetas tienen exactamente la misma altura
2. Verificar que nombres largos se truncan con "..."

### Query de Validación
```sql
-- Debe devolver 0 filas si todo está coherente
SELECT fp.first_name, fp.discipline::text, ro.discipline as ranking_org
FROM fighter_profiles fp
JOIN fighter_rankings fr ON fp.id = fr.fighter_id AND fr.is_active = true
JOIN ranking_organizations ro ON fr.organization_id = ro.id
WHERE fp.discipline::text != ro.discipline;
```

---

## RESUMEN DE CAMBIOS

1. ✅ Sincronización automática de disciplina (nueva funcionalidad)
2. ✅ Desactivación de rankings incompatibles al cambiar disciplina
3. ✅ Inscripción automática en organización correcta
4. ✅ Fix de datos existentes (Moises, Willis)
5. ✅ Layout uniforme con altura fija y truncamiento
