-- Fix admin_update_fighter_profile to properly handle null values using CASE instead of COALESCE
-- This ensures explicit null/empty values from the frontend are respected

CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id UUID,
  p_profile_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
  v_new_level TEXT;
  v_new_weight_class TEXT;
  v_new_discipline TEXT;
BEGIN
  -- 1. Verify caller is admin
  SELECT is_admin INTO v_caller_is_admin
  FROM app_user
  WHERE auth_user_id = auth.uid();
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- 2. Update fighter_profiles with CASE logic to respect explicit nulls
  UPDATE fighter_profiles
  SET
    first_name = CASE WHEN p_profile_data ? 'first_name' THEN p_profile_data->>'first_name' ELSE first_name END,
    last_name = CASE WHEN p_profile_data ? 'last_name' THEN p_profile_data->>'last_name' ELSE last_name END,
    nickname = CASE WHEN p_profile_data ? 'nickname' THEN NULLIF(p_profile_data->>'nickname', '') ELSE nickname END,
    country = CASE WHEN p_profile_data ? 'country' THEN NULLIF(p_profile_data->>'country', '') ELSE country END,
    weight_class = CASE WHEN p_profile_data ? 'weight_class' THEN p_profile_data->>'weight_class' ELSE weight_class END,
    height_cm = CASE WHEN p_profile_data ? 'height_cm' THEN NULLIF((p_profile_data->>'height_cm')::INTEGER, 0) ELSE height_cm END,
    weight_kg = CASE WHEN p_profile_data ? 'weight_kg' THEN NULLIF((p_profile_data->>'weight_kg')::NUMERIC, 0) ELSE weight_kg END,
    reach_cm = CASE WHEN p_profile_data ? 'reach_cm' THEN NULLIF((p_profile_data->>'reach_cm')::INTEGER, 0) ELSE reach_cm END,
    fighting_style = CASE WHEN p_profile_data ? 'fighting_style' THEN NULLIF(p_profile_data->>'fighting_style', '') ELSE fighting_style END,
    gym_name = CASE WHEN p_profile_data ? 'gym_name' THEN NULLIF(p_profile_data->>'gym_name', '') ELSE gym_name END,
    bio = CASE WHEN p_profile_data ? 'bio' THEN NULLIF(p_profile_data->>'bio', '') ELSE bio END,
    avatar_url = CASE WHEN p_profile_data ? 'avatar_url' THEN NULLIF(p_profile_data->>'avatar_url', '') ELSE avatar_url END,
    discipline = CASE WHEN p_profile_data ? 'discipline' THEN NULLIF(p_profile_data->>'discipline', '')::discipline_type ELSE discipline END,
    martial_arts = CASE WHEN p_profile_data ? 'martial_arts' THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts')) ELSE martial_arts END,
    record_wins = CASE WHEN p_profile_data ? 'record_wins' THEN COALESCE((p_profile_data->>'record_wins')::INTEGER, 0) ELSE record_wins END,
    record_losses = CASE WHEN p_profile_data ? 'record_losses' THEN COALESCE((p_profile_data->>'record_losses')::INTEGER, 0) ELSE record_losses END,
    record_draws = CASE WHEN p_profile_data ? 'record_draws' THEN COALESCE((p_profile_data->>'record_draws')::INTEGER, 0) ELSE record_draws END,
    mma_record_wins = CASE WHEN p_profile_data ? 'mma_record_wins' THEN COALESCE((p_profile_data->>'mma_record_wins')::INTEGER, 0) ELSE mma_record_wins END,
    mma_record_losses = CASE WHEN p_profile_data ? 'mma_record_losses' THEN COALESCE((p_profile_data->>'mma_record_losses')::INTEGER, 0) ELSE mma_record_losses END,
    mma_record_draws = CASE WHEN p_profile_data ? 'mma_record_draws' THEN COALESCE((p_profile_data->>'mma_record_draws')::INTEGER, 0) ELSE mma_record_draws END,
    boxeo_record_wins = CASE WHEN p_profile_data ? 'boxeo_record_wins' THEN COALESCE((p_profile_data->>'boxeo_record_wins')::INTEGER, 0) ELSE boxeo_record_wins END,
    boxeo_record_losses = CASE WHEN p_profile_data ? 'boxeo_record_losses' THEN COALESCE((p_profile_data->>'boxeo_record_losses')::INTEGER, 0) ELSE boxeo_record_losses END,
    boxeo_record_draws = CASE WHEN p_profile_data ? 'boxeo_record_draws' THEN COALESCE((p_profile_data->>'boxeo_record_draws')::INTEGER, 0) ELSE boxeo_record_draws END,
    level = CASE WHEN p_profile_data ? 'level' THEN NULLIF(p_profile_data->>'level', '') ELSE level END,
    gender = CASE WHEN p_profile_data ? 'gender' THEN NULLIF(p_profile_data->>'gender', '') ELSE gender END,
    boxrec_url = CASE WHEN p_profile_data ? 'boxrec_url' THEN NULLIF(p_profile_data->>'boxrec_url', '') ELSE boxrec_url END,
    tapology_url = CASE WHEN p_profile_data ? 'tapology_url' THEN NULLIF(p_profile_data->>'tapology_url', '') ELSE tapology_url END,
    record_type = CASE WHEN p_profile_data ? 'record_type' THEN NULLIF(p_profile_data->>'record_type', '') ELSE record_type END,
    stance = CASE WHEN p_profile_data ? 'stance' THEN NULLIF(p_profile_data->>'stance', '') ELSE stance END,
    birthdate = CASE WHEN p_profile_data ? 'birthdate' THEN NULLIF(p_profile_data->>'birthdate', '')::DATE ELSE birthdate END,
    birthplace = CASE WHEN p_profile_data ? 'birthplace' THEN NULLIF(p_profile_data->>'birthplace', '') ELSE birthplace END,
    blood_type = CASE WHEN p_profile_data ? 'blood_type' THEN NULLIF(p_profile_data->>'blood_type', '') ELSE blood_type END,
    emergency_contact_name = CASE WHEN p_profile_data ? 'emergency_contact_name' THEN NULLIF(p_profile_data->>'emergency_contact_name', '') ELSE emergency_contact_name END,
    emergency_contact_phone = CASE WHEN p_profile_data ? 'emergency_contact_phone' THEN NULLIF(p_profile_data->>'emergency_contact_phone', '') ELSE emergency_contact_phone END,
    emergency_contact_relation = CASE WHEN p_profile_data ? 'emergency_contact_relation' THEN NULLIF(p_profile_data->>'emergency_contact_relation', '') ELSE emergency_contact_relation END,
    medical_allergies = CASE WHEN p_profile_data ? 'medical_allergies' THEN NULLIF(p_profile_data->>'medical_allergies', '') ELSE medical_allergies END,
    medical_conditions = CASE WHEN p_profile_data ? 'medical_conditions' THEN NULLIF(p_profile_data->>'medical_conditions', '') ELSE medical_conditions END,
    insurance_company = CASE WHEN p_profile_data ? 'insurance_company' THEN NULLIF(p_profile_data->>'insurance_company', '') ELSE insurance_company END,
    insurance_policy = CASE WHEN p_profile_data ? 'insurance_policy' THEN NULLIF(p_profile_data->>'insurance_policy', '') ELSE insurance_policy END,
    document_type = CASE WHEN p_profile_data ? 'document_type' THEN NULLIF(p_profile_data->>'document_type', '') ELSE document_type END,
    document_number = CASE WHEN p_profile_data ? 'document_number' THEN NULLIF(p_profile_data->>'document_number', '') ELSE document_number END,
    updated_at = now()
  WHERE id = p_fighter_id;

  -- 3. Sync changes to fighter_rankings (bidirectional sync)
  v_new_level := p_profile_data->>'level';
  v_new_weight_class := p_profile_data->>'weight_class';
  v_new_discipline := p_profile_data->>'discipline';

  IF v_new_level IS NOT NULL OR v_new_weight_class IS NOT NULL OR v_new_discipline IS NOT NULL THEN
    UPDATE fighter_rankings
    SET
      level = CASE WHEN v_new_level IS NOT NULL THEN v_new_level ELSE level END,
      weight_class = CASE WHEN v_new_weight_class IS NOT NULL THEN v_new_weight_class ELSE weight_class END,
      updated_at = now()
    WHERE fighter_id = p_fighter_id
      AND is_active = TRUE;
  END IF;
END;
$$;

-- Also fix user_update_fighter_profile to include all user-editable fields
CREATE OR REPLACE FUNCTION public.user_update_fighter_profile(
  p_fighter_id UUID,
  p_profile_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id UUID;
  v_profile_owner UUID;
  v_new_level TEXT;
  v_new_weight_class TEXT;
BEGIN
  -- 1. Get current user's app_user id
  SELECT id INTO v_user_id
  FROM app_user
  WHERE auth_user_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 2. Verify ownership
  SELECT user_id INTO v_profile_owner
  FROM fighter_profiles
  WHERE id = p_fighter_id;
  
  IF v_profile_owner != v_user_id THEN
    RAISE EXCEPTION 'You can only update your own profile';
  END IF;

  -- 3. Update fighter_profiles with all user-editable fields
  UPDATE fighter_profiles
  SET
    -- Identity fields (user can edit)
    first_name = CASE WHEN p_profile_data ? 'first_name' THEN p_profile_data->>'first_name' ELSE first_name END,
    last_name = CASE WHEN p_profile_data ? 'last_name' THEN p_profile_data->>'last_name' ELSE last_name END,
    nickname = CASE WHEN p_profile_data ? 'nickname' THEN NULLIF(p_profile_data->>'nickname', '') ELSE nickname END,
    country = CASE WHEN p_profile_data ? 'country' THEN NULLIF(p_profile_data->>'country', '') ELSE country END,
    gender = CASE WHEN p_profile_data ? 'gender' THEN NULLIF(p_profile_data->>'gender', '') ELSE gender END,
    birthdate = CASE WHEN p_profile_data ? 'birthdate' THEN NULLIF(p_profile_data->>'birthdate', '')::DATE ELSE birthdate END,
    birthplace = CASE WHEN p_profile_data ? 'birthplace' THEN NULLIF(p_profile_data->>'birthplace', '') ELSE birthplace END,
    -- Physical attributes
    height_cm = CASE WHEN p_profile_data ? 'height_cm' THEN NULLIF((p_profile_data->>'height_cm')::INTEGER, 0) ELSE height_cm END,
    weight_kg = CASE WHEN p_profile_data ? 'weight_kg' THEN NULLIF((p_profile_data->>'weight_kg')::NUMERIC, 0) ELSE weight_kg END,
    reach_cm = CASE WHEN p_profile_data ? 'reach_cm' THEN NULLIF((p_profile_data->>'reach_cm')::INTEGER, 0) ELSE reach_cm END,
    weight_class = CASE WHEN p_profile_data ? 'weight_class' THEN p_profile_data->>'weight_class' ELSE weight_class END,
    -- Combat info
    fighting_style = CASE WHEN p_profile_data ? 'fighting_style' THEN NULLIF(p_profile_data->>'fighting_style', '') ELSE fighting_style END,
    stance = CASE WHEN p_profile_data ? 'stance' THEN NULLIF(p_profile_data->>'stance', '') ELSE stance END,
    gym_name = CASE WHEN p_profile_data ? 'gym_name' THEN NULLIF(p_profile_data->>'gym_name', '') ELSE gym_name END,
    level = CASE WHEN p_profile_data ? 'level' THEN NULLIF(p_profile_data->>'level', '') ELSE level END,
    -- Records (only if not locked by license)
    record_wins = CASE WHEN p_profile_data ? 'record_wins' THEN COALESCE((p_profile_data->>'record_wins')::INTEGER, 0) ELSE record_wins END,
    record_losses = CASE WHEN p_profile_data ? 'record_losses' THEN COALESCE((p_profile_data->>'record_losses')::INTEGER, 0) ELSE record_losses END,
    record_draws = CASE WHEN p_profile_data ? 'record_draws' THEN COALESCE((p_profile_data->>'record_draws')::INTEGER, 0) ELSE record_draws END,
    record_type = CASE WHEN p_profile_data ? 'record_type' THEN NULLIF(p_profile_data->>'record_type', '') ELSE record_type END,
    -- Bio and links
    bio = CASE WHEN p_profile_data ? 'bio' THEN NULLIF(p_profile_data->>'bio', '') ELSE bio END,
    boxrec_url = CASE WHEN p_profile_data ? 'boxrec_url' THEN NULLIF(p_profile_data->>'boxrec_url', '') ELSE boxrec_url END,
    tapology_url = CASE WHEN p_profile_data ? 'tapology_url' THEN NULLIF(p_profile_data->>'tapology_url', '') ELSE tapology_url END,
    -- Medical and emergency
    blood_type = CASE WHEN p_profile_data ? 'blood_type' THEN NULLIF(p_profile_data->>'blood_type', '') ELSE blood_type END,
    emergency_contact_name = CASE WHEN p_profile_data ? 'emergency_contact_name' THEN NULLIF(p_profile_data->>'emergency_contact_name', '') ELSE emergency_contact_name END,
    emergency_contact_phone = CASE WHEN p_profile_data ? 'emergency_contact_phone' THEN NULLIF(p_profile_data->>'emergency_contact_phone', '') ELSE emergency_contact_phone END,
    emergency_contact_relation = CASE WHEN p_profile_data ? 'emergency_contact_relation' THEN NULLIF(p_profile_data->>'emergency_contact_relation', '') ELSE emergency_contact_relation END,
    medical_allergies = CASE WHEN p_profile_data ? 'medical_allergies' THEN NULLIF(p_profile_data->>'medical_allergies', '') ELSE medical_allergies END,
    medical_conditions = CASE WHEN p_profile_data ? 'medical_conditions' THEN NULLIF(p_profile_data->>'medical_conditions', '') ELSE medical_conditions END,
    insurance_company = CASE WHEN p_profile_data ? 'insurance_company' THEN NULLIF(p_profile_data->>'insurance_company', '') ELSE insurance_company END,
    insurance_policy = CASE WHEN p_profile_data ? 'insurance_policy' THEN NULLIF(p_profile_data->>'insurance_policy', '') ELSE insurance_policy END,
    -- Avatar
    avatar_url = CASE WHEN p_profile_data ? 'avatar_url' THEN NULLIF(p_profile_data->>'avatar_url', '') ELSE avatar_url END,
    -- Document
    document_image_url = CASE WHEN p_profile_data ? 'document_image_url' THEN NULLIF(p_profile_data->>'document_image_url', '') ELSE document_image_url END,
    updated_at = now()
  WHERE id = p_fighter_id;

  -- 4. Sync level and weight_class to fighter_rankings
  v_new_level := p_profile_data->>'level';
  v_new_weight_class := p_profile_data->>'weight_class';

  IF v_new_level IS NOT NULL OR v_new_weight_class IS NOT NULL THEN
    UPDATE fighter_rankings
    SET
      level = CASE WHEN v_new_level IS NOT NULL THEN v_new_level ELSE level END,
      weight_class = CASE WHEN v_new_weight_class IS NOT NULL THEN v_new_weight_class ELSE weight_class END,
      updated_at = now()
    WHERE fighter_id = p_fighter_id
      AND is_active = TRUE;
  END IF;
END;
$$;