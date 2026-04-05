

# Fase 3: Filtrado por Disciplina en el Servidor

## Resumen

Mover el filtrado client-side (`useMemo`) al servidor agregando `discipline` como parámetro opcional a los 3 hooks principales. Los consumidores no-admin (Events.tsx, Gimnasios.tsx, etc.) siguen funcionando sin cambios.

## Cambios

### 1. `src/hooks/useAdminFighters.tsx`

Agregar parámetro `discipline?: string` a `useAdminFighters()` y pasarlo a `useFightersQuery`:

```typescript
export function useAdminFighters(discipline?: string) {
  const { data, isLoading, error: queryError, refetch } = useFightersQuery({ 
    active: true,
    discipline 
  });
  // ... rest unchanged
}
```

`useFightersQuery` ya tiene soporte para `discipline` en la query de Supabase (línea 36-38), así que no necesita cambios.

### 2. `src/hooks/useEvents.tsx`

Agregar parámetro opcional `discipline` a `useEvents()` y aplicar `.eq('discipline', discipline)` en `fetchEvents`:

```typescript
export function useEvents(discipline?: string) {
  // In fetchEvents:
  let query = supabase.from('bdg_event').select('*');
  if (discipline) {
    query = query.eq('discipline', discipline);
  }
  query = query.order('start_time', { ascending: true });
```

También filtrar en el handler realtime para no insertar eventos de otra disciplina.

### 3. `src/hooks/useGyms.tsx`

Agregar parámetro opcional `discipline` a `useGyms()`. Como `gyms.disciplinas` es un array text[], usar `.contains('disciplinas', [discipline])`:

```typescript
export function useGyms(discipline?: string) {
  return useQuery({
    queryKey: ['gyms', discipline],
    queryFn: async (): Promise<Gym[]> => {
      let query = supabase.from('gyms').select('*').eq('activo', true);
      if (discipline) {
        query = query.contains('disciplinas', [discipline]);
      }
      // ...
```

### 4. Actualizar consumidores admin

| Archivo | Cambio |
|---------|--------|
| `FightersProfiles.tsx` | `useAdminFighters(discipline)` — eliminar `useMemo` de filtrado |
| `EventosPelea.tsx` | `useEvents(discipline)` — eliminar `useMemo` que filtra `allEvents` |
| `GimnasiosAdmin.tsx` | `useGyms(discipline)` — simplificar `filteredGyms` memo |
| `EntrenadoresAdmin.tsx` | `useGyms(discipline)` si aplica |

### 5. Consumidores no-admin (sin cambios)

`Events.tsx`, `Gimnasios.tsx`, `EventDetail.tsx`, `LiveEventsControl.tsx`, `FighterProfileForm.tsx`, etc. llaman sin parámetro y siguen recibiendo todos los datos.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useAdminFighters.tsx` | Aceptar `discipline` param, pasar a query |
| `src/hooks/useEvents.tsx` | Aceptar `discipline` param, filtrar en Supabase |
| `src/hooks/useGyms.tsx` | Aceptar `discipline` param, usar `.contains()` |
| `src/pages/admin/FightersProfiles.tsx` | Pasar discipline al hook, eliminar filtrado client |
| `src/pages/admin/EventosPelea.tsx` | Pasar discipline al hook, eliminar `useMemo` filtro |
| `src/pages/admin/GimnasiosAdmin.tsx` | Pasar discipline al hook, simplificar memo |

