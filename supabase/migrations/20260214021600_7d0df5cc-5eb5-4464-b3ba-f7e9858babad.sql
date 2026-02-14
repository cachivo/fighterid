
-- =============================================================
-- Gym Sync Triggers & Data Normalization
-- =============================================================

-- 1. Trigger: When fighter_profiles.gym_id changes, auto-update gym_name
CREATE OR REPLACE FUNCTION public.sync_gym_name_from_gym_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gym_id IS NOT NULL AND (OLD.gym_id IS DISTINCT FROM NEW.gym_id) THEN
    SELECT nombre INTO NEW.gym_name
    FROM public.gyms
    WHERE id = NEW.gym_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_gym_name_from_gym_id ON public.fighter_profiles;
CREATE TRIGGER trg_sync_gym_name_from_gym_id
  BEFORE UPDATE ON public.fighter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_gym_name_from_gym_id();

-- 2. Trigger: When gyms.nombre changes, propagate to all linked fighters
CREATE OR REPLACE FUNCTION public.propagate_gym_name_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.nombre IS DISTINCT FROM NEW.nombre THEN
    UPDATE public.fighter_profiles
    SET gym_name = NEW.nombre
    WHERE gym_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_propagate_gym_name_change ON public.gyms;
CREATE TRIGGER trg_propagate_gym_name_change
  AFTER UPDATE ON public.gyms
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_gym_name_change();

-- 3. Trigger: When fighter_gym_memberships status becomes ACTIVE, sync gym_id/gym_name
CREATE OR REPLACE FUNCTION public.sync_fighter_gym_on_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ACTIVE' THEN
    UPDATE public.fighter_profiles
    SET gym_id = NEW.gym_id,
        gym_name = (SELECT nombre FROM public.gyms WHERE id = NEW.gym_id)
    WHERE id = NEW.fighter_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_fighter_gym_on_membership ON public.fighter_gym_memberships;
CREATE TRIGGER trg_sync_fighter_gym_on_membership
  AFTER INSERT OR UPDATE ON public.fighter_gym_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_fighter_gym_on_membership();

-- 4. Normalize existing data: match gym_name text to gyms table
-- Match "Lunaticos", "Lunáticos Team", "Team lunaticos", "Team Lunaticos" → Lunaticos gym
UPDATE public.fighter_profiles fp
SET gym_id = g.id, gym_name = g.nombre
FROM public.gyms g
WHERE fp.gym_id IS NULL
  AND fp.gym_name IS NOT NULL
  AND g.nombre = 'Lunaticos'
  AND LOWER(TRIM(fp.gym_name)) IN ('lunaticos', 'lunáticos team', 'team lunaticos', 'lunaticos ');

-- Match "Honduras Hood Fights"
UPDATE public.fighter_profiles fp
SET gym_id = g.id, gym_name = g.nombre
FROM public.gyms g
WHERE fp.gym_id IS NULL
  AND fp.gym_name IS NOT NULL
  AND g.nombre = 'Honduras Hood Fights'
  AND LOWER(TRIM(fp.gym_name)) = 'honduras hood fights';

-- Match "Club de Boxeo Chele Munguia" variations
UPDATE public.fighter_profiles fp
SET gym_id = g.id, gym_name = g.nombre
FROM public.gyms g
WHERE fp.gym_id IS NULL
  AND fp.gym_name IS NOT NULL
  AND g.nombre = 'Club de Boxeo Chele Munguia'
  AND LOWER(TRIM(fp.gym_name)) IN (
    'club de boxeo chele munguia',
    'club de boxeo munguia',
    'club de boxeo munguia ',
    'bushido academy/mungia club de boxeo',
    'mungia club de boxeo'
  );
