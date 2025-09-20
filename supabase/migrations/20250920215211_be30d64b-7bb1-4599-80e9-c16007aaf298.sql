-- Update record_type constraint to allow Spanish values
ALTER TABLE public.fighter_profiles DROP CONSTRAINT IF EXISTS fighter_profiles_record_type_check;
ALTER TABLE public.fighter_profiles ADD CONSTRAINT fighter_profiles_record_type_check 
  CHECK (record_type IN ('Amateur', 'Profesional', 'Mixto'));