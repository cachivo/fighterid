-- Add gymnasium/academy field to fighter profiles
ALTER TABLE public.fighter_profiles 
ADD COLUMN gym_name TEXT;