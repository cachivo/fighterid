-- ================================================================
-- FASE 1: Completar admin_update_fighter_profile con campos faltantes
-- DROP primero para evitar error de return type
-- ================================================================

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
  v_result jsonb;
  v_new_level text;
  v_new_weight_class text;
BEGIN
  -- Extract level and weight_class for ranking sync
  v_new_level := p_profile_data->>'level';
  v_new_weight_class := p_profile_data->>'weight_class';

  -- Update fighter profile with ALL fields (including 14 previously missing)
  UPDATE fighter_profiles
  SET
    -- Basic info
    first_name = CASE WHEN p_profile_data ? 'first_name' 
      THEN p_profile_data->>'first_name' ELSE first_name END,
    last_name = CASE WHEN p_profile_data ? 'last_name' 
      THEN p_profile_data->>'last_name' ELSE last_name END,
    nickname = CASE WHEN p_profile_data ? 'nickname' 
      THEN p_profile_data->>'nickname' ELSE nickname END,
    country = CASE WHEN p_profile_data ? 'country' 
      THEN p_profile_data->>'country' ELSE country END,
    
    -- Classification
    weight_class = CASE WHEN p_profile_data ? 'weight_class' 
      THEN p_profile_data->>'weight_class' ELSE weight_class END,
    level = CASE WHEN p_profile_data ? 'level' 
      THEN p_profile_data->>'level' ELSE level END,
    discipline = CASE WHEN p_profile_data ? 'discipline' 
      THEN p_profile_data->>'discipline' ELSE discipline END,
    
    -- Physical attributes
    height_cm = CASE WHEN p_profile_data ? 'height_cm' 
      THEN (p_profile_data->>'height_cm')::integer ELSE height_cm END,
    weight_kg = CASE WHEN p_profile_data ? 'weight_kg' 
      THEN (p_profile_data->>'weight_kg')::numeric ELSE weight_kg END,
    reach_cm = CASE WHEN p_profile_data ? 'reach_cm' 
      THEN (p_profile_data->>'reach_cm')::integer ELSE reach_cm END,
    
    -- Fighting style (PREVIOUSLY MISSING: stance)
    fighting_style = CASE WHEN p_profile_data ? 'fighting_style' 
      THEN p_profile_data->>'fighting_style' ELSE fighting_style END,
    stance = CASE WHEN p_profile_data ? 'stance' 
      THEN p_profile_data->>'stance' ELSE stance END,
    
    -- Profile info (PREVIOUSLY MISSING: gender)
    bio = CASE WHEN p_profile_data ? 'bio' 
      THEN p_profile_data->>'bio' ELSE bio END,
    gender = CASE WHEN p_profile_data ? 'gender' 
      THEN p_profile_data->>'gender' ELSE gender END,
    avatar_url = CASE WHEN p_profile_data ? 'avatar_url' 
      THEN p_profile_data->>'avatar_url' ELSE avatar_url END,
    
    -- Gym info
    gym_name = CASE WHEN p_profile_data ? 'gym_name' 
      THEN p_profile_data->>'gym_name' ELSE gym_name END,
    gym_id = CASE WHEN p_profile_data ? 'gym_id' 
      THEN (p_profile_data->>'gym_id')::uuid ELSE gym_id END,
    coach_id = CASE WHEN p_profile_data ? 'coach_id' 
      THEN (p_profile_data->>'coach_id')::uuid ELSE coach_id END,
    
    -- External links (PREVIOUSLY MISSING: boxrec_url, tapology_url)
    boxrec_url = CASE WHEN p_profile_data ? 'boxrec_url' 
      THEN p_profile_data->>'boxrec_url' ELSE boxrec_url END,
    tapology_url = CASE WHEN p_profile_data ? 'tapology_url' 
      THEN p_profile_data->>'tapology_url' ELSE tapology_url END,
    
    -- Martial arts
    martial_arts = CASE WHEN p_profile_data ? 'martial_arts' 
      THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
      ELSE martial_arts END,
    
    -- Personal info (PREVIOUSLY MISSING: birthdate, birthplace)
    birthdate = CASE WHEN p_profile_data ? 'birthdate' AND p_profile_data->>'birthdate' IS NOT NULL AND p_profile_data->>'birthdate' != ''
      THEN (p_profile_data->>'birthdate')::date ELSE birthdate END,
    birthplace = CASE WHEN p_profile_data ? 'birthplace' 
      THEN p_profile_data->>'birthplace' ELSE birthplace END,
    
    -- Documents (PREVIOUSLY MISSING: document_type, document_number)
    document_type = CASE WHEN p_profile_data ? 'document_type' 
      THEN p_profile_data->>'document_type' ELSE document_type END,
    document_number = CASE WHEN p_profile_data ? 'document_number' 
      THEN p_profile_data->>'document_number' ELSE document_number END,
    document_image_url = CASE WHEN p_profile_data ? 'document_image_url' 
      THEN p_profile_data->>'document_image_url' ELSE document_image_url END,
    
    -- Medical (PREVIOUSLY MISSING: blood_type, medical_allergies, medical_conditions)
    blood_type = CASE WHEN p_profile_data ? 'blood_type' 
      THEN p_profile_data->>'blood_type' ELSE blood_type END,
    medical_allergies = CASE WHEN p_profile_data ? 'medical_allergies' 
      THEN p_profile_data->>'medical_allergies' ELSE medical_allergies END,
    medical_conditions = CASE WHEN p_profile_data ? 'medical_conditions' 
      THEN p_profile_data->>'medical_conditions' ELSE medical_conditions END,
    
    -- Insurance (PREVIOUSLY MISSING: insurance_company, insurance_policy)
    insurance_company = CASE WHEN p_profile_data ? 'insurance_company' 
      THEN p_profile_data->>'insurance_company' ELSE insurance_company END,
    insurance_policy = CASE WHEN p_profile_data ? 'insurance_policy' 
      THEN p_profile_data->>'insurance_policy' ELSE insurance_policy END,
    
    -- Emergency contact (PREVIOUSLY MISSING: emergency_contact_relation)
    emergency_contact_name = CASE WHEN p_profile_data ? 'emergency_contact_name' 
      THEN p_profile_data->>'emergency_contact_name' ELSE emergency_contact_name END,
    emergency_contact_phone = CASE WHEN p_profile_data ? 'emergency_contact_phone' 
      THEN p_profile_data->>'emergency_contact_phone' ELSE emergency_contact_phone END,
    emergency_contact_relation = CASE WHEN p_profile_data ? 'emergency_contact_relation' 
      THEN p_profile_data->>'emergency_contact_relation' ELSE emergency_contact_relation END,
    
    -- Records - Legacy (PREVIOUSLY MISSING: record_type)
    record_type = CASE WHEN p_profile_data ? 'record_type' 
      THEN p_profile_data->>'record_type' ELSE record_type END,
    record_wins = CASE WHEN p_profile_data ? 'record_wins' 
      THEN (p_profile_data->>'record_wins')::integer ELSE record_wins END,
    record_losses = CASE WHEN p_profile_data ? 'record_losses' 
      THEN (p_profile_data->>'record_losses')::integer ELSE record_losses END,
    record_draws = CASE WHEN p_profile_data ? 'record_draws' 
      THEN (p_profile_data->>'record_draws')::integer ELSE record_draws END,
    
    -- Records - MMA specific
    mma_record_wins = CASE WHEN p_profile_data ? 'mma_record_wins' 
      THEN (p_profile_data->>'mma_record_wins')::integer ELSE mma_record_wins END,
    mma_record_losses = CASE WHEN p_profile_data ? 'mma_record_losses' 
      THEN (p_profile_data->>'mma_record_losses')::integer ELSE mma_record_losses END,
    mma_record_draws = CASE WHEN p_profile_data ? 'mma_record_draws' 
      THEN (p_profile_data->>'mma_record_draws')::integer ELSE mma_record_draws END,
    
    -- Records - Boxing specific
    boxeo_record_wins = CASE WHEN p_profile_data ? 'boxeo_record_wins' 
      THEN (p_profile_data->>'boxeo_record_wins')::integer ELSE boxeo_record_wins END,
    boxeo_record_losses = CASE WHEN p_profile_data ? 'boxeo_record_losses' 
      THEN (p_profile_data->>'boxeo_record_losses')::integer ELSE boxeo_record_losses END,
    boxeo_record_draws = CASE WHEN p_profile_data ? 'boxeo_record_draws' 
      THEN (p_profile_data->>'boxeo_record_draws')::integer ELSE boxeo_record_draws END,
    
    -- Status
    active = CASE WHEN p_profile_data ? 'active' 
      THEN (p_profile_data->>'active')::boolean ELSE active END,
    
    -- Timestamp
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Sync to rankings if level or weight_class changed
  IF v_new_level IS NOT NULL OR v_new_weight_class IS NOT NULL THEN
    UPDATE fighter_rankings fr
    SET 
      level = COALESCE(v_new_level, fr.level),
      weight_class = COALESCE(v_new_weight_class, fr.weight_class),
      -- Recalculate points based on discipline-specific record
      points = CASE 
        WHEN ro.discipline = 'MMA' THEN 
          (COALESCE((p_profile_data->>'mma_record_wins')::integer, 
            (SELECT mma_record_wins FROM fighter_profiles WHERE id = p_fighter_id), 0) * 3) + 
          (COALESCE((p_profile_data->>'mma_record_draws')::integer, 
            (SELECT mma_record_draws FROM fighter_profiles WHERE id = p_fighter_id), 0) * 1) - 
          (COALESCE((p_profile_data->>'mma_record_losses')::integer, 
            (SELECT mma_record_losses FROM fighter_profiles WHERE id = p_fighter_id), 0) * 1)
        WHEN ro.discipline = 'Boxeo' THEN 
          (COALESCE((p_profile_data->>'boxeo_record_wins')::integer, 
            (SELECT boxeo_record_wins FROM fighter_profiles WHERE id = p_fighter_id), 0) * 3) + 
          (COALESCE((p_profile_data->>'boxeo_record_draws')::integer, 
            (SELECT boxeo_record_draws FROM fighter_profiles WHERE id = p_fighter_id), 0) * 1) - 
          (COALESCE((p_profile_data->>'boxeo_record_losses')::integer, 
            (SELECT boxeo_record_losses FROM fighter_profiles WHERE id = p_fighter_id), 0) * 1)
        ELSE fr.points
      END,
      updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id 
      AND fr.organization_id = ro.id
      AND fr.is_active = true;
  END IF;

  -- Return updated profile
  SELECT to_jsonb(fp.*) INTO v_result
  FROM fighter_profiles fp
  WHERE fp.id = p_fighter_id;

  RETURN jsonb_build_object(
    'success', true,
    'profile', v_result
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_update_fighter_profile(uuid, jsonb) TO authenticated;