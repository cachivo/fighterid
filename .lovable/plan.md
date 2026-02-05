
# Auditoría Crítica: Sincronización Bidireccional + Uniformidad Visual

## HALLAZGOS DE LA AUDITORÍA

### PROBLEMA CRÍTICO 1: Sincronización Unidireccional (INCOMPLETA)

La sincronización actual es de **una sola vía**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO ACTUAL DE SINCRONIZACIÓN                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐         ┌──────────────────────┐              │
│  │  fighter_profiles    │  ────►  │  fighter_rankings    │              │
│  │  (Perfil del luchador)│   ✅   │  (Ranking)           │              │
│  └──────────────────────┘         └──────────────────────┘              │
│                                                                         │
│  Funciona via: admin_update_fighter_profile (RPC)                       │
│                                                                         │
│  ┌──────────────────────┐         ┌──────────────────────┐              │
│  │  fighter_rankings    │  ────►  │  fighter_profiles    │              │
│  │  (Ranking)           │   ❌    │  (Perfil del luchador)│              │
│  └──────────────────────┘         └──────────────────────┘              │
│                                                                         │
│  NO EXISTE: update_fighter_ranking_level NO sincroniza                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Código de la función `update_fighter_ranking_level` actual:

```sql
-- SOLO actualiza fighter_rankings, NO toca fighter_profiles
UPDATE public.fighter_rankings
SET level = p_new_level
WHERE id = p_ranking_id;
-- ❌ Falta: UPDATE fighter_profiles SET level = p_new_level WHERE id = fighter_id
```

### Matriz de Puntos de Edición Auditada

| Módulo | Acción | Tabla Primaria | ¿Sync a Profiles? | ¿Sync a Rankings? |
|--------|--------|----------------|-------------------|-------------------|
| **Perfiles de Peleadores** → Editar (Tab Combate) | Cambiar nivel | fighter_profiles | N/A | ✅ Sí |
| **Perfiles de Peleadores** → Editar (Tab Combate) | Cambiar peso | fighter_profiles | N/A | ✅ Sí |
| **Perfiles de Peleadores** → Editar (Tab Ligas) | Cambiar nivel | fighter_rankings | ❌ NO | N/A |
| **Gestión de Rankings** → Ajustar Puntos | Solo puntos | fighter_rankings | N/A | N/A |
| **Gestión de Rankings** → Agregar Peleador | Inscribir | fighter_rankings | ❌ NO | N/A |

---

### PROBLEMA 2: Layout de Tarjetas No Uniforme

**Código actual (líneas 232-239):**
```tsx
<div className="min-h-[3rem]">  // ❌ min-h permite expansión
  <CardTitle className="text-lg leading-tight">
    {fighter.first_name} {fighter.last_name}  // ❌ Sin límite de líneas
  </CardTitle>
  <p className="text-sm text-muted-foreground h-5">
    {fighter.nickname ? `"${fighter.nickname}"` : '\u00A0'}
  </p>
</div>
```

**Problema visual identificado:**

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Dayan           │  │ Eduardo Enrique │  │ Erick           │
│ Mercado         │  │ Godoy           │  │ Tzoc            │
│                 │  │ Velasquez       │  │ "Super zod"     │
│ [Completitud]   │  │                 │  │                 │
├─────────────────┤  │ [Completitud]   │  │ [Completitud]   │
│ Récord: 4-3-0   │  ├─────────────────┤  ├─────────────────┤
│ Peso: 185 lbs   │  │ Récord: 0-1-0   │  │ Récord: 3-1-0   │
└─────────────────┘  │ Peso: 125 lbs   │  │ Peso: 155 lbs   │
     ↑               └─────────────────┘  └─────────────────┘
   Corto                  ↑ Más alto           ↑ Normal
                     (4 palabras = 3 líneas)
```

---

## SOLUCIÓN PROPUESTA

### Parte 1: Sincronización Bidireccional Completa

**Modificar la función `update_fighter_ranking_level` para sincronizar INVERSAMENTE:**

```sql
CREATE OR REPLACE FUNCTION public.update_fighter_ranking_level(
  p_ranking_id uuid, 
  p_new_level text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fighter_id UUID;
  v_organization_id UUID;
  v_allowed_levels TEXT[];
BEGIN
  -- [Validaciones existentes...]
  
  -- Obtener fighter_id del ranking
  SELECT fighter_id, organization_id INTO v_fighter_id, v_organization_id
  FROM public.fighter_rankings
  WHERE id = p_ranking_id;

  -- Actualizar ranking
  UPDATE public.fighter_rankings
  SET level = p_new_level
  WHERE id = p_ranking_id;

  -- ✅ NUEVO: Sincronizar a fighter_profiles
  UPDATE public.fighter_profiles
  SET level = p_new_level, updated_at = now()
  WHERE id = v_fighter_id;
END;
$$;
```

### Parte 2: Layout Uniforme con Altura Fija

**Nuevo código para tarjetas:**

```tsx
<div className="h-[3.5rem] flex flex-col justify-start overflow-hidden">
  <CardTitle className="text-lg leading-tight line-clamp-2">
    {fighter.first_name} {fighter.last_name}
  </CardTitle>
  <p className="text-sm text-muted-foreground truncate">
    {fighter.nickname ? `"${fighter.nickname}"` : '\u00A0'}
  </p>
</div>
```

**Cambios clave:**
- `h-[3.5rem]` en lugar de `min-h-[3rem]` - altura FIJA
- `line-clamp-2` - limita nombre a máximo 2 líneas
- `truncate` - corta apodo con "..." si es muy largo
- `overflow-hidden` - previene desbordamiento

**Resultado esperado:**

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Dayan           │  │ Eduardo Enrique │  │ Erick           │
│ Mercado         │  │ Godoy Velas...  │  │ Tzoc            │
│                 │  │                 │  │ "Super zod"     │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ [Completitud]   │  │ [Completitud]   │  │ [Completitud]   │
│ Récord: 4-3-0   │  │ Récord: 0-1-0   │  │ Récord: 3-1-0   │
│ Peso: 185 lbs   │  │ Peso: 125 lbs   │  │ Peso: 155 lbs   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
      ↑                    ↑                    ↑
   UNIFORMES - Misma altura en todas las tarjetas
```

---

## ARCHIVOS A MODIFICAR

| Archivo | Cambio | Criticidad |
|---------|--------|------------|
| **Nueva migración SQL** | Modificar `update_fighter_ranking_level` para sync bidireccional | CRÍTICA |
| `src/pages/admin/FightersProfiles.tsx` | Aplicar altura fija y line-clamp al área de nombre | ALTA |
| `src/hooks/useFighterRankingMembership.tsx` | Invalidar query `fighters` tras cambio de nivel | MEDIA |

---

## VERIFICACIÓN POST-IMPLEMENTACIÓN

### Test 1: Sincronización Bidireccional
1. Ir a **Perfiles de Peleadores** → Abrir peleador → Pestaña **Ligas**
2. Hacer clic en "Nivel" y cambiar de Amateur a Semi-profesional
3. Verificar que en **fighter_profiles.level** también cambió
4. Verificar que en la tarjeta del peleador muestra el nuevo nivel

### Test 2: Uniformidad Visual
1. Verificar que todas las tarjetas tienen la misma altura
2. Verificar que nombres largos se truncan correctamente con "..."
3. Verificar que apodos largos se truncan correctamente

---

## SECCIÓN TÉCNICA: Detalles de Migración SQL

```sql
-- Actualizar función RPC para sincronización bidireccional
DROP FUNCTION IF EXISTS public.update_fighter_ranking_level(uuid, text);

CREATE FUNCTION public.update_fighter_ranking_level(
  p_ranking_id uuid,
  p_new_level text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_fighter_id UUID;
  v_organization_id UUID;
  v_allowed_levels TEXT[];
BEGIN
  -- Verificar admin
  SELECT is_admin INTO v_is_admin FROM public.app_user WHERE auth_user_id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update ranking levels';
  END IF;

  -- Obtener fighter_id y organization_id
  SELECT fighter_id, organization_id INTO v_fighter_id, v_organization_id
  FROM public.fighter_rankings
  WHERE id = p_ranking_id;

  IF v_fighter_id IS NULL THEN
    RAISE EXCEPTION 'Ranking entry not found: %', p_ranking_id;
  END IF;

  -- Validar nivel permitido
  SELECT allowed_levels INTO v_allowed_levels
  FROM public.ranking_organizations
  WHERE id = v_organization_id;

  IF NOT (p_new_level = ANY(v_allowed_levels)) THEN
    RAISE EXCEPTION 'Level "%" is not allowed for this organization', p_new_level;
  END IF;

  -- Actualizar ranking
  UPDATE public.fighter_rankings
  SET level = p_new_level, updated_at = now()
  WHERE id = p_ranking_id;

  -- ✅ SINCRONIZACIÓN BIDIRECCIONAL: Actualizar perfil
  UPDATE public.fighter_profiles
  SET level = p_new_level, updated_at = now()
  WHERE id = v_fighter_id;
END;
$$;
```

---

## RESUMEN DE CAMBIOS

1. ✅ Sincronización Rankings → Profiles (nueva)
2. ✅ Mantener sincronización Profiles → Rankings (existente)  
3. ✅ Altura fija para tarjetas de peleadores
4. ✅ Truncamiento de nombres/apodos largos
5. ✅ Invalidación de cache adicional en hooks
