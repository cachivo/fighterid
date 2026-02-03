
# Plan: Usar Récords Específicos por Disciplina en Rankings

## Problema Actual

El ranking está usando campos genéricos:
```typescript
// ACTUAL (incorrecto)
.select('... record_wins, record_losses, record_draws ...')
```

Debería usar los campos específicos por disciplina:
- MMA: `mma_record_wins`, `mma_record_losses`, `mma_record_draws`
- Boxeo: `boxeo_record_wins`, `boxeo_record_losses`, `boxeo_record_draws`

---

## Solución

### Modificar `useFighterRanking.tsx`

**1. Actualizar la query para incluir campos específicos:**

```typescript
const { data, error } = await supabase
  .from('fighter_profiles')
  .select(`
    id, first_name, last_name, nickname, avatar_url, 
    discipline, level, weight_class, country,
    mma_record_wins, mma_record_losses, mma_record_draws,
    boxeo_record_wins, boxeo_record_losses, boxeo_record_draws
  `, { count: 'exact' })
  .eq('active', true)
  .eq('discipline', discipline);
```

**2. Usar campos correctos según disciplina:**

```typescript
const processed = (data || []).map(fighter => {
  // Seleccionar récord según disciplina
  let wins, losses, draws;
  
  if (discipline === 'MMA') {
    wins = fighter.mma_record_wins || 0;
    losses = fighter.mma_record_losses || 0;
    draws = fighter.mma_record_draws || 0;
  } else if (discipline === 'Boxeo') {
    wins = fighter.boxeo_record_wins || 0;
    losses = fighter.boxeo_record_losses || 0;
    draws = fighter.boxeo_record_draws || 0;
  }
  
  const total_fights = wins + losses + draws;
  const ranking_points = (wins * 3) + (draws * 1) - (losses * 1);
  
  return {
    ...fighter,
    record_wins: wins,
    record_losses: losses,
    record_draws: draws,
    total_fights,
    ranking_points,
  };
});
```

---

## Resultado

| Disciplina | Campos Utilizados |
|------------|-------------------|
| MMA | `mma_record_wins`, `mma_record_losses`, `mma_record_draws` |
| Boxeo | `boxeo_record_wins`, `boxeo_record_losses`, `boxeo_record_draws` |

Un peleador con:
- MMA: 5-2-0 (13 pts)
- Boxeo: 3-1-0 (8 pts)

Solo verá su récord de MMA en el ranking de MMA, y su récord de Boxeo en el ranking de Boxeo.

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useFighterRanking.tsx` | Usar campos específicos por disciplina |

---

## Beneficio

Rankings precisos que reflejan el récord real de cada peleador en cada disciplina específica.
