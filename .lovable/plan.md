

# Fix de 12 Bugs y Mejoras del Sistema de Scoring

## Fase 1: Bugs Criticos (3 fixes)

### Bug #1 -- Loop infinito en estaciones (snake_case vs camelCase)

**Archivos**: `Station1Scoring.tsx`, `Station2Scoring.tsx`, `Station3RoundControl.tsx`

Cambiar `parsed.stationNumber` a `parsed.station_number` en las 3 estaciones. `StationPinLogin` ya guarda correctamente como `station_number`.

- Station1Scoring linea 24: `parsed.stationNumber` -> `parsed.station_number`
- Station2Scoring linea 24: `parsed.stationNumber` -> `parsed.station_number`
- Station3RoundControl linea 30: `parsed.stationNumber` -> `parsed.station_number`

### Bug #2 -- URLs con slash faltante

**Archivos**: `StationWaiting.tsx` linea 27, `JudgeScoringPanel.tsx` linea 42

- `navigate('/estacion${stationNumber}')` -> `navigate('/estacion/${stationNumber}')`
- `navigate('/estacion${session.station_number}')` -> `navigate('/estacion/${session.station_number}')`

Nota: `StationWaiting.tsx` linea 27 ya tiene la URL correcta con slash (`/estacion/${stationNumber}`). Solo `JudgeScoringPanel.tsx` linea 42 tiene el bug (falta el slash: `` navigate(`/estacion${session.station_number}`) ``).

### Bug #3 -- Double trigger race condition

**Migracion SQL**: Eliminar el trigger duplicado `trigger_update_record_on_finish` de la tabla `fights`. Dejar solo el trigger en `fight_results`.

```text
DROP TRIGGER IF EXISTS trigger_update_record_on_finish ON fights;
```

Ademas, modificar `FightResults.tsx` `submitResult()` para hacer ambas operaciones (insert/update fight_results + update fights.status) en una sola llamada RPC atomica, eliminando la ventana de race condition.

Crear funcion SQL `save_fight_result(...)` que haga todo en una transaccion.

---

## Fase 2: Bugs de Base de Datos (2 fixes)

### Bug #4 -- Record amateur/pro se sobreescribe

La tabla `fighter_profiles` ya tiene columnas separadas: `mma_record_wins/losses/draws` y `boxeo_record_wins/losses/draws`. Sin embargo, `update_single_fighter_record()` solo escribe en `record_wins/losses/draws` generico.

**Migracion SQL**: Actualizar `update_single_fighter_record()` para:
- Agregar columnas `amateur_wins/losses/draws`, `semi_pro_wins/losses/draws`, `pro_wins/losses/draws` a `fighter_profiles`
- Escribir en la columna correcta segun `p_fight_type` (AMATEUR, SEMI_PRO, PROFESSIONAL)
- Mantener `record_wins/losses/draws` como totales agregados (suma de todas las categorias)

### Bug #5 -- Empates cuentan peleas sin resultado

La funcion `update_single_fighter_record()` ya filtra por `f.status = 'finished'` en la linea 67. Sin embargo, una pelea `finished` sin `winner_id` podria ser un No Contest y no un empate real. Agregar filtro adicional para excluir peleas con `fight_results.result_type = 'NO_CONTEST'`:

```text
-- Empates: peleas finished sin ganador y que NO sean No Contest
WHERE f.status = 'finished'
  AND f.fight_type = p_fight_type
  AND f.winner_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM fight_results fr 
    WHERE fr.fight_id = f.id 
    AND fr.result_type = 'NO_CONTEST'
  )
```

---

## Fase 3: Mejoras de Mediana Prioridad (7 items)

### Mejora #1 -- Realtime en StationWaiting (reemplazar polling)

**Archivo**: `StationWaiting.tsx`

Reemplazar `setInterval` de 10s con suscripcion Supabase Realtime a cambios en tabla `fights` filtrado por `event_id`. Latencia baja de ~10s a <500ms.

### Mejora #2 -- Notificar jueces cuando termina la pelea

**Archivos**: `Station1Scoring.tsx`, `Station2Scoring.tsx`

Agregar `useEffect` con suscripcion Realtime a `fights` filtrado por `id=eq.${fightId}`. Cuando `status` cambia a `finished`, mostrar toast y redirigir a `/estacion/${station_number}/waiting`.

### Mejora #3 -- Conectar selector de duracion en Station3

**Archivo**: `Station3RoundControl.tsx`

Pasar `customDuration` al `handleStart`: antes de llamar `startRound(nextRound.id)`, hacer `UPDATE fight_rounds SET duration_seconds = customDuration WHERE id = nextRound.id`.

### Mejora #4 -- Tipo StationSession centralizado

**Archivo nuevo**: `src/types/station.ts`

Crear interfaz unica `StationSession` con campo canonico `station_number` (snake_case). Importar desde Station1, Station2, Station3, StationWaiting y JudgeScoringPanel.

### Mejora #5 -- Record multi-categoria en UI

Pendiente para despues de aplicar Bug #4. Mostrar record discriminado por categoria en `FighterProfile.tsx` y `FighterCard.tsx`.

### Mejora #6 -- Race condition en reset de round (useStrikeCounter)

**Archivo**: `useStrikeCounter.tsx` linea ~56

Unificar el reset de `eventsRef.current` y `setState` en una sola operacion para evitar inconsistencias.

### Mejora #7 -- Validacion en scoring_events (mejora de seguridad)

Agregar validacion de que el `judge_id` y `corner` coincidan con la sesion activa. Se implementa como trigger de validacion en la tabla `scoring_events`.

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `Station1Scoring.tsx` | Fix snake_case + Realtime fin de pelea |
| `Station2Scoring.tsx` | Fix snake_case + Realtime fin de pelea |
| `Station3RoundControl.tsx` | Fix snake_case + conectar customDuration |
| `JudgeScoringPanel.tsx` | Fix URL slash |
| `StationWaiting.tsx` | Polling -> Realtime |
| `useStrikeCounter.tsx` | Fix race condition en reset |
| `FightResults.tsx` | Usar RPC atomico |
| Migracion SQL | Drop trigger duplicado, crear RPC atomica, agregar columnas record por categoria, fix empates, trigger validacion scoring |
| `src/types/station.ts` | Nuevo: tipo StationSession centralizado |

**Total: 1 archivo nuevo, 7 archivos modificados, 1 migracion SQL**

