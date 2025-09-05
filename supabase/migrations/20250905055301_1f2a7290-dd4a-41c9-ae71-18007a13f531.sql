-- Phase 1: Add critical safety information to fighter profiles
ALTER TABLE public.fighter_profiles 
ADD COLUMN IF NOT EXISTS document_type text,
ADD COLUMN IF NOT EXISTS document_number text,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS birthplace text,
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS medical_allergies text,
ADD COLUMN IF NOT EXISTS medical_conditions text,
ADD COLUMN IF NOT EXISTS insurance_company text,
ADD COLUMN IF NOT EXISTS insurance_policy text;

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_document_number ON public.fighter_profiles(document_number);
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_birthdate ON public.fighter_profiles(birthdate);

-- Update the sync function to handle new fields
CREATE OR REPLACE FUNCTION public.sync_fighter_license_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;