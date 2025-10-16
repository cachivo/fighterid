-- Permitir NULL en fighter_a_id y fighter_b_id para soportar peleadores externos
ALTER TABLE fights 
  ALTER COLUMN fighter_a_id DROP NOT NULL,
  ALTER COLUMN fighter_b_id DROP NOT NULL;

-- Agregar validación: debe haber al menos un ID (registrado o externo) por peleador
ALTER TABLE fights 
  ADD CONSTRAINT check_fighter_a_id 
  CHECK (fighter_a_id IS NOT NULL OR fighter_a_external_id IS NOT NULL);

ALTER TABLE fights 
  ADD CONSTRAINT check_fighter_b_id 
  CHECK (fighter_b_id IS NOT NULL OR fighter_b_external_id IS NOT NULL);