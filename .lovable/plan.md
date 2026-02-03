
# Plan: Sistema de Ranking por Puntos Acumulados

## Resumen

Cambiar el sistema de ranking de win rate (porcentaje) a puntos acumulados con la fórmula:

| Resultado | Puntos |
|-----------|--------|
| Victoria | +3 |
| Empate | +1 |
| Derrota | -1 |

**Fórmula**: `puntos = (victorias × 3) + (empates × 1) - (derrotas × 1)`

---

## Ejemplo Práctico

| Peleador | Record | Cálculo | Puntos |
|----------|--------|---------|--------|
| Juan | 5-2-0 | (5×3)+(0×1)-(2×1) | **13** |
| María | 3-0-1 | (3×3)+(1×1)-(0×1) | **10** |
| Pedro | 4-3-0 | (4×3)+(0×1)-(3×1) | **9** |
| Ana | 2-0-0 | (2×3)+(0×1)-(0×1) | **6** |

María (3-0-1) queda arriba de Pedro (4-3-0) porque tiene menos derrotas.

---

## Cambios en el Código

### 1. useFighterRanking.tsx

```typescript
// ANTES
const win_rate = total_fights > 0 ? (fighter.record_wins / total_fights) * 100 : 0;

// DESPUÉS
const ranking_points = (fighter.record_wins * 3) + (fighter.record_draws * 1) - (fighter.record_losses * 1);
```

**Ordenamiento**:
```typescript
// ANTES: por win_rate
.sort((a, b) => b.win_rate - a.win_rate);

// DESPUÉS: por ranking_points, desempate por victorias
.sort((a, b) => {
  if (b.ranking_points !== a.ranking_points) {
    return b.ranking_points - a.ranking_points;
  }
  return b.record_wins - a.record_wins; // Desempate
});
```

### 2. Ranking.tsx (UI)

```text
┌─────────────────────────────────────────────────────────────────┐
│  #1  🏆  Juan "El Tigre" Pérez                                 │
│          5-2-0  MMA                                    13 pts  │
├─────────────────────────────────────────────────────────────────┤
│  #2      María "La Tigresa" López                              │
│          3-0-1  Boxeo                                  10 pts  │
├─────────────────────────────────────────────────────────────────┤
│  #3      Pedro Rodríguez                                       │
│          4-3-0  MMA                                     9 pts  │
└─────────────────────────────────────────────────────────────────┘
```

**Cambio visual**:
```tsx
// ANTES
<div className="text-lg font-bold text-purple-neon-primary">
  {fighter.win_rate.toFixed(1)}%
</div>
<div className="text-xs text-gray-400">Win Rate</div>

// DESPUÉS
<div className="text-lg font-bold text-purple-neon-primary">
  {fighter.ranking_points}
</div>
<div className="text-xs text-gray-400">pts</div>
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useFighterRanking.tsx` | Cambiar cálculo y ordenamiento |
| `src/components/sections/Ranking.tsx` | Mostrar puntos en lugar de % |

---

## Consideraciones

### Puntaje Mínimo
- Un peleador sin peleas tiene 0 puntos
- Un peleador con solo derrotas puede tener puntos negativos

### Desempate
Si dos peleadores tienen los mismos puntos, el que tenga más victorias queda arriba.

---

## Ventajas del Sistema

1. **Incentiva actividad**: Pelear más = más oportunidad de puntos
2. **Premia consistencia**: No perder es importante
3. **Justo con empates**: Un empate no es "perder"
4. **Fácil de entender**: Números simples, no porcentajes
5. **Escalable**: Funciona igual con 5 o 50 peleas
