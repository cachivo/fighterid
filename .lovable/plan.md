
# Plan: Corrección de Fórmula de Puntos en Base de Datos

## Diagnóstico

El código frontend ya tiene la fórmula correcta implementada:

| Resultado | Puntos |
|-----------|--------|
| Victoria | +3 |
| Empate | +1 |
| Derrota | -1 |

**Problema identificado:** La migración anterior aplicó una fórmula diferente (`wins*10, draws*3, losses*-2`) en la base de datos.

## Solución

Crear una única migración SQL para recalcular los puntos de todos los peleadores usando la fórmula correcta.

## Cambio Requerido

### Migración SQL

```text
UPDATE fighter_rankings
SET points = (wins × 3) + (draws × 1) - (losses × 1)
```

### Ejemplos de Cálculo

```text
Kevin Calona (6-3-0):
  (6 × 3) + (0 × 1) - (3 × 1) = 18 - 3 = 15 pts

Aaron Irias (3-1-0):
  (3 × 3) + (0 × 1) - (1 × 1) = 9 - 1 = 8 pts

Willis Yang (1-1-1):
  (1 × 3) + (1 × 1) - (1 × 1) = 3 + 1 - 1 = 3 pts
```

## Archivos Verificados (Sin cambios necesarios)

| Archivo | Estado |
|---------|--------|
| `src/hooks/useFighterRanking.tsx` | Fórmula correcta (línea 71) |
| `src/components/admin/PointAdjustmentModal.tsx` | Delta derrota = -1 (línea 37) |
| `src/components/sections/Ranking.tsx` | Colores correctos (verde-rojo-gris) |

## Acción

Ejecutar migración SQL para sincronizar la base de datos con la lógica del frontend.
