
# Auditoría de Sincronización: Admin Panel ↔ Rankings

## PROBLEMA CRÍTICO CONFIRMADO

He encontrado evidencia directa de la desincronización que reportas:

### Caso Real Detectado: Erick Tzoc

```text
┌─────────────────────────────────────────────────────────────────┐
│ FIGHTER_PROFILES (Editado desde Admin)                         │
│ - level: "Semi-profesional" ✅ (Actualizado correctamente)     │
├─────────────────────────────────────────────────────────────────┤
│ FIGHTER_RANKINGS (NO se actualizó)                             │
│ - level: "Amateur" ❌ (Datos desincronizados)                  │
└─────────────────────────────────────────────────────────────────┘
```

El peleador muestra **Semi-profesional** en su perfil, pero aparece en el ranking de **Amateur**.

---

## CAUSA RAÍZ

Existen **DOS sistemas paralelos** que no se comunican:

### Sistema 1: Edición de Perfil (FighterEditModal.tsx)
```
Admin edita nivel → Actualiza fighter_profiles.level → ✅
                  → NO toca fighter_rankings.level → ❌
```

### Sistema 2: Gestión de Ligas (FighterLeaguesTab.tsx)
```
Admin edita nivel en pestaña "Ligas" → Actualiza fighter_rankings.level → ✅
                                     → NO toca fighter_profiles.level → ❌
```

### Resultado: Dos fuentes de verdad desincronizadas

```text
                    ┌─────────────────────┐
                    │ FighterEditModal    │
                    │ (Tab "Combate")     │
                    └──────────┬──────────┘
                               │ Actualiza
                               ▼
                    ┌─────────────────────┐
                    │ fighter_profiles    │
                    │ level: Semi-pro     │ ← El admin ve esto
                    └─────────────────────┘
                               ✗ Sin conexión
                    ┌─────────────────────┐
                    │ fighter_rankings    │
                    │ level: Amateur      │ ← El ranking muestra esto
                    └─────────────────────┘
                               ▲
                               │ Actualiza
                    ┌──────────┴──────────┐
                    │ FighterLeaguesTab   │
                    │ (Tab "Ligas")       │
                    └─────────────────────┘
```

---

## CAMPOS AFECTADOS POR LA DESINCRONIZACIÓN

| Campo | En `fighter_profiles` | En `fighter_rankings` | ¿Sincronizado? |
|-------|----------------------|----------------------|----------------|
| `level` | ✅ Editable | ✅ Editable | ❌ NO |
| `weight_class` | ✅ Editable | ✅ Editable | ❌ NO |
| `discipline` | ✅ Editable | ❌ Solo lectura (via org) | ⚠️ Parcial |

---

## SOLUCIÓN PROPUESTA

### Estrategia: Sincronización Bidireccional Automática

Cuando se actualiza `fighter_profiles.level` o `fighter_profiles.weight_class`, automáticamente actualizar todos los `fighter_rankings` activos del peleador.

### Implementación en 3 Partes:

#### Parte 1: Nueva Función RPC (Base de Datos)

```sql
CREATE OR REPLACE FUNCTION sync_fighter_profile_to_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar level a todos los rankings activos
  IF OLD.level IS DISTINCT FROM NEW.level THEN
    UPDATE fighter_rankings
    SET level = NEW.level
    WHERE fighter_id = NEW.id 
      AND is_active = true;
  END IF;
  
  -- Sincronizar weight_class a todos los rankings activos
  IF OLD.weight_class IS DISTINCT FROM NEW.weight_class THEN
    UPDATE fighter_rankings
    SET weight_class = NEW.weight_class
    WHERE fighter_id = NEW.id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automático
CREATE TRIGGER sync_profile_to_rankings_trigger
AFTER UPDATE OF level, weight_class ON fighter_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_fighter_profile_to_rankings();
```

#### Parte 2: Actualización del Hook (Frontend)

Modificar `useFighterProfiles.tsx` para invalidar queries adicionales:

```typescript
// Después de actualizar el perfil exitosamente
queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
queryClient.invalidateQueries({ queryKey: ['ranking-data'] }); // Nuevo

// Emitir evento global
window.dispatchEvent(new CustomEvent('admin-fighter-updated', {
  detail: { fighterId, fields: ['level', 'weight_class'] }
}));
```

#### Parte 3: UI de Advertencia

Actualizar `FighterEditModal.tsx` para mostrar cuántos rankings se actualizarán:

```typescript
// Cuando cambia el nivel, mostrar advertencia informativa
{levelChanged && fighterActiveLeagues.length > 0 && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertDescription>
      El nivel se actualizará en {fighterActiveLeagues.length} ranking(s):
      {fighterActiveLeagues.map(l => l.organization_name).join(', ')}
    </AlertDescription>
  </Alert>
)}
```

---

## ARCHIVOS A MODIFICAR

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| **Nueva migración SQL** | Crear trigger de sincronización | CRÍTICA |
| `src/hooks/useFighterProfiles.tsx` | Invalidar queries adicionales | ALTA |
| `src/components/admin/FighterEditModal.tsx` | UI de advertencia al cambiar nivel | MEDIA |
| `src/pages/admin/RankingsManagement.tsx` | Forzar refresh después de cambios | MEDIA |

---

## BENEFICIOS POST-IMPLEMENTACIÓN

1. **Un admin edita nivel** → Se actualiza automáticamente en todos los rankings
2. **Un admin edita peso** → Se actualiza automáticamente en todos los rankings
3. **Sin intervención manual** → No hay que ir a "Ligas" por separado
4. **Datos consistentes** → Una sola fuente de verdad efectiva
5. **Trazabilidad** → El trigger puede incluir log de auditoría

---

## VERIFICACIÓN POST-IMPLEMENTACIÓN

```sql
-- Query para verificar consistencia (debería devolver 0 filas)
SELECT fp.first_name, fp.last_name,
       fp.level as profile_level,
       fr.level as ranking_level
FROM fighter_profiles fp
JOIN fighter_rankings fr ON fp.id = fr.fighter_id
WHERE fp.level != fr.level
  AND fr.is_active = true;
```

---

## SECCIÓN TÉCNICA: Detalles de Migración

La migración creará:
1. Función `sync_fighter_profile_to_rankings()` con SECURITY DEFINER
2. Trigger `sync_profile_to_rankings_trigger` en UPDATE de `fighter_profiles`
3. Índice optimizado para búsquedas de rankings por fighter_id

El trigger se ejecutará automáticamente cada vez que se actualice `level` o `weight_class` en cualquier perfil de peleador, garantizando sincronización inmediata sin importar desde dónde se haga el cambio (UI, API, SQL directo).
