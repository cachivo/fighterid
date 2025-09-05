-- Add record_type field and change sherdog_url to boxrec_url in fighter_profiles
ALTER TABLE public.fighter_profiles 
ADD COLUMN record_type TEXT CHECK (record_type IN ('Amateur', 'Profesional'));

-- Rename sherdog_url to boxrec_url
ALTER TABLE public.fighter_profiles 
RENAME COLUMN sherdog_url TO boxrec_url;