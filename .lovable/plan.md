
# Plan: Migración de Puntos para Boxeadores

## Problema Confirmado

Los boxeadores tienen sus récords en campos legacy que no fueron migrados:

| Peleador | record_wins (legacy) | boxeo_record_wins (actual) | Puntos Actuales |
|----------|---------------------|---------------------------|-----------------|
| Kevin Calona | 6 | 0 | 0 |
| Aaron Irias | 3 | 0 | 0 |
| Mateo Starozze | 2 | 0 | 0 |
| Willis Yang | 1 | 0 | 0 |
| Adiel Espinoza | 1 | 0 | 0 |
| Michael Cabrera | 1 | 0 | 0 |

## Fórmula de Puntos

- **Victoria:** +3 puntos
- **Empate:** +1 punto
- **Derrota:** -1 punto

## Migración SQL Requerida (2 pasos en 1)

```sql
-- Paso 1: Migrar datos legacy a campos específicos de boxeo
UPDATE fighter_profiles
SET 
  boxeo_record_wins = COALESCE(record_wins, 0),
  boxeo_record_losses = COALESCE(record_losses, 0),
  boxeo_record_draws = COALESCE(record_draws, 0)
WHERE discipline = 'Boxeo' AND active = true;

-- Paso 2: Recalcular puntos de rankings de Boxeo
UPDATE fighter_rankings
SET points = 
  (COALESCE(fp.boxeo_record_wins, 0) * 3) + 
  (COALESCE(fp.boxeo_record_draws, 0) * 1) - 
  (COALESCE(fp.boxeo_record_losses, 0) * 1)
FROM fighter_profiles fp, ranking_organizations ro
WHERE fighter_rankings.fighter_id = fp.id 
  AND fighter_rankings.organization_id = ro.id
  AND ro.discipline = 'Boxeo'
  AND fighter_rankings.is_active = true;
```

## Resultados Esperados

| Peleador | Récord | Cálculo | Puntos |
|----------|--------|---------|--------|
| Kevin Calona | 6-3-0 | (6×3) - (3×1) | **15 pts** |
| Aaron Irias | 3-1-0 | (3×3) - (1×1) | **8 pts** |
| Mateo Starozze | 2-2-0 | (2×3) - (2×1) | **4 pts** |
| Willis Yang | 1-1-1 | (1×3) + (1×1) - (1×1) | **3 pts** |
| Adiel Espinoza | 1-0-0 | (1×3) | **3 pts** |
| Michael Cabrera | 1-1-0 | (1×3) - (1×1) | **2 pts** |

## Ranking Final Esperado (Honduras Hood Fights - Boxeo)

1. Kevin Calona - 15 pts
2. Aaron Irias - 8 pts
3. Willis Yang - 3 pts (empate con Adiel)
4. Adiel Espinoza - 3 pts
5. Michael Cabrera - 2 pts

## Archivos a Modificar

Ningún archivo de código. Solo se ejecuta la migración SQL en la base de datos.
