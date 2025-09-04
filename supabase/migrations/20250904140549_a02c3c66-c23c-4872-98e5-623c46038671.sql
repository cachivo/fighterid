-- Limpieza y sincronización cuidadosa de datos
-- Solo crear licencias para perfiles que no tengan una licencia real correspondiente

-- Crear licencias SOLO para perfiles que no tienen una licencia real en fighter_licenses
INSERT INTO public.fighter_licenses (
  fighter_id,
  license_number,
  status,
  license_level,
  discipline,
  issued_at,
  expires_at,
  is_primary,
  created_at
)
SELECT DISTINCT
  fp.id as fighter_id,
  fp.license_number as license_number,  -- Usar el número existente del perfil
  'ACTIVE'::license_status as status,
  'AMATEUR'::license_level as license_level,
  COALESCE(fp.discipline, 'MMA'::discipline) as discipline,
  COALESCE(fp.license_issued_date, now()) as issued_at,
  COALESCE(fp.license_expires_date, now() + interval '1 year') as expires_at,
  true as is_primary,
  now() as created_at
FROM public.fighter_profiles fp
WHERE fp.active = true 
  AND fp.license_number IS NOT NULL
  AND fp.id NOT IN (
    SELECT fl.fighter_id 
    FROM public.fighter_licenses fl 
    WHERE fl.fighter_id IS NOT NULL
  );

-- Actualizar referencias de primary_license_id en fighter_profiles
UPDATE public.fighter_profiles 
SET primary_license_id = fl.id
FROM public.fighter_licenses fl
WHERE fl.fighter_id = fighter_profiles.id 
  AND fl.is_primary = true
  AND fighter_profiles.primary_license_id IS NULL;

-- Crear constraints para prevenir futuros problemas
CREATE UNIQUE INDEX IF NOT EXISTS idx_fighter_primary_license 
ON public.fighter_licenses (fighter_id) 
WHERE is_primary = true;

-- Función para mantener sincronización automática
CREATE OR REPLACE FUNCTION sync_fighter_license_data()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    UPDATE public.fighter_profiles 
    SET 
      license_number = NEW.license_number,
      license_issued_date = NEW.issued_at,
      license_expires_date = NEW.expires_at,
      license_status = CASE 
        WHEN NEW.status = 'ACTIVE' THEN 'active'
        WHEN NEW.status = 'SUSPENDED' THEN 'suspended'
        WHEN NEW.status = 'EXPIRED' THEN 'expired'
        ELSE 'active'
      END,
      primary_license_id = NEW.id
    WHERE id = NEW.fighter_id 
      AND NEW.is_primary = true;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.fighter_profiles 
    SET 
      license_number = NULL,
      license_issued_date = NULL,
      license_expires_date = NULL,
      license_status = 'active',
      primary_license_id = NULL
    WHERE primary_license_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS sync_fighter_license_trigger ON public.fighter_licenses;
CREATE TRIGGER sync_fighter_license_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.fighter_licenses
  FOR EACH ROW EXECUTE FUNCTION sync_fighter_license_data();