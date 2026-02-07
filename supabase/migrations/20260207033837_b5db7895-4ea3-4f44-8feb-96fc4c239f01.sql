-- Drop and recreate admin_update_fighter_profile with ::discipline fix
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

CREATE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_old_level text;
  v_new_level text;
  v_old_weight_class text;
  v_new_weight_class text;
  v_old_discipline text;
  v_new_discipline text;
BEGIN
  -- Get current values for sync
  SELECT level, weight_class, discipline 
  INTO v_old_level, v_old_weight_class, v_old_discipline
  FROM fighter_profiles 
  WHERE id = p_fighter_id;

  -- Extract new values
  v_new_level := COALESCE(p_profile_data->>'level', v_old_level);
  v_new_weight_class := COALESCE(p_profile_data->>'weight_class', v_old_weight_class);
  v_new_discipline := COALESCE(p_profile_data->>'discipline', v_old_discipline);

  -- Update the profile with ::discipline (NOT ::discipline_type)
  UPDATE fighter_profiles
  SET
    first_name = CASE WHEN p_profile_data ? 'first_name' THEN p_profile_data->>'first_name' ELSE first_name END,
    last_name = CASE WHEN p_profile_data ? 'last_name' THEN p_profile_data->>'last_name' ELSE last_name END,
    nickname = CASE WHEN p_profile_data ? 'nickname' THEN NULLIF(p_profile_data->>'nickname', '') ELSE nickname END,
    country = CASE WHEN p_profile_data ? 'country' THEN NULLIF(p_profile_data->>'country', '') ELSE country END,
    weight_class = CASE WHEN p_profile_data ? 'weight_class' THEN p_profile_data->>'weight_class' ELSE weight_class END,
    avatar_url = CASE WHEN p_profile_data ? 'avatar_url' THEN NULLIF(p_profile_data->>'avatar_url', '') ELSE avatar_url END,
    discipline = CASE WHEN p_profile_data ? 'discipline' THEN NULLIF(p_profile_data->>'discipline', '')::discipline ELSE discipline END,
    martial_arts = CASE WHEN p_profile_data ? 'martial_arts' THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts')) ELSE martial_arts END,
    record_wins = CASE WHEN p_profile_data ? 'record_wins' THEN (p_profile_data->>'record_wins')::integer ELSE record_wins END,
    record_losses = CASE WHEN p_profile_data ? 'record_losses' THEN (p_profile_data->>'record_losses')::integer ELSE record_losses END,
    record_draws = CASE WHEN p_profile_data ? 'record_draws' THEN (p_profile_data->>'record_draws')::integer ELSE record_draws END,
    mma_record_wins = CASE WHEN p_profile_data ? 'mma_record_wins' THEN (p_profile_data->>'mma_record_wins')::integer ELSE mma_record_wins END,
    mma_record_losses = CASE WHEN p_profile_data ? 'mma_record_losses' THEN (p_profile_data->>'mma_record_losses')::integer ELSE mma_record_losses END,
    mma_record_draws = CASE WHEN p_profile_data ? 'mma_record_draws' THEN (p_profile_data->>'mma_record_draws')::integer ELSE mma_record_draws END,
    boxeo_record_wins = CASE WHEN p_profile_data ? 'boxeo_record_wins' THEN (p_profile_data->>'boxeo_record_wins')::integer ELSE boxeo_record_wins END,
    boxeo_record_losses = CASE WHEN p_profile_data ? 'boxeo_record_losses' THEN (p_profile_data->>'boxeo_record_losses')::integer ELSE boxeo_record_losses END,
    boxeo_record_draws = CASE WHEN p_profile_data ? 'boxeo_record_draws' THEN (p_profile_data->>'boxeo_record_draws')::integer ELSE boxeo_record_draws END,
    level = CASE WHEN p_profile_data ? 'level' THEN p_profile_data->>'level' ELSE level END,
    gender = CASE WHEN p_profile_data ? 'gender' THEN NULLIF(p_profile_data->>'gender', '') ELSE gender END,
    height_cm = CASE WHEN p_profile_data ? 'height_cm' THEN NULLIF(p_profile_data->>'height_cm', '0')::numeric ELSE height_cm END,
    weight_kg = CASE WHEN p_profile_data ? 'weight_kg' THEN NULLIF(p_profile_data->>'weight_kg', '0')::numeric ELSE weight_kg END,
    reach_cm = CASE WHEN p_profile_data ? 'reach_cm' THEN NULLIF(p_profile_data->>'reach_cm', '0')::numeric ELSE reach_cm END,
    bio = CASE WHEN p_profile_data ? 'bio' THEN NULLIF(p_profile_data->>'bio', '') ELSE bio END,
    fighting_style = CASE WHEN p_profile_data ? 'fighting_style' THEN NULLIF(p_profile_data->>'fighting_style', '') ELSE fighting_style END,
    gym_name = CASE WHEN p_profile_data ? 'gym_name' THEN NULLIF(p_profile_data->>'gym_name', '') ELSE gym_name END,
    birthdate = CASE WHEN p_profile_data ? 'birthdate' THEN NULLIF(p_profile_data->>'birthdate', '')::date ELSE birthdate END,
    birthplace = CASE WHEN p_profile_data ? 'birthplace' THEN NULLIF(p_profile_data->>'birthplace', '') ELSE birthplace END,
    blood_type = CASE WHEN p_profile_data ? 'blood_type' THEN NULLIF(p_profile_data->>'blood_type', '') ELSE blood_type END,
    medical_allergies = CASE WHEN p_profile_data ? 'medical_allergies' THEN NULLIF(p_profile_data->>'medical_allergies', '') ELSE medical_allergies END,
    medical_conditions = CASE WHEN p_profile_data ? 'medical_conditions' THEN NULLIF(p_profile_data->>'medical_conditions', '') ELSE medical_conditions END,
    emergency_contact_name = CASE WHEN p_profile_data ? 'emergency_contact_name' THEN NULLIF(p_profile_data->>'emergency_contact_name', '') ELSE emergency_contact_name END,
    emergency_contact_phone = CASE WHEN p_profile_data ? 'emergency_contact_phone' THEN NULLIF(p_profile_data->>'emergency_contact_phone', '') ELSE emergency_contact_phone END,
    emergency_contact_relation = CASE WHEN p_profile_data ? 'emergency_contact_relation' THEN NULLIF(p_profile_data->>'emergency_contact_relation', '') ELSE emergency_contact_relation END,
    insurance_company = CASE WHEN p_profile_data ? 'insurance_company' THEN NULLIF(p_profile_data->>'insurance_company', '') ELSE insurance_company END,
    insurance_policy = CASE WHEN p_profile_data ? 'insurance_policy' THEN NULLIF(p_profile_data->>'insurance_policy', '') ELSE insurance_policy END,
    document_type = CASE WHEN p_profile_data ? 'document_type' THEN NULLIF(p_profile_data->>'document_type', '') ELSE document_type END,
    document_number = CASE WHEN p_profile_data ? 'document_number' THEN NULLIF(p_profile_data->>'document_number', '') ELSE document_number END,
    stance = CASE WHEN p_profile_data ? 'stance' THEN NULLIF(p_profile_data->>'stance', '') ELSE stance END,
    boxrec_url = CASE WHEN p_profile_data ? 'boxrec_url' THEN NULLIF(p_profile_data->>'boxrec_url', '') ELSE boxrec_url END,
    tapology_url = CASE WHEN p_profile_data ? 'tapology_url' THEN NULLIF(p_profile_data->>'tapology_url', '') ELSE tapology_url END,
    record_type = CASE WHEN p_profile_data ? 'record_type' THEN NULLIF(p_profile_data->>'record_type', '') ELSE record_type END,
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Sync level/weight_class/discipline to fighter_rankings if changed
  IF v_new_level IS DISTINCT FROM v_old_level 
     OR v_new_weight_class IS DISTINCT FROM v_old_weight_class
     OR v_new_discipline IS DISTINCT FROM v_old_discipline THEN
    UPDATE fighter_rankings
    SET 
      level = v_new_level,
      weight_class = v_new_weight_class,
      discipline = v_new_discipline,
      updated_at = now()
    WHERE fighter_id = p_fighter_id;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'admin_update_fighter_profile error: %', SQLERRM;
    RETURN FALSE;
END;
$$;