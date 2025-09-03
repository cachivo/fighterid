-- Add license fields to fighter_profiles table
ALTER TABLE public.fighter_profiles 
ADD COLUMN license_number TEXT UNIQUE,
ADD COLUMN license_issued_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN license_expires_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 year'),
ADD COLUMN license_status TEXT DEFAULT 'active' CHECK (license_status IN ('active', 'suspended', 'expired'));

-- Create function to generate license numbers
CREATE OR REPLACE FUNCTION public.generate_license_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_num TEXT;
  next_id INTEGER;
BEGIN
  current_year := EXTRACT(year FROM now())::TEXT;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CASE 
      when license_number LIKE 'FGT-' || current_year || '-%' 
      THEN (split_part(license_number, '-', 3))::INTEGER 
      ELSE 0 
    END
  ), 0) + 1 
  INTO next_id 
  FROM public.fighter_profiles;
  
  sequence_num := LPAD(next_id::TEXT, 3, '0');
  
  RETURN 'FGT-' || current_year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate license number
CREATE OR REPLACE FUNCTION public.set_fighter_license()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_number IS NULL THEN
    NEW.license_number := public.generate_license_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_fighter_license_trigger
  BEFORE INSERT ON public.fighter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_fighter_license();

-- Update existing fighter profiles to have license numbers
UPDATE public.fighter_profiles 
SET license_number = public.generate_license_number()
WHERE license_number IS NULL;