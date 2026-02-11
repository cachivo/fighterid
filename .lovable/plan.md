

# Refactorizacion del Sistema de Peleadores

## Diagnostico Confirmado

Despues de auditar el codigo, confirmo los siguientes problemas:

### 1. Multiples fuentes de verdad para datos de peleadores
- `useFighterProfiles.tsx` - usa useState con fetchFighters manual (632 lineas)
- `useAdminFighters.tsx` - duplica la misma logica con useState
- `useDetailedFighterData.tsx` - otra capa con useState independiente
- `useFighterRanking.tsx` - usa React Query correctamente pero recalcula records client-side
- `useOrganizationRanking.tsx` - usa React Query correctamente
- `useFighterHistory.tsx` - otra fuente de records via fights table
- `useCombinedFighterRecord.tsx` - intenta combinar las anteriores

**Resultado**: Un mismo fighter puede mostrar records diferentes segun que hook/pagina lo renderice.

### 2. Sistema de eventos custom causa race conditions
- 5 archivos disparan `window.dispatchEvent('fighter-profile-updated')`
- 5 archivos escuchan con `window.addEventListener`
- Esto compite con Supabase Realtime (`useRealtimeFighterUpdates`) que ya hace invalidacion de React Query
- Resultado: doble o triple refetch, actualizaciones fuera de orden

### 3. Filtrado client-side ineficiente
- `Fighters.tsx` descarga TODOS los fighters y filtra con 11 variables de estado
- El sorting por "victorias" recalcula records inline en el useMemo
- No hay paginacion server-side

---

## Plan de Implementacion (4 Fases)

### Fase 1: Consolidar fuente de datos (Prioridad CRITICA)

**Objetivo**: Un solo hook maestro basado en React Query para leer fighters.

**Crear** `src/hooks/fighters/useFightersQuery.ts`
- Reemplaza los useState de `useFighterProfiles` y `useAdminFighters`
- Usa `useQuery` con queryKey `['fighters', filters]`
- Soporta filtros opcionales (discipline, level, weightClass, search, active)
- Paginacion server-side via `.range(from, to)`

**Crear** `src/hooks/fighters/useFighterByIdQuery.ts`
- Reemplaza `getFighterById`, `fetchDetailedData`
- Un solo useQuery con queryKey `['fighter', id]`
- Incluye joins a coach, licenses, etc.

**Crear** `src/hooks/fighters/useFighterMutations.ts`
- Centraliza `createFighterProfile`, `updateFighterProfile`, `adminUpdateFighterProfile`
- Usa `useMutation` con `onSuccess` que invalida queryKeys
- Elimina la necesidad de eventos custom del window

**Modificar** `src/hooks/useFighterProfiles.tsx`
- Convertir en wrapper delgado que usa los nuevos hooks
- Mantener la misma API publica para no romper componentes existentes
- Marcar como deprecated

**Modificar** `src/hooks/useAdminFighters.tsx`
- Igual: wrapper que delega a los nuevos hooks
- Eliminar el useEffect con addEventListener

### Fase 2: Eliminar eventos custom del window

**Objetivo**: Dejar que React Query + Supabase Realtime manejen toda la sincronizacion.

**Archivos a limpiar** (remover dispatchEvent):
- `src/components/UserFighterProfileEditForm.tsx`
- `src/hooks/useAdminFighters.tsx`
- `src/hooks/useFighterProfiles.tsx`
- `src/components/admin/FighterEditModal.tsx`

**Archivos a limpiar** (remover addEventListener):
- `src/pages/admin/RankingsManagement.tsx`
- `src/pages/FighterProfile.tsx`
- `src/pages/admin/FightersProfiles.tsx`
- `src/hooks/useFighterProfiles.tsx`
- `src/hooks/useAdminFighters.tsx`

**El hook existente** `useRealtimeFighterUpdates.tsx` ya invalida las queries correctas. Solo necesita asegurarse de cubrir todos los queryKeys nuevos.

### Fase 3: Consolidar records de peleadores

**Objetivo**: Una sola fuente para el record de un fighter.

**Simplificar** `src/hooks/useCombinedFighterRecord.tsx`:
- El record autoritativo viene de `fighter_profiles` (campos `mma_record_*` / `boxeo_record_*`)
- `useFighterHistory` solo se usa para mostrar historial de peleas, NO para calcular records
- Eliminar la logica de "combinar" manual + fights ya que los triggers de DB mantienen sincronizados los campos

**Actualizar** `src/hooks/useFighterRanking.tsx`:
- Usar los campos de record directamente sin recalcular client-side
- O mejor: usar la tabla `fighter_rankings.points` que ya tiene los puntos calculados por triggers

### Fase 4: Paginacion y filtrado server-side

**Objetivo**: No descargar todos los fighters al cliente.

**Crear** una funcion RPC o usar queries con filtros:
```sql
-- Ejemplo de query optimizada
SELECT * FROM fighter_profiles
WHERE active = true
  AND (discipline = $1 OR $1 IS NULL)
  AND (level = $2 OR $2 IS NULL)
  AND (weight_class = $3 OR $3 IS NULL)
ORDER BY created_at DESC
LIMIT $4 OFFSET $5
```

**Modificar** `src/pages/Fighters.tsx`:
- Pasar filtros al hook en lugar de filtrar client-side
- Debounce en el campo de busqueda
- Paginacion con boton "Cargar mas" o scroll infinito (ya existe `InfiniteScrollContainer`)

---

## Detalles Tecnicos

### Estructura de archivos nuevos

```text
src/hooks/fighters/
  useFightersQuery.ts      -- Lista con filtros y paginacion
  useFighterByIdQuery.ts   -- Detalle de un fighter
  useFighterMutations.ts   -- Create/Update/Delete
  index.ts                 -- Re-exports
```

### Patron de los nuevos hooks

```typescript
// useFightersQuery.ts
export function useFightersQuery(filters?: {
  discipline?: string;
  level?: string;
  weightClass?: string;
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['fighters', filters],
    queryFn: async () => {
      let query = supabase
        .from('fighter_profiles')
        .select('*', { count: 'exact' });
      // Apply filters server-side
      // Apply pagination with .range()
      return { fighters, totalCount };
    },
    staleTime: 30_000,
  });
}
```

```typescript
// useFighterMutations.ts
export function useUpdateFighter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => supabase.rpc('admin_update_fighter_profile', ...),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fighters'] });
      queryClient.invalidateQueries({ queryKey: ['fighter', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
      // NO window.dispatchEvent needed
    }
  });
}
```

### Componentes que se modificaran

| Componente | Cambio |
|-----------|--------|
| `Fighters.tsx` | Usar `useFightersQuery` con filtros server-side |
| `FighterProfile.tsx` | Usar `useFighterByIdQuery`, eliminar addEventListener |
| `FightersProfiles.tsx` (admin) | Usar `useFightersQuery`, eliminar addEventListener |
| `FighterEditModal.tsx` | Usar `useUpdateFighter` mutation, eliminar dispatchEvent |
| `UserFighterProfileEditForm.tsx` | Usar `useUpdateFighter`, eliminar dispatchEvent |
| `RankingsManagement.tsx` | Eliminar addEventListener (React Query handles it) |

### Base de datos

**Indices recomendados** (migracion SQL):
```sql
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_discipline_active 
  ON fighter_profiles(discipline, active);
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_search 
  ON fighter_profiles USING gin(
    to_tsvector('spanish', first_name || ' ' || last_name || ' ' || COALESCE(nickname, ''))
  );
```

**RPC opcional** para busqueda full-text:
```sql
CREATE OR REPLACE FUNCTION search_fighters(
  p_search text DEFAULT NULL,
  p_discipline text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
) RETURNS SETOF fighter_profiles AS $$
  SELECT * FROM fighter_profiles
  WHERE active = true
    AND (p_discipline IS NULL OR discipline = p_discipline::discipline)
    AND (p_level IS NULL OR level = p_level)
    AND (p_search IS NULL OR 
         to_tsvector('spanish', first_name || ' ' || last_name || ' ' || COALESCE(nickname, ''))
         @@ plainto_tsquery('spanish', p_search))
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## Orden de ejecucion

1. **Fase 1** - Crear hooks nuevos + wrappers compatibles (no rompe nada existente)
2. **Fase 2** - Eliminar eventos custom (una vez que Fase 1 esta probada)
3. **Fase 3** - Simplificar records (cambio menor)
4. **Fase 4** - Paginacion server-side + indices SQL

Las Fases 1 y 2 son las mas impactantes. Las Fases 3 y 4 son optimizaciones adicionales.

