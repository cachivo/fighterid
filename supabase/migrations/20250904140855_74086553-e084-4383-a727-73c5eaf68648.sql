-- Corregir warning de seguridad: agregar search_path a la función
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;