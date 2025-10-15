-- ============================================
-- SISTEMA DE INCENTIVOS DE PERFIL
-- Función de cálculo de completitud
-- ============================================

-- Función para calcular el score de completitud (0-100)
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_fighter_id UUID)
RETURNS JSONB AS $$
DECLARE
  score INTEGER := 0;
  level TEXT;
  missing_fields TEXT[] := '{}';
BEGIN
  -- Avatar (+15 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND avatar_url IS NOT NULL AND avatar_url != '') THEN
    score := score + 15;
  ELSE
    missing_fields := array_append(missing_fields, 'avatar_url');
  END IF;
  
  -- Documento (+10 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND document_number IS NOT NULL AND document_number != '') THEN
    score := score + 10;
  ELSE
    missing_fields := array_append(missing_fields, 'document_number');
  END IF;
  
  -- Tipo de sangre (+10 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND blood_type IS NOT NULL AND blood_type != '') THEN
    score := score + 10;
  ELSE
    missing_fields := array_append(missing_fields, 'blood_type');
  END IF;
  
  -- Contacto emergencia (+10 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id 
             AND emergency_contact_name IS NOT NULL AND emergency_contact_name != ''
             AND emergency_contact_phone IS NOT NULL AND emergency_contact_phone != '') THEN
    score := score + 10;
  ELSE
    missing_fields := array_append(missing_fields, 'emergency_contact');
  END IF;
  
  -- Información física: altura (+5 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND height_cm IS NOT NULL AND height_cm > 0) THEN
    score := score + 5;
  ELSE
    missing_fields := array_append(missing_fields, 'height_cm');
  END IF;
  
  -- Información física: peso (+5 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND weight_kg IS NOT NULL AND weight_kg > 0) THEN
    score := score + 5;
  ELSE
    missing_fields := array_append(missing_fields, 'weight_kg');
  END IF;
  
  -- Información física: alcance (+5 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND reach_cm IS NOT NULL AND reach_cm > 0) THEN
    score := score + 5;
  ELSE
    missing_fields := array_append(missing_fields, 'reach_cm');
  END IF;
  
  -- Bio descriptiva (+10 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND bio IS NOT NULL AND LENGTH(bio) > 50) THEN
    score := score + 10;
  ELSE
    missing_fields := array_append(missing_fields, 'bio');
  END IF;
  
  -- Links externos: BoxRec (+5 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND boxrec_url IS NOT NULL AND boxrec_url != '') THEN
    score := score + 5;
  ELSE
    missing_fields := array_append(missing_fields, 'boxrec_url');
  END IF;
  
  -- Links externos: Tapology (+5 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND tapology_url IS NOT NULL AND tapology_url != '') THEN
    score := score + 5;
  ELSE
    missing_fields := array_append(missing_fields, 'tapology_url');
  END IF;
  
  -- Artes marciales (+10 pts)
  IF EXISTS (SELECT 1 FROM fighter_profiles WHERE id = p_fighter_id AND martial_arts IS NOT NULL AND array_length(martial_arts, 1) > 0) THEN
    score := score + 10;
  ELSE
    missing_fields := array_append(missing_fields, 'martial_arts');
  END IF;
  
  -- Actualización reciente de estado (+10 pts)
  IF EXISTS (SELECT 1 FROM fighter_status_updates 
             WHERE fighter_id = p_fighter_id 
             AND created_at > NOW() - INTERVAL '30 days') THEN
    score := score + 10;
  ELSE
    missing_fields := array_append(missing_fields, 'recent_update');
  END IF;
  
  -- Determinar nivel basado en score
  IF score >= 91 THEN 
    level := 'DIAMOND';
  ELSIF score >= 71 THEN 
    level := 'GOLD';
  ELSIF score >= 41 THEN 
    level := 'SILVER';
  ELSE 
    level := 'BRONZE';
  END IF;
  
  RETURN jsonb_build_object(
    'score', score,
    'level', level,
    'missing_fields', missing_fields,
    'next_level_at', CASE 
      WHEN score < 41 THEN 41
      WHEN score < 71 THEN 71
      WHEN score < 91 THEN 91
      ELSE 100
    END
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Agregar columnas para completitud
ALTER TABLE fighter_profiles 
  ADD COLUMN IF NOT EXISTS completion_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_level TEXT DEFAULT 'BRONZE';

-- Función trigger para actualizar automáticamente
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_data JSONB;
BEGIN
  completion_data := calculate_profile_completion(NEW.id);
  NEW.completion_score := (completion_data->>'score')::INTEGER;
  NEW.completion_level := completion_data->>'level';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_completion ON fighter_profiles;
CREATE TRIGGER trigger_update_completion
BEFORE INSERT OR UPDATE ON fighter_profiles
FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- Calcular scores para perfiles existentes
UPDATE fighter_profiles
SET completion_score = (calculate_profile_completion(id)->>'score')::INTEGER,
    completion_level = calculate_profile_completion(id)->>'level'
WHERE id IS NOT NULL;