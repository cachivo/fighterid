

# Completar Fase 1: Filtrado por Disciplina en Sanctions

## Estado Actual

6 de 7 páginas ya tienen filtrado por disciplina implementado. Solo **Sanctions** falta — importa `useDiscipline()` pero no lo usa en el filtrado.

## Problema

La tabla `sanctions` no tiene columna `discipline`. Usa `target_type` (fighter/coach/gym/etc.) y `target_id` como referencia indirecta.

## Solución

### 1. Migración: agregar columna `discipline` a `sanctions`

```sql
ALTER TABLE public.sanctions 
ADD COLUMN discipline text DEFAULT 'MMA';
```

Esto permite filtrado directo sin joins complejos. Valor default `'MMA'` para registros existentes.

### 2. `src/pages/admin/Sanctions.tsx`

Agregar filtro por discipline en la función `filtered`:

```typescript
const filtered = sanctions.filter(s => {
  if (s.discipline && s.discipline !== discipline) return false;  // NEW
  if (filterType !== 'all' && s.sanction_type !== filterType) return false;
  if (filterStatus !== 'all' && s.status !== filterStatus) return false;
  if (search && !s.reason.toLowerCase().includes(search.toLowerCase()) && !s.target_id.includes(search)) return false;
  return true;
});
```

### 3. `src/pages/admin/Sanctions.tsx` — CreateSanctionDialog

Pre-llenar el campo discipline al crear sanciones nuevas con el valor del contexto activo, para que las sanciones creadas desde el panel MMA tengan `discipline: 'MMA'` y viceversa.

### 4. `src/hooks/useSanctions.tsx`

Actualizar el tipo `Sanction` para incluir `discipline?: string` y actualizar `CreateSanctionInput` igualmente.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar columna `discipline` a `sanctions` |
| `src/hooks/useSanctions.tsx` | Agregar `discipline` a interfaces |
| `src/pages/admin/Sanctions.tsx` | Filtrar por discipline + pre-llenar en creación |

