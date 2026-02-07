-- Fix discipline ENUM cast in admin_update_fighter_profile
-- The previous version failed because text cannot be compared with discipline ENUM

DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_updated_count integer;
  v_discipline text;
  v_level text;
  v_weight_class text;
  v_points integer;
BEGIN
  -- Extract values for ranking sync
  v_discipline := p_profile_data->>'discipline';
  v_level := p_profile_data->>'level';
  v_weight_class := p_profile_data->>'weight_class';

  -- Update fighter profile with all editable fields
  UPDATE fighter_profiles
  SET
    -- Basic info
    first_name = CASE WHEN p_profile_data ? 'first_name' THEN p_profile_data->>'first_name' ELSE first_name END,
    last_name = CASE WHEN p_profile_data ? 'last_name' THEN p_profile_data->>'last_name' ELSE last_name END,
    nickname = CASE WHEN p_profile_data ? 'nickname' THEN p_profile_data->>'nickname' ELSE nickname END,
    country = CASE WHEN p_profile_data ? 'country' THEN p_profile_data->>'country' ELSE country END,
    
    -- Physical attributes
    height_cm = CASE WHEN p_profile_data ? 'height_cm' THEN (p_profile_data->>'height_cm')::integer ELSE height_cm END,
    weight_kg = CASE WHEN p_profile_data ? 'weight_kg' THEN (p_profile_data->>'weight_kg')::numeric ELSE weight_kg END,
    reach_cm = CASE WHEN p_profile_data ? 'reach_cm' THEN (p_profile_data->>'reach_cm')::integer ELSE reach_cm END,
    
    -- Combat info
    weight_class = CASE WHEN p_profile_data ? 'weight_class' THEN p_profile_data->>'weight_class' ELSE weight_class END,
    fighting_style = CASE WHEN p_profile_data ? 'fighting_style' THEN p_profile_data->>'fighting_style' ELSE fighting_style END,
    stance = CASE WHEN p_profile_data ? 'stance' THEN p_profile_data->>'stance' ELSE stance END,
    gym_name = CASE WHEN p_profile_data ? 'gym_name' THEN p_profile_data->>'gym_name' ELSE gym_name END,
    level = CASE WHEN p_profile_data ? 'level' THEN p_profile_data->>'level' ELSE level END,
    
    -- CRITICAL FIX: Explicit cast to discipline ENUM with null/empty check
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' 
           AND p_profile_data->>'discipline' IS NOT NULL 
           AND p_profile_data->>'discipline' != '' 
      THEN (p_profile_data->>'discipline')::discipline 
      ELSE discipline 
    END,
    
    -- Personal info
    gender = CASE WHEN p_profile_data ? 'gender' THEN p_profile_data->>'gender' ELSE gender END,
    birthdate = CASE WHEN p_profile_data ? 'birthdate' AND p_profile_data->>'birthdate' != '' THEN (p_profile_data->>'birthdate')::date ELSE birthdate END,
    birthplace = CASE WHEN p_profile_data ? 'birthplace' THEN p_profile_data->>'birthplace' ELSE birthplace END,
    bio = CASE WHEN p_profile_data ? 'bio' THEN p_profile_data->>'bio' ELSE bio END,
    avatar_url = CASE WHEN p_profile_data ? 'avatar_url' THEN p_profile_data->>'avatar_url' ELSE avatar_url END,
    
    -- External links
    boxrec_url = CASE WHEN p_profile_data ? 'boxrec_url' THEN p_profile_data->>'boxrec_url' ELSE boxrec_url END,
    tapology_url = CASE WHEN p_profile_data ? 'tapology_url' THEN p_profile_data->>'tapology_url' ELSE tapology_url END,
    
    -- Legacy record (deprecated but still used)
    record_wins = CASE WHEN p_profile_data ? 'record_wins' THEN (p_profile_data->>'record_wins')::integer ELSE record_wins END,
    record_losses = CASE WHEN p_profile_data ? 'record_losses' THEN (p_profile_data->>'record_losses')::integer ELSE record_losses END,
    record_draws = CASE WHEN p_profile_data ? 'record_draws' THEN (p_profile_data->>'record_draws')::integer ELSE record_draws END,
    record_type = CASE WHEN p_profile_data ? 'record_type' THEN p_profile_data->>'record_type' ELSE record_type END,
    
    -- Discipline-specific records
    mma_record_wins = CASE WHEN p_profile_data ? 'mma_record_wins' THEN (p_profile_data->>'mma_record_wins')::integer ELSE mma_record_wins END,
    mma_record_losses = CASE WHEN p_profile_data ? 'mma_record_losses' THEN (p_profile_data->>'mma_record_losses')::integer ELSE mma_record_losses END,
    mma_record_draws = CASE WHEN p_profile_data ? 'mma_record_draws' THEN (p_profile_data->>'mma_record_draws')::integer ELSE mma_record_draws END,
    boxeo_record_wins = CASE WHEN p_profile_data ? 'boxeo_record_wins' THEN (p_profile_data->>'boxeo_record_wins')::integer ELSE boxeo_record_wins END,
    boxeo_record_losses = CASE WHEN p_profile_data ? 'boxeo_record_losses' THEN (p_profile_data->>'boxeo_record_losses')::integer ELSE boxeo_record_losses END,
    boxeo_record_draws = CASE WHEN p_profile_data ? 'boxeo_record_draws' THEN (p_profile_data->>'boxeo_record_draws')::integer ELSE boxeo_record_draws END,
    
    -- Martial arts training
    martial_arts = CASE WHEN p_profile_data ? 'martial_arts' THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts')) ELSE martial_arts END,
    
    -- Document info
    document_type = CASE WHEN p_profile_data ? 'document_type' THEN p_profile_data->>'document_type' ELSE document_type END,
    document_number = CASE WHEN p_profile_data ? 'document_number' THEN p_profile_data->>'document_number' ELSE document_number END,
    
    -- Emergency contact
    emergency_contact_relation = CASE WHEN p_profile_data ? 'emergency_contact_relation' THEN p_profile_data->>'emergency_contact_relation' ELSE emergency_contact_relation END,
    
    -- Medical info
    medical_allergies = CASE WHEN p_profile_data ? 'medical_allergies' THEN p_profile_data->>'medical_allergies' ELSE medical_allergies END,
    medical_conditions = CASE WHEN p_profile_data ? 'medical_conditions' THEN p_profile_data->>'medical_conditions' ELSE medical_conditions END,
    
    -- Insurance
    insurance_company = CASE WHEN p_profile_data ? 'insurance_company' THEN p_profile_data->>'insurance_company' ELSE insurance_company END,
    insurance_policy = CASE WHEN p_profile_data ? 'insurance_policy' THEN p_profile_data->>'insurance_policy' ELSE insurance_policy END,
    
    -- Timestamp
    updated_at = now()
  WHERE id = p_fighter_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Sync level, weight_class to fighter_rankings if changed
  IF v_level IS NOT NULL OR v_weight_class IS NOT NULL THEN
    UPDATE fighter_rankings
    SET
      level = COALESCE(v_level, level),
      weight_class = COALESCE(v_weight_class, weight_class),
      updated_at = now()
    WHERE fighter_id = p_fighter_id
      AND is_active = true;
  END IF;
  
  -- Recalculate points based on discipline-specific records
  IF p_profile_data ? 'mma_record_wins' OR p_profile_data ? 'mma_record_losses' OR p_profile_data ? 'mma_record_draws' THEN
    -- Calculate MMA points
    SELECT 
      COALESCE((p_profile_data->>'mma_record_wins')::integer, 0) * 3 +
      COALESCE((p_profile_data->>'mma_record_draws')::integer, 0) * 1 -
      COALESCE((p_profile_data->>'mma_record_losses')::integer, 0) * 1
    INTO v_points;
    
    UPDATE fighter_rankings fr
    SET points = GREATEST(0, v_points), updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id
      AND fr.organization_id = ro.id
      AND fr.is_active = true
      AND ro.discipline = 'MMA';
  END IF;
  
  IF p_profile_data ? 'boxeo_record_wins' OR p_profile_data ? 'boxeo_record_losses' OR p_profile_data ? 'boxeo_record_draws' THEN
    -- Calculate Boxeo points
    SELECT 
      COALESCE((p_profile_data->>'boxeo_record_wins')::integer, 0) * 3 +
      COALESCE((p_profile_data->>'boxeo_record_draws')::integer, 0) * 1 -
      COALESCE((p_profile_data->>'boxeo_record_losses')::integer, 0) * 1
    INTO v_points;
    
    UPDATE fighter_rankings fr
    SET points = GREATEST(0, v_points), updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id
      AND fr.organization_id = ro.id
      AND fr.is_active = true
      AND ro.discipline = 'Boxeo';
  END IF;
  
  RETURN jsonb_build_object(
    'success', v_updated_count > 0,
    'updated_count', v_updated_count
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_update_fighter_profile(uuid, jsonb) TO authenticated;