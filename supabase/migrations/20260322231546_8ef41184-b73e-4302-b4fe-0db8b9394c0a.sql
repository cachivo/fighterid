
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
    UPDATE fighter_profiles SET record_wins = COALESCE(record_wins, 0) + 1
    WHERE id = NEW.winner_id;

    v_loser_id := CASE
      WHEN v_fight.fighter_a_id = NEW.winner_id THEN v_fight.fighter_b_id
      ELSE v_fight.fighter_a_id
    END;

    IF v_loser_id IS NOT NULL THEN
      UPDATE fighter_profiles SET record_losses = COALESCE(record_losses, 0) + 1
      WHERE id = v_loser_id;
    END IF;

    UPDATE fighter_rankings SET points = points + 3, last_fight_date = now()
    WHERE fighter_id = NEW.winner_id AND is_active = true;

    IF v_loser_id IS NOT NULL THEN
      UPDATE fighter_rankings SET points = GREATEST(points - 1, 0), last_fight_date = now()
      WHERE fighter_id = v_loser_id AND is_active = true;
    END IF;
  ELSE
    UPDATE fighter_profiles SET record_draws = COALESCE(record_draws, 0) + 1
    WHERE id IN (v_fight.fighter_a_id, v_fight.fighter_b_id);

    UPDATE fighter_rankings SET points = points + 1, last_fight_date = now()
    WHERE fighter_id IN (v_fight.fighter_a_id, v_fight.fighter_b_id) AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists to avoid duplicate trigger error
DROP TRIGGER IF EXISTS trg_fight_result_inserted ON fight_results;

CREATE TRIGGER trg_fight_result_inserted
  AFTER INSERT ON fight_results
  FOR EACH ROW
  EXECUTE FUNCTION on_fight_result_inserted();
