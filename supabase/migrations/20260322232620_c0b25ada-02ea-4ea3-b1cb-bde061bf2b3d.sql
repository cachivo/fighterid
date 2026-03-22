-- A. Unique index en fight_results(fight_id) — previene doble insert
CREATE UNIQUE INDEX IF NOT EXISTS unique_fight_result_per_fight
  ON fight_results (fight_id);

-- B. Trigger idempotente — verificar que la pelea no esté ya finished
CREATE OR REPLACE FUNCTION public.on_fight_result_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fight RECORD;
  v_loser_id UUID;
  v_current_status TEXT;
BEGIN
  SELECT status INTO v_current_status FROM fights WHERE id = NEW.fight_id;
  IF v_current_status = 'finished' THEN
    RETURN NEW;
  END IF;

  UPDATE fights SET status = 'finished', winner_id = NEW.winner_id
  WHERE id = NEW.fight_id
  RETURNING * INTO v_fight;

  IF NOT FOUND THEN RETURN NEW; END IF;

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

-- C. Normalizar status legacy
UPDATE fights SET status = 'active' WHERE LOWER(status) = 'active' AND status != 'active';
UPDATE fights SET status = 'finished' WHERE LOWER(status) IN ('finished', 'completed', 'done') AND status NOT IN ('finished');
UPDATE fights SET status = 'scheduled' WHERE LOWER(status) IN ('scheduled', 'pending') AND status NOT IN ('scheduled');