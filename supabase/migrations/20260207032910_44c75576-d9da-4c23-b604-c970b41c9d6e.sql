-- Trigger de auto-inscripción por disciplina y nivel
-- Se ejecuta SOLO en INSERT (creación de perfiles nuevos)
-- Es un backup si el frontend no selecciona liga

CREATE OR REPLACE FUNCTION public.auto_enroll_fighter_by_discipline()
RETURNS TRIGGER AS $$
DECLARE
  v_org_code TEXT;
  v_org_id UUID;
  v_existing_enrollment INT;
BEGIN
  -- Solo procesar si tiene disciplina y nivel definidos
  IF NEW.discipline IS NULL OR NEW.level IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determinar organización según disciplina y nivel
  IF NEW.discipline = 'Boxeo' THEN
    IF NEW.level IN ('Profesional', 'Semi-profesional') THEN
      v_org_code := 'BDG_PRO';
    ELSIF NEW.level = 'Amateur' THEN
      v_org_code := 'HHF_AMATEUR';
    END IF;
  ELSIF NEW.discipline = 'MMA' THEN
    v_org_code := 'UCC_MMA';
  END IF;

  -- Si no determinamos organización, salir
  IF v_org_code IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener ID de la organización
  SELECT id INTO v_org_id
  FROM ranking_organizations
  WHERE code = v_org_code AND is_active = true;

  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar si ya tiene inscripción activa (por si el frontend ya lo inscribió)
  SELECT COUNT(*) INTO v_existing_enrollment
  FROM fighter_rankings
  WHERE fighter_id = NEW.id 
    AND organization_id = v_org_id 
    AND is_active = true;

  -- Solo inscribir si no tiene inscripción activa en esa organización
  IF v_existing_enrollment = 0 THEN
    INSERT INTO fighter_rankings (
      fighter_id, 
      organization_id, 
      level, 
      weight_class, 
      points, 
      is_active
    ) VALUES (
      NEW.id,
      v_org_id,
      NEW.level,
      COALESCE(NEW.weight_class, 'Peso Ligero'),
      0, -- Inicia con 0 puntos
      true
    )
    ON CONFLICT (fighter_id, organization_id) 
    DO UPDATE SET 
      is_active = true,
      level = EXCLUDED.level,
      weight_class = EXCLUDED.weight_class;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear trigger solo para INSERT (perfiles nuevos)
DROP TRIGGER IF EXISTS auto_enroll_on_create ON fighter_profiles;

CREATE TRIGGER auto_enroll_on_create
AFTER INSERT ON fighter_profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_enroll_fighter_by_discipline();

-- Comentario explicativo
COMMENT ON FUNCTION public.auto_enroll_fighter_by_discipline() IS 
'Auto-inscribe nuevos peleadores en el ranking correspondiente según su disciplina y nivel:
- Boxeo Pro/Semi -> BDG_PRO
- Boxeo Amateur -> HHF_AMATEUR
- MMA cualquier nivel -> UCC_MMA';