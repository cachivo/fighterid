-- Fix discipline type conversion - use direct assignment without cast
DROP FUNCTION IF EXISTS admin_update_fighter_profile_v3(uuid, jsonb);

CREATE OR REPLACE FUNCTION admin_update_fighter_profile_v3(
  p_fighter_id UUID,
  p_profile_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Update the profile with corrected discipline handling
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = CASE 
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' NOT IN ('', 'null') THEN
        (p_profile_data->>'nickname')::text
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' IN ('', 'null') THEN
        NULL
      ELSE nickname
    END,
    country = CASE 
      WHEN p_profile_data ? 'country' AND p_profile_data->>'country' NOT IN ('', 'null') THEN
        (p_profile_data->>'country')::text
      ELSE country
    END,
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    avatar_url = CASE 
      WHEN p_profile_data ? 'avatar_url' AND p_profile_data->>'avatar_url' NOT IN ('', 'null') THEN
        (p_profile_data->>'avatar_url')::text
      ELSE avatar_url
    END,
    record_wins = COALESCE((p_profile_data->>'record_wins')::integer, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::integer, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::integer, record_draws),
    elo_rating = COALESCE((p_profile_data->>'elo_rating')::integer, elo_rating),
    
    -- Handle martial_arts as JSON array
    martial_arts = CASE 
      WHEN p_profile_data ? 'martial_arts' THEN
        CASE 
          WHEN p_profile_data->'martial_arts' = 'null'::jsonb THEN NULL
          WHEN jsonb_typeof(p_profile_data->'martial_arts') = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
          ELSE martial_arts
        END
      ELSE martial_arts
    END,
    
    -- Simplified discipline handling - let postgres handle the cast automatically
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' 
           AND p_profile_data->>'discipline' IS NOT NULL 
           AND p_profile_data->>'discipline' != '' 
           AND p_profile_data->>'discipline' != 'null' 
           AND p_profile_data->>'discipline' IN ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro') THEN
        p_profile_data->>'discipline'  -- No explicit cast, let postgres handle it
      ELSE discipline
    END,
    
    -- All other text fields with proper handling
    document_type = CASE 
      WHEN p_profile_data ? 'document_type' AND p_profile_data->>'document_type' NOT IN ('', 'null') THEN
        (p_profile_data->>'document_type')::text
      WHEN p_profile_data ? 'document_type' AND p_profile_data->>'document_type' IN ('', 'null') THEN
        NULL
      ELSE document_type
    END,
    
    document_number = CASE 
      WHEN p_profile_data ? 'document_number' AND p_profile_data->>'document_number' NOT IN ('', 'null') THEN
        (p_profile_data->>'document_number')::text
      WHEN p_profile_data ? 'document_number' AND p_profile_data->>'document_number' IN ('', 'null') THEN
        NULL
      ELSE document_number
    END,
    
    birthdate = CASE 
      WHEN p_profile_data ? 'birthdate' AND p_profile_data->>'birthdate' NOT IN ('', 'null') THEN
        (p_profile_data->>'birthdate')::date
      WHEN p_profile_data ? 'birthdate' AND p_profile_data->>'birthdate' IN ('', 'null') THEN
        NULL
      ELSE birthdate
    END,
    
    birthplace = CASE 
      WHEN p_profile_data ? 'birthplace' AND p_profile_data->>'birthplace' NOT IN ('', 'null') THEN
        (p_profile_data->>'birthplace')::text
      WHEN p_profile_data ? 'birthplace' AND p_profile_data->>'birthplace' IN ('', 'null') THEN
        NULL
      ELSE birthplace
    END,
    
    blood_type = CASE 
      WHEN p_profile_data ? 'blood_type' AND p_profile_data->>'blood_type' NOT IN ('', 'null') THEN
        (p_profile_data->>'blood_type')::text
      WHEN p_profile_data ? 'blood_type' AND p_profile_data->>'blood_type' IN ('', 'null') THEN
        NULL
      ELSE blood_type
    END,
    
    height_cm = CASE 
      WHEN p_profile_data ? 'height_cm' AND p_profile_data->>'height_cm' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'height_cm')::integer
      WHEN p_profile_data ? 'height_cm' AND p_profile_data->>'height_cm' IN ('0', '', 'null') THEN
        NULL
      ELSE height_cm
    END,
    
    weight_kg = CASE 
      WHEN p_profile_data ? 'weight_kg' AND p_profile_data->>'weight_kg' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'weight_kg')::numeric
      WHEN p_profile_data ? 'weight_kg' AND p_profile_data->>'weight_kg' IN ('0', '', 'null') THEN
        NULL
      ELSE weight_kg
    END,
    
    reach_cm = CASE 
      WHEN p_profile_data ? 'reach_cm' AND p_profile_data->>'reach_cm' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'reach_cm')::integer
      WHEN p_profile_data ? 'reach_cm' AND p_profile_data->>'reach_cm' IN ('0', '', 'null') THEN
        NULL
      ELSE reach_cm
    END,
    
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' AND p_profile_data->>'fighting_style' NOT IN ('', 'null') THEN
        (p_profile_data->>'fighting_style')::text
      WHEN p_profile_data ? 'fighting_style' AND p_profile_data->>'fighting_style' IN ('', 'null') THEN
        NULL
      ELSE fighting_style
    END,
    
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' AND p_profile_data->>'gym_name' NOT IN ('', 'null') THEN
        (p_profile_data->>'gym_name')::text
      WHEN p_profile_data ? 'gym_name' AND p_profile_data->>'gym_name' IN ('', 'null') THEN
        NULL
      ELSE gym_name
    END,
    
    bio = CASE 
      WHEN p_profile_data ? 'bio' AND p_profile_data->>'bio' NOT IN ('', 'null') THEN
        (p_profile_data->>'bio')::text
      WHEN p_profile_data ? 'bio' AND p_profile_data->>'bio' IN ('', 'null') THEN
        NULL
      ELSE bio
    END,
    
    medical_conditions = CASE 
      WHEN p_profile_data ? 'medical_conditions' AND p_profile_data->>'medical_conditions' NOT IN ('', 'null') THEN
        (p_profile_data->>'medical_conditions')::text
      WHEN p_profile_data ? 'medical_conditions' AND p_profile_data->>'medical_conditions' IN ('', 'null') THEN
        NULL
      ELSE medical_conditions
    END,
    
    medical_allergies = CASE 
      WHEN p_profile_data ? 'medical_allergies' AND p_profile_data->>'medical_allergies' NOT IN ('', 'null') THEN
        (p_profile_data->>'medical_allergies')::text
      WHEN p_profile_data ? 'medical_allergies' AND p_profile_data->>'medical_allergies' IN ('', 'null') THEN
        NULL
      ELSE medical_allergies
    END,
    
    emergency_contact_name = CASE 
      WHEN p_profile_data ? 'emergency_contact_name' AND p_profile_data->>'emergency_contact_name' NOT IN ('', 'null') THEN
        (p_profile_data->>'emergency_contact_name')::text
      WHEN p_profile_data ? 'emergency_contact_name' AND p_profile_data->>'emergency_contact_name' IN ('', 'null') THEN
        NULL
      ELSE emergency_contact_name
    END,
    
    emergency_contact_phone = CASE 
      WHEN p_profile_data ? 'emergency_contact_phone' AND p_profile_data->>'emergency_contact_phone' NOT IN ('', 'null') THEN
        (p_profile_data->>'emergency_contact_phone')::text
      WHEN p_profile_data ? 'emergency_contact_phone' AND p_profile_data->>'emergency_contact_phone' IN ('', 'null') THEN
        NULL
      ELSE emergency_contact_phone
    END,
    
    emergency_contact_relation = CASE 
      WHEN p_profile_data ? 'emergency_contact_relation' AND p_profile_data->>'emergency_contact_relation' NOT IN ('', 'null') THEN
        (p_profile_data->>'emergency_contact_relation')::text
      WHEN p_profile_data ? 'emergency_contact_relation' AND p_profile_data->>'emergency_contact_relation' IN ('', 'null') THEN
        NULL
      ELSE emergency_contact_relation
    END,
    
    insurance_company = CASE 
      WHEN p_profile_data ? 'insurance_company' AND p_profile_data->>'insurance_company' NOT IN ('', 'null') THEN
        (p_profile_data->>'insurance_company')::text
      WHEN p_profile_data ? 'insurance_company' AND p_profile_data->>'insurance_company' IN ('', 'null') THEN
        NULL
      ELSE insurance_company
    END,
    
    insurance_policy = CASE 
      WHEN p_profile_data ? 'insurance_policy' AND p_profile_data->>'insurance_policy' NOT IN ('', 'null') THEN
        (p_profile_data->>'insurance_policy')::text
      WHEN p_profile_data ? 'insurance_policy' AND p_profile_data->>'insurance_policy' IN ('', 'null') THEN
        NULL
      ELSE insurance_policy
    END,
    
    stance = CASE 
      WHEN p_profile_data ? 'stance' AND p_profile_data->>'stance' NOT IN ('', 'null') THEN
        (p_profile_data->>'stance')::text
      WHEN p_profile_data ? 'stance' AND p_profile_data->>'stance' IN ('', 'null') THEN
        NULL
      ELSE stance
    END,
    
    boxrec_url = CASE 
      WHEN p_profile_data ? 'boxrec_url' AND p_profile_data->>'boxrec_url' NOT IN ('', 'null') THEN
        (p_profile_data->>'boxrec_url')::text
      WHEN p_profile_data ? 'boxrec_url' AND p_profile_data->>'boxrec_url' IN ('', 'null') THEN
        NULL
      ELSE boxrec_url
    END,
    
    tapology_url = CASE 
      WHEN p_profile_data ? 'tapology_url' AND p_profile_data->>'tapology_url' NOT IN ('', 'null') THEN
        (p_profile_data->>'tapology_url')::text
      WHEN p_profile_data ? 'tapology_url' AND p_profile_data->>'tapology_url' IN ('', 'null') THEN
        NULL
      ELSE tapology_url
    END,
    
    record_type = CASE 
      WHEN p_profile_data ? 'record_type' AND p_profile_data->>'record_type' NOT IN ('', 'null') THEN
        (p_profile_data->>'record_type')::text
      WHEN p_profile_data ? 'record_type' AND p_profile_data->>'record_type' IN ('', 'null') THEN
        NULL
      ELSE record_type
    END,
    
    gender = CASE 
      WHEN p_profile_data ? 'gender' AND p_profile_data->>'gender' NOT IN ('', 'null') THEN
        (p_profile_data->>'gender')::text
      WHEN p_profile_data ? 'gender' AND p_profile_data->>'gender' IN ('', 'null') THEN
        NULL
      ELSE gender
    END,
    
    level = CASE 
      WHEN p_profile_data ? 'level' AND p_profile_data->>'level' NOT IN ('', 'null') THEN
        (p_profile_data->>'level')::text
      ELSE level
    END,
    
    updated_at = now()
  WHERE id = p_fighter_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter with ID % not found', p_fighter_id;
  END IF;
END;
$$;