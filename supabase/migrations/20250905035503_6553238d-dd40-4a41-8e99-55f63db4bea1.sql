-- Add martial_arts array column to fighter_profiles
ALTER TABLE public.fighter_profiles 
ADD COLUMN martial_arts text[] DEFAULT ARRAY[]::text[];

-- Migrate existing discipline data to martial_arts array
UPDATE public.fighter_profiles 
SET martial_arts = CASE 
  WHEN discipline IS NOT NULL THEN ARRAY[discipline::text]
  ELSE ARRAY[]::text[]
END
WHERE martial_arts = ARRAY[]::text[] OR martial_arts IS NULL;

-- Add index for better performance on martial_arts queries
CREATE INDEX idx_fighter_profiles_martial_arts ON public.fighter_profiles USING GIN(martial_arts);