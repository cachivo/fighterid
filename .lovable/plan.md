

# Fase 2: Migrar useDisciplineContext() a useDiscipline()

## Contexto

3 archivos aun usan `useDisciplineContext()` con null-checks manuales. Dentro de los paneles de disciplina, el contexto siempre existe, asi que deben usar `useDiscipline()` directamente. `RankingsManagement` ya usa `useDiscipline()` pero aun importa `useDisciplineContext` sin usarlo.

## Cambios

### 1. `src/pages/admin/FightersProfiles.tsx`

- Quitar import de `useDisciplineContext`
- Reemplazar lineas 42-43 y 48:
  ```typescript
  // ANTES
  const disciplineCtx = useDisciplineContext();
  const discipline = disciplineCtx ? disciplineCtx.discipline : undefined;
  const selectedDiscipline = discipline ?? 'all';

  // DESPUES
  const discipline = useDiscipline();
  const selectedDiscipline = discipline;
  ```
- Actualizar filtrado que dependa de `discipline` siendo `undefined`

### 2. `src/pages/admin/EventosPelea.tsx`

- Quitar import de `useDisciplineContext`
- Reemplazar lineas 74 y 78-81:
  ```typescript
  // ANTES
  const disciplineCtx = useDisciplineContext();
  const events = useMemo(() => {
    if (!disciplineCtx) return allEvents;
    return allEvents.filter(e => e.discipline === disciplineCtx.discipline);
  }, [allEvents, disciplineCtx]);

  // DESPUES
  const discipline = useDiscipline();
  const events = useMemo(() => {
    return allEvents.filter(e => e.discipline === discipline);
  }, [allEvents, discipline]);
  ```

### 3. `src/pages/admin/GimnasiosAdmin.tsx`

- Quitar import de `useDisciplineContext`
- Reemplazar linea 28 y simplificar filtrado (lineas 38-55):
  ```typescript
  // ANTES
  const disciplineCtx = useDisciplineContext();
  if (disciplineCtx) { ... } else { ... }

  // DESPUES
  const discipline = useDiscipline();
  result = result.filter(g =>
    g.disciplinas?.some(d => d === discipline)
  );
  ```
- Eliminar fallback por `useUserDisciplineAccess` (ya no necesario dentro del panel)

### 4. `src/pages/admin/RankingsManagement.tsx`

- Quitar `useDisciplineContext` del import (solo dejar `useDiscipline`)

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `FightersProfiles.tsx` | Reemplazar ctx nullable por `useDiscipline()` |
| `EventosPelea.tsx` | Idem, simplificar filtrado |
| `GimnasiosAdmin.tsx` | Idem, eliminar fallback innecesario |
| `RankingsManagement.tsx` | Limpiar import no usado |

