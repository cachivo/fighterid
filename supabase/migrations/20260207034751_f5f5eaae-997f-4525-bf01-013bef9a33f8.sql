-- =====================================================
-- FIX: admin_update_fighter_profile + sync trigger
-- Removes invalid discipline column update from fighter_rankings
-- Adds automatic points recalculation based on records
-- =====================================================

-- Drop existing function to recreate with corrections
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

-- Recreate with SECURITY DEFINER and row_security off
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
DECLARE
  v_new_level text;
  v_new_weight_class text;
  v_new_discipline text;
  v_mma_wins int;
  v_mma_losses int;
  v_mma_draws int;
  v_boxeo_wins int;
  v_boxeo_losses int;
  v_boxeo_draws int;
BEGIN
  -- Extract values for sync check
  v_new_level := CASE WHEN p_profile_data ? 'level' THEN p_profile_data->>'level' ELSE NULL END;
  v_new_weight_class := CASE WHEN p_profile_data ? 'weight_class' THEN p_profile_data->>'weight_class' ELSE NULL END;
  v_new_discipline := CASE WHEN p_profile_data ? 'discipline' THEN p_profile_data->>'discipline' ELSE NULL END;
  
  -- Extract record values
  v_mma_wins := COALESCE((p_profile_data->>'mma_record_wins')::int, 0);
  v_mma_losses := COALESCE((p_profile_data->>'mma_record_losses')::int, 0);
  v_mma_draws := COALESCE((p_profile_data->>'mma_record_draws')::int, 0);
  v_boxeo_wins := COALESCE((p_profile_data->>'boxeo_record_wins')::int, 0);
  v_boxeo_losses := COALESCE((p_profile_data->>'boxeo_record_losses')::int, 0);
  v_boxeo_draws := COALESCE((p_profile_data->>'boxeo_record_draws')::int, 0);

  -- Update fighter_profiles
  UPDATE fighter_profiles
  SET
    first_name = CASE WHEN p_profile_data ? 'first_name' THEN p_profile_data->>'first_name' ELSE first_name END,
    last_name = CASE WHEN p_profile_data ? 'last_name' THEN p_profile_data->>'last_name' ELSE last_name END,
    nickname = CASE WHEN p_profile_data ? 'nickname' THEN p_profile_data->>'nickname' ELSE nickname END,
    country = CASE WHEN p_profile_data ? 'country' THEN p_profile_data->>'country' ELSE country END,
    weight_class = CASE WHEN p_profile_data ? 'weight_class' THEN p_profile_data->>'weight_class' ELSE weight_class END,
    height_cm = CASE WHEN p_profile_data ? 'height_cm' THEN (p_profile_data->>'height_cm')::numeric ELSE height_cm END,
    weight_kg = CASE WHEN p_profile_data ? 'weight_kg' THEN (p_profile_data->>'weight_kg')::numeric ELSE weight_kg END,
    reach_cm = CASE WHEN p_profile_data ? 'reach_cm' THEN (p_profile_data->>'reach_cm')::numeric ELSE reach_cm END,
    fighting_style = CASE WHEN p_profile_data ? 'fighting_style' THEN p_profile_data->>'fighting_style' ELSE fighting_style END,
    gym_name = CASE WHEN p_profile_data ? 'gym_name' THEN p_profile_data->>'gym_name' ELSE gym_name END,
    bio = CASE WHEN p_profile_data ? 'bio' THEN p_profile_data->>'bio' ELSE bio END,
    avatar_url = CASE WHEN p_profile_data ? 'avatar_url' THEN p_profile_data->>'avatar_url' ELSE avatar_url END,
    discipline = CASE WHEN p_profile_data ? 'discipline' THEN (p_profile_data->>'discipline')::discipline ELSE discipline END,
    level = CASE WHEN p_profile_data ? 'level' THEN p_profile_data->>'level' ELSE level END,
    martial_arts = CASE WHEN p_profile_data ? 'martial_arts' THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts')) ELSE martial_arts END,
    -- Discipline-specific records
    mma_record_wins = CASE WHEN p_profile_data ? 'mma_record_wins' THEN (p_profile_data->>'mma_record_wins')::int ELSE mma_record_wins END,
    mma_record_losses = CASE WHEN p_profile_data ? 'mma_record_losses' THEN (p_profile_data->>'mma_record_losses')::int ELSE mma_record_losses END,
    mma_record_draws = CASE WHEN p_profile_data ? 'mma_record_draws' THEN (p_profile_data->>'mma_record_draws')::int ELSE mma_record_draws END,
    boxeo_record_wins = CASE WHEN p_profile_data ? 'boxeo_record_wins' THEN (p_profile_data->>'boxeo_record_wins')::int ELSE boxeo_record_wins END,
    boxeo_record_losses = CASE WHEN p_profile_data ? 'boxeo_record_losses' THEN (p_profile_data->>'boxeo_record_losses')::int ELSE boxeo_record_losses END,
    boxeo_record_draws = CASE WHEN p_profile_data ? 'boxeo_record_draws' THEN (p_profile_data->>'boxeo_record_draws')::int ELSE boxeo_record_draws END,
    -- Legacy records (for backwards compatibility)
    record_wins = CASE WHEN p_profile_data ? 'record_wins' THEN (p_profile_data->>'record_wins')::int ELSE record_wins END,
    record_losses = CASE WHEN p_profile_data ? 'record_losses' THEN (p_profile_data->>'record_losses')::int ELSE record_losses END,
    record_draws = CASE WHEN p_profile_data ? 'record_draws' THEN (p_profile_data->>'record_draws')::int ELSE record_draws END,
    -- Medical fields
    blood_type = CASE WHEN p_profile_data ? 'blood_type' THEN p_profile_data->>'blood_type' ELSE blood_type END,
    emergency_contact_name = CASE WHEN p_profile_data ? 'emergency_contact_name' THEN p_profile_data->>'emergency_contact_name' ELSE emergency_contact_name END,
    emergency_contact_phone = CASE WHEN p_profile_data ? 'emergency_contact_phone' THEN p_profile_data->>'emergency_contact_phone' ELSE emergency_contact_phone END,
    -- Timestamps
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Sync level and weight_class to active fighter_rankings (NO discipline - column doesn't exist)
  IF v_new_level IS NOT NULL OR v_new_weight_class IS NOT NULL THEN
    UPDATE fighter_rankings
    SET 
      level = COALESCE(v_new_level, level),
      weight_class = COALESCE(v_new_weight_class, weight_class),
      updated_at = now()
    WHERE fighter_id = p_fighter_id 
      AND is_active = true;
  END IF;

  -- Sync points to fighter_rankings based on records and organization discipline
  -- Points formula: (Wins * 3) + (Draws * 1) - (Losses * 1)
  IF p_profile_data ? 'mma_record_wins' OR p_profile_data ? 'mma_record_losses' OR p_profile_data ? 'mma_record_draws'
     OR p_profile_data ? 'boxeo_record_wins' OR p_profile_data ? 'boxeo_record_losses' OR p_profile_data ? 'boxeo_record_draws' THEN
    
    UPDATE fighter_rankings fr
    SET 
      points = CASE 
        WHEN ro.discipline = 'MMA' THEN 
          (v_mma_wins * 3) + (v_mma_draws * 1) - (v_mma_losses * 1)
        WHEN ro.discipline = 'Boxeo' THEN 
          (v_boxeo_wins * 3) + (v_boxeo_draws * 1) - (v_boxeo_losses * 1)
        ELSE fr.points
      END,
      updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id 
      AND fr.organization_id = ro.id
      AND fr.is_active = true;
  END IF;
END;
$$;

-- =====================================================
-- CREATE TRIGGER: Auto-sync records to ranking points
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_record_to_rankings_trigger ON fighter_profiles;
DROP FUNCTION IF EXISTS sync_record_to_rankings();

-- Create the sync function
CREATE OR REPLACE FUNCTION sync_record_to_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if record fields actually changed
  IF (OLD.mma_record_wins IS DISTINCT FROM NEW.mma_record_wins) OR
     (OLD.mma_record_losses IS DISTINCT FROM NEW.mma_record_losses) OR
     (OLD.mma_record_draws IS DISTINCT FROM NEW.mma_record_draws) OR
     (OLD.boxeo_record_wins IS DISTINCT FROM NEW.boxeo_record_wins) OR
     (OLD.boxeo_record_losses IS DISTINCT FROM NEW.boxeo_record_losses) OR
     (OLD.boxeo_record_draws IS DISTINCT FROM NEW.boxeo_record_draws) THEN
    
    -- Recalculate points in all active rankings based on organization discipline
    UPDATE fighter_rankings fr
    SET 
      points = CASE 
        WHEN ro.discipline = 'MMA' THEN 
          (COALESCE(NEW.mma_record_wins, 0) * 3) + 
          (COALESCE(NEW.mma_record_draws, 0) * 1) - 
          (COALESCE(NEW.mma_record_losses, 0) * 1)
        WHEN ro.discipline = 'Boxeo' THEN 
          (COALESCE(NEW.boxeo_record_wins, 0) * 3) + 
          (COALESCE(NEW.boxeo_record_draws, 0) * 1) - 
          (COALESCE(NEW.boxeo_record_losses, 0) * 1)
        ELSE fr.points
      END,
      updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = NEW.id 
      AND fr.organization_id = ro.id
      AND fr.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER sync_record_to_rankings_trigger
AFTER UPDATE ON fighter_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_record_to_rankings();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_update_fighter_profile(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_fighter_profile(uuid, jsonb) TO anon;