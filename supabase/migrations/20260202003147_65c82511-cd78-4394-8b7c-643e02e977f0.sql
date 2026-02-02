-- Migración: Convertir categorías de peso de inglés a español
-- Afecta 45 registros aproximadamente

-- Actualizar weight_class de inglés a español
UPDATE public.fighter_profiles SET weight_class = 'Peso Paja' WHERE weight_class = 'Strawweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Mosca' WHERE weight_class = 'Flyweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Gallo' WHERE weight_class = 'Bantamweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Pluma' WHERE weight_class = 'Featherweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Ligero' WHERE weight_class = 'Lightweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Welter' WHERE weight_class = 'Welterweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Medio' WHERE weight_class = 'Middleweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Semipesado' WHERE weight_class = 'Light Heavyweight';
UPDATE public.fighter_profiles SET weight_class = 'Peso Pesado' WHERE weight_class = 'Heavyweight';

-- También actualizar la función import_fighter_data para usar español
CREATE OR REPLACE FUNCTION public.import_fighter_data(
  p_first_name text, 
  p_last_name text, 
  p_age integer, 
  p_weight_lbs numeric, 
  p_record text, 
  p_height_text text, 
  p_country text, 
  p_nickname text DEFAULT NULL::text, 
  p_birth_date date DEFAULT NULL::date, 
  p_academy text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_fighter_id UUID;
  v_wins INTEGER := 0;
  v_losses INTEGER := 0;
  v_draws INTEGER := 0;
  v_weight_kg NUMERIC;
  v_height_cm INTEGER;
  v_weight_class TEXT;
BEGIN
  -- Parse record (format: "W-L-D" or "DEBUT")
  IF p_record = 'DEBUT' THEN
    v_wins := 0;
    v_losses := 0;
    v_draws := 0;
  ELSE
    v_wins := COALESCE((string_to_array(p_record, '-'))[1]::INTEGER, 0);
    v_losses := COALESCE((string_to_array(p_record, '-'))[2]::INTEGER, 0);
    v_draws := COALESCE((string_to_array(p_record, '-'))[3]::INTEGER, 0);
  END IF;

  -- Convert weight from pounds to kg
  v_weight_kg := p_weight_lbs * 0.453592;

  -- Convert height from meters to cm
  v_height_cm := (REPLACE(p_height_text, ',', '.')::NUMERIC * 100)::INTEGER;

  -- Determine weight class in SPANISH (based on pounds for MMA)
  CASE 
    WHEN p_weight_lbs <= 115 THEN v_weight_class := 'Peso Paja';
    WHEN p_weight_lbs <= 125 THEN v_weight_class := 'Peso Mosca';  
    WHEN p_weight_lbs <= 135 THEN v_weight_class := 'Peso Gallo';
    WHEN p_weight_lbs <= 145 THEN v_weight_class := 'Peso Pluma';
    WHEN p_weight_lbs <= 155 THEN v_weight_class := 'Peso Ligero';
    WHEN p_weight_lbs <= 170 THEN v_weight_class := 'Peso Welter';
    WHEN p_weight_lbs <= 185 THEN v_weight_class := 'Peso Medio';
    WHEN p_weight_lbs <= 205 THEN v_weight_class := 'Peso Semipesado';
    ELSE v_weight_class := 'Peso Pesado';
  END CASE;

  -- Insert fighter (without ELO rating)
  INSERT INTO public.fighter_profiles (
    first_name,
    last_name,
    nickname,
    country,
    weight_class,
    height_cm,
    weight_kg,
    record_wins,
    record_losses,
    record_draws,
    fighting_style,
    bio
  ) VALUES (
    p_first_name,
    p_last_name,
    NULLIF(p_nickname, ''),
    p_country,
    v_weight_class,
    v_height_cm,
    v_weight_kg,
    v_wins,
    v_losses,
    v_draws,
    p_academy,
    CONCAT('Edad: ', p_age, ' años. Academia: ', COALESCE(p_academy, 'N/A'))
  ) RETURNING id INTO v_fighter_id;

  RETURN v_fighter_id;
END;
$function$;