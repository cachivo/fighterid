

# Bugs encontrados en el sistema de Rankings

## Bug 1 — Posición incorrecta en página 2+

**Archivo**: `Ranking.tsx` línea 283

El ranking muestra `index + 1` del array local. Cuando el usuario hace scroll y carga página 2, el peleador #11 aparece como **#1** de nuevo.

**Fix**: Usar `(page - 1) * PAGE_SIZE + index + 1` o mejor aún, usar `ranking.ranking_position` cuando existe.

Pero hay un problema adicional: el `page` incrementa con infinite scroll, pero el array `rankings` solo contiene los datos de la página actual (slice client-side). Así que el index siempre empieza en 0 para cada página.

**Solución**: Acumular los rankings de todas las páginas cargadas en el frontend, o calcular el offset correcto.

---

## Bug 2 — Stats cards muestran datos incorrectos

**Archivo**: `Ranking.tsx` líneas 105-126

| Stat | Muestra | Debería mostrar |
|------|---------|-----------------|
| "Peleas Realizadas" | `totalCount` (= número de peleadores rankeados) | Total de peleas reales |
| "Profesionales Activos" | Cuenta del array paginado actual | Cuenta del total en la org |
| "Campeones" | Cuenta del array paginado actual | Cuenta del total en la org |

**Fix**: Calcular estas estadísticas en el hook `useOrganizationRanking` usando el dataset completo (antes de paginar), y devolverlas como parte del resultado.

---

## Bug 3 — Paginación ineficiente (fetch all + slice)

**Archivo**: `useOrganizationRanking.tsx` líneas 66-169

El hook hace fetch de TODOS los rankings sin `.range()`, luego pagina con `.slice()`. Esto:
- Descarga todos los datos en cada request
- Falla silenciosamente si hay >1000 registros (límite de Supabase)

**Fix**: Usar `.range(from, to)` de Supabase para paginación server-side. Pero esto requiere acumular resultados en el frontend para infinite scroll.

---

## Bug 4 — Infinite scroll no acumula datos

Cuando `page` incrementa, el hook re-fetches con la nueva página, pero `rankings` se reemplaza completamente (no se acumula). Resultado: al hacer scroll, solo se ven los últimos 10 items.

**Fix**: Acumular rankings en el componente `Ranking.tsx` usando un estado local, o usar `useInfiniteQuery` de React Query.

---

## Plan de corrección

### 1. Refactorizar `useOrganizationRanking` con paginación server-side
- Agregar `.range(from, to)` al query
- Devolver stats globales (campeones, profesionales) con una query separada ligera
- Devolver `totalFights` real desde `fights_history` o similar

### 2. Migrar a `useInfiniteQuery` o acumular en Ranking.tsx
- Acumular `rankings` de cada página en un estado local con `useEffect`
- Mantener compatibilidad con `InfiniteScrollContainer`

### 3. Corregir posición del ranking
- Calcular como `(page - 1) * PAGE_SIZE + index + 1` para el offset visual
- O usar `ranking.ranking_position` cuando esté disponible

### 4. Corregir stats cards
- Mover el cálculo de stats a una query separada en el hook que no dependa de la paginación
- "Peleas Realizadas" → contar desde datos reales (o eliminar si no hay fuente confiable)
- "Profesionales" y "Campeones" → contar desde el dataset completo

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useOrganizationRanking.tsx` | Paginación server-side + stats separadas |
| `src/components/sections/Ranking.tsx` | Acumular rankings, fix posición, fix stats |

