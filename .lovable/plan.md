

# Sincronización Completa del Sistema — Vision → Negocio → Web

## Estado actual

- `fights.status` es `TEXT` libre, sin constraint
- No existe trigger que actualice rankings al insertar en `fight_results`
- `/start` no valida el estado de la pelea ni lo cambia a `ACTIVE`
- `/end` no marca la pelea como `finished`
- Se pueden crear sesiones duplicadas activas para la misma pelea+dispositivo
- `COALESCE` en la vista ya usa `CONCAT_WS` (NULL-safe) — esto está correcto
- No hay realtime en rankings (solo en telemetry)

## Cambios

### 1. Migration SQL — Lifecycle + Ranking trigger

```sql
-- A. Partial unique index: solo 1 sesión activa por fight+device
CREATE UNIQUE INDEX IF NOT EXISTS idx_telemetry_one_active_per_fight_device
  ON fight_telemetry_sessions (fight_id, device_id)
  WHERE status = 'connected';

-- B. Trigger: al insertar fight_result → actualizar records + ranking + status
CREATE OR REPLACE FUNCTION public.on_fight_result_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fight RECORD;
  v_loser_id UUID;
BEGIN
  -- 1. Marcar pelea como finished
  UPDATE fights SET status = 'finished', winner_id = NEW.winner_id
  WHERE id = NEW.fight_id
  RETURNING * INTO v_fight;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- 2. Actualizar records de peleadores
  IF NEW.winner_id IS NOT NULL THEN
    -- Winner: +1 win
    UPDATE fighter_profiles SET record_wins = COALESCE(record_wins, 0) + 1
    WHERE id = NEW.winner_id;

    -- Loser: +1 loss
    v_loser_id := CASE
      WHEN v_fight.fighter_a_id = NEW.winner_id THEN v_fight.fighter_b_id
      ELSE v_fight.fighter_a_id
    END;

    IF v_loser_id IS NOT NULL THEN
      UPDATE fighter_profiles SET record_losses = COALESCE(record_losses, 0) + 1
      WHERE id = v_loser_id;
    END IF;

    -- 3. Ranking: +3 pts winner, -1 pt loser
    UPDATE fighter_rankings SET points = points + 3, last_fight_date = now()
    WHERE fighter_id = NEW.winner_id AND is_active = true;

    IF v_loser_id IS NOT NULL THEN
      UPDATE fighter_rankings SET points = GREATEST(points - 1, 0), last_fight_date = now()
      WHERE fighter_id = v_loser_id AND is_active = true;
    END IF;
  ELSE
    -- Draw: +1 each
    UPDATE fighter_profiles SET record_draws = COALESCE(record_draws, 0) + 1
    WHERE id IN (v_fight.fighter_a_id, v_fight.fighter_b_id);

    UPDATE fighter_rankings SET points = points + 1, last_fight_date = now()
    WHERE fighter_id IN (v_fight.fighter_a_id, v_fight.fighter_b_id) AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fight_result_inserted
  AFTER INSERT ON fight_results
  FOR EACH ROW
  EXECUTE FUNCTION on_fight_result_inserted();
```

### 2. Edge Function `ai-strike-ingest` — Lifecycle en `/start` y `/end`

**`/start`**:
- Validar `ctx.status` no sea `'finished'` — rechazar si ya terminó
- Después de crear sesión: `UPDATE fights SET status = 'active' WHERE id = fight_id AND status != 'finished'`

**`/end`**:
- Ya existe y calcula stats, pero actualmente no marca la pelea como `finished` (eso lo hará el trigger al insertar `fight_result`)
- Agregar: desconectar TODAS las sesiones telemetry del fight (no solo por `fight_id`, usar `device_id` también)
- Bump version a `3.3`

### 3. Frontend — Realtime en `fight_results` ya existe

`useFightRealtime.tsx` ya subscribe a `fight_results` (línea 107). El ranking se actualiza via trigger (server-side), así que el frontend solo necesita refrescar la query de rankings cuando detecta un cambio en `fights.status`.

No se requiere cambio frontend adicional — el trigger hace todo server-side.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Trigger `on_fight_result_inserted`, partial unique index |
| `supabase/functions/ai-strike-ingest/index.ts` | `/start` valida status + actualiza a active; `/end` limpia sesiones; v3.3 |

## Lo que NO se incluye (y por qué)

- **CHECK constraint en `status`**: No se agrega porque hay valores legacy variados en la tabla. El trigger normaliza hacia adelante.
- **Realtime en rankings**: El trigger actualiza server-side. Los componentes de ranking ya hacen refetch periódico. Agregar un channel Realtime a `fighter_rankings` sería una mejora futura pero no es crítico.

