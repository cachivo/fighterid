

# Filtrado Automático por Disciplina en Páginas Admin

## Resumen

Integrar `useDiscipline()` del contexto en las 4 páginas admin para que filtren datos automáticamente según el panel activo (MMA o Boxeo), eliminando selectores manuales de disciplina donde ya no son necesarios.

## Cambios por archivo

### 1. `src/pages/admin/FightersProfiles.tsx`
- Importar `useDiscipline` de `@/contexts/DisciplineContext`
- Reemplazar `selectedDiscipline` state con `const discipline = useDiscipline()`
- Eliminar el dropdown/select de disciplina del UI (ya viene del sidebar)
- Forzar filtro `matchesDiscipline` usando `discipline` del contexto en lugar de `selectedDiscipline`

### 2. `src/pages/admin/EventosPelea.tsx`
- Importar `useDiscipline`
- Obtener `discipline` del contexto
- Filtrar `events` en el render: `events.filter(e => e.discipline === discipline)`
- Al crear evento, pre-llenar `discipline` con el valor del contexto
- Ocultar selector de disciplina en formulario de creación (o hacerlo readonly)

### 3. `src/pages/admin/GimnasiosAdmin.tsx`
- Importar `useDiscipline`
- En `filteredGyms`, agregar filtro por disciplina del contexto: `g.disciplinas?.includes(discipline)`
- Esto se suma al filtro existente de `useUserDisciplineAccess` (doble capa)
- Al crear gimnasio, pre-seleccionar la disciplina activa

### 4. `src/pages/admin/RankingsManagement.tsx`
- Importar `useDiscipline`
- Reemplazar `selectedDiscipline` state con `const discipline = useDiscipline()`
- Eliminar las `Tabs` MMA/Boxeo del UI (ya no se necesita el toggle)
- Auto-seleccionar primera organización de la disciplina del contexto al montar
- Mantener los filtros de organización, nivel y peso

### 5. `src/hooks/useEvents.tsx` (opcional, mejora)
- Agregar parámetro opcional `discipline` a `useEvents()`
- Si se pasa, filtrar en la query: `.eq('discipline', discipline)`
- Esto reduce datos transferidos vs filtrado en frontend

## Patrón común

```typescript
import { useDiscipline } from '@/contexts/DisciplineContext';

// Dentro del componente:
const discipline = useDiscipline(); // 'MMA' | 'Boxeo'
```

## Archivos afectados

| Archivo | Cambio principal |
|---------|-----------------|
| `src/pages/admin/FightersProfiles.tsx` | Reemplazar state discipline → context, eliminar selector |
| `src/pages/admin/EventosPelea.tsx` | Filtrar eventos por discipline, pre-llenar en creación |
| `src/pages/admin/GimnasiosAdmin.tsx` | Filtrar gimnasios por discipline del contexto |
| `src/pages/admin/RankingsManagement.tsx` | Eliminar tabs disciplina, usar contexto directo |
| `src/hooks/useEvents.tsx` | Agregar param opcional discipline al fetch |

