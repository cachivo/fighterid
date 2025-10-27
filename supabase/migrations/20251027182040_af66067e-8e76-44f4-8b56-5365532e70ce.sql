-- ═══════════════════════════════════════════════════════════════════
-- TABLA: fight_summaries (Resúmenes generados por IA)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS fight_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id uuid REFERENCES fights(id) ON DELETE CASCADE NOT NULL,
  summary_md text NOT NULL,
  highlights jsonb DEFAULT '[]'::jsonb,
  key_moments jsonb DEFAULT '[]'::jsonb,
  fight_stats_summary jsonb,
  lang text DEFAULT 'es',
  model_used text DEFAULT 'google/gemini-2.5-flash',
  tokens_used int,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(fight_id, lang)
);

ALTER TABLE fight_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read summaries" ON fight_summaries
  FOR SELECT USING (true);

CREATE POLICY "Admins manage summaries" ON fight_summaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- FUNCIONES: Actualización automática de récords
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_single_fighter_record(
  p_fighter_id UUID,
  p_fight_type TEXT
)
RETURNS VOID AS $$
DECLARE
  total_wins INT := 0;
  total_losses INT := 0;
  total_draws INT := 0;
BEGIN
  -- Calcular victorias
  SELECT COUNT(*) INTO total_wins
  FROM fights f
  WHERE f.status = 'finished'
    AND f.fight_type = p_fight_type
    AND f.winner_id = p_fighter_id
    AND (f.fighter_a_id = p_fighter_id OR f.fighter_b_id = p_fighter_id);

  -- Calcular derrotas
  SELECT COUNT(*) INTO total_losses
  FROM fights f
  WHERE f.status = 'finished'
    AND f.fight_type = p_fight_type
    AND f.winner_id IS NOT NULL
    AND f.winner_id != p_fighter_id
    AND (f.fighter_a_id = p_fighter_id OR f.fighter_b_id = p_fighter_id);

  -- Calcular empates
  SELECT COUNT(*) INTO total_draws
  FROM fights f
  WHERE f.status = 'finished'
    AND f.fight_type = p_fight_type
    AND f.winner_id IS NULL
    AND (f.fighter_a_id = p_fighter_id OR f.fighter_b_id = p_fighter_id);

  -- Actualizar fighter_profiles
  UPDATE fighter_profiles
  SET 
    record_wins = total_wins,
    record_losses = total_losses,
    record_draws = total_draws,
    record_type = p_fight_type,
    updated_at = NOW()
  WHERE id = p_fighter_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_fighter_record_on_result()
RETURNS TRIGGER AS $$
DECLARE
  affected_fighter_a_id UUID;
  affected_fighter_b_id UUID;
  fight_type_value TEXT;
BEGIN
  -- Obtener datos de la pelea
  SELECT fighter_a_id, fighter_b_id, fight_type 
  INTO affected_fighter_a_id, affected_fighter_b_id, fight_type_value
  FROM fights 
  WHERE id = NEW.fight_id;

  -- Actualizar récords de ambos peleadores
  PERFORM update_single_fighter_record(affected_fighter_a_id, fight_type_value);
  PERFORM update_single_fighter_record(affected_fighter_b_id, fight_type_value);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_fighter_record_on_fight_finish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finished' AND (OLD.status IS NULL OR OLD.status != 'finished') THEN
    PERFORM update_single_fighter_record(NEW.fighter_a_id, NEW.fight_type);
    PERFORM update_single_fighter_record(NEW.fighter_b_id, NEW.fight_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS: Actualización automática de récords
-- ═══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trigger_update_fighter_record ON fight_results;
CREATE TRIGGER trigger_update_fighter_record
AFTER INSERT OR UPDATE ON fight_results
FOR EACH ROW
EXECUTE FUNCTION update_fighter_record_on_result();

DROP TRIGGER IF EXISTS trigger_update_record_on_finish ON fights;
CREATE TRIGGER trigger_update_record_on_finish
AFTER UPDATE ON fights
FOR EACH ROW
WHEN (NEW.status = 'finished')
EXECUTE FUNCTION update_fighter_record_on_fight_finish();

-- ═══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Recalcular récords existentes
-- ═══════════════════════════════════════════════════════════════════

-- Recalcular récords amateur
DO $$
DECLARE
  fighter_rec RECORD;
BEGIN
  FOR fighter_rec IN 
    SELECT DISTINCT fp.id
    FROM fighter_profiles fp
    WHERE EXISTS (
      SELECT 1 FROM fights f
      WHERE f.status = 'finished' 
        AND f.fight_type = 'AMATEUR'
        AND (f.fighter_a_id = fp.id OR f.fighter_b_id = fp.id)
    )
  LOOP
    PERFORM update_single_fighter_record(fighter_rec.id, 'AMATEUR');
  END LOOP;
END $$;

-- Recalcular récords profesionales
DO $$
DECLARE
  fighter_rec RECORD;
BEGIN
  FOR fighter_rec IN 
    SELECT DISTINCT fp.id
    FROM fighter_profiles fp
    WHERE EXISTS (
      SELECT 1 FROM fights f
      WHERE f.status = 'finished' 
        AND f.fight_type = 'PROFESSIONAL'
        AND (f.fighter_a_id = fp.id OR f.fighter_b_id = fp.id)
    )
  LOOP
    PERFORM update_single_fighter_record(fighter_rec.id, 'PROFESSIONAL');
  END LOOP;
END $$;