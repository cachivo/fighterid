-- Add missing fields to fighter_profiles table
ALTER TABLE public.fighter_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F', 'Otro')),
ADD COLUMN IF NOT EXISTS sherdog_url TEXT,
ADD COLUMN IF NOT EXISTS tapology_url TEXT;