
-- Step 1: Create bidirectional sync function
CREATE OR REPLACE FUNCTION public.sync_membership_from_gym_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when gym_id actually changes
  IF OLD.gym_id IS DISTINCT FROM NEW.gym_id THEN
    -- If there was a previous gym, mark membership as TRANSFERRED
    IF OLD.gym_id IS NOT NULL THEN
      UPDATE fighter_gym_memberships
      SET status = 'TRANSFERRED', left_at = NOW()
      WHERE fighter_id = NEW.id AND gym_id = OLD.gym_id AND status = 'ACTIVE';
    END IF;

    -- If there's a new gym, create membership if not exists
    IF NEW.gym_id IS NOT NULL THEN
      INSERT INTO fighter_gym_memberships (fighter_id, gym_id, status, joined_at)
      VALUES (NEW.id, NEW.gym_id, 'ACTIVE', NOW())
      ON CONFLICT DO NOTHING;
    END IF;

    -- If gym_id set to NULL, mark any active membership as INACTIVE
    IF NEW.gym_id IS NULL AND OLD.gym_id IS NOT NULL THEN
      UPDATE fighter_gym_memberships
      SET status = 'INACTIVE', left_at = NOW()
      WHERE fighter_id = NEW.id AND status = 'ACTIVE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 2: Attach trigger to fighter_profiles
DROP TRIGGER IF EXISTS trg_sync_membership_from_gym_id ON fighter_profiles;
CREATE TRIGGER trg_sync_membership_from_gym_id
  BEFORE UPDATE ON fighter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_membership_from_gym_id();

-- Step 3: Backfill - create missing memberships for all fighters with gym_id but no active membership
INSERT INTO fighter_gym_memberships (fighter_id, gym_id, status, joined_at)
SELECT fp.id, fp.gym_id, 'ACTIVE', COALESCE(fp.updated_at, fp.created_at, NOW())
FROM fighter_profiles fp
WHERE fp.gym_id IS NOT NULL
  AND fp.active = true
  AND NOT EXISTS (
    SELECT 1 FROM fighter_gym_memberships fgm
    WHERE fgm.fighter_id = fp.id AND fgm.status = 'ACTIVE'
  );
