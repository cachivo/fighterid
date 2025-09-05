-- Fix the admin_update_fighter_profile function to handle discipline casting properly
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v3(p_fighter_id uuid, p_profile_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Update the profile with improved handling of all fields
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = COALESCE((p_profile_data->>'nickname')::text, nickname),
    country = COALESCE((p_profile_data->>'country')::text, country),
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    avatar_url = COALESCE((p_profile_data->>'avatar_url')::text, avatar_url),
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
    
    -- Handle discipline enum type with better validation
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' 
           AND p_profile_data->>'discipline' IS NOT NULL 
           AND p_profile_data->>'discipline' != '' 
           AND p_profile_data->>'discipline' != 'null' 
           AND p_profile_data->>'discipline' IN ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro') THEN
        (p_profile_data->>'discipline')::discipline_type
      ELSE discipline
    END,
    
    -- Handle all other fields with proper null handling
    document_type = CASE 
      WHEN p_profile_data ? 'document_type' AND p_profile_data->>'document_type' NOT IN ('', 'null') THEN
        (p_profile_data->>'document_type')::text
      ELSE document_type
    END,
    
    document_number = CASE 
      WHEN p_profile_data ? 'document_number' AND p_profile_data->>'document_number' NOT IN ('', 'null') THEN
        (p_profile_data->>'document_number')::text
      ELSE document_number
    END,
    
    birthdate = CASE 
      WHEN p_profile_data ? 'birthdate' AND p_profile_data->>'birthdate' NOT IN ('', 'null') THEN
        (p_profile_data->>'birthdate')::date
      ELSE birthdate
    END,
    
    blood_type = CASE 
      WHEN p_profile_data ? 'blood_type' AND p_profile_data->>'blood_type' NOT IN ('', 'null') THEN
        (p_profile_data->>'blood_type')::text
      ELSE blood_type
    END,
    
    height_cm = CASE 
      WHEN p_profile_data ? 'height_cm' AND p_profile_data->>'height_cm' NOT IN ('', 'null') THEN
        (p_profile_data->>'height_cm')::integer
      ELSE height_cm
    END,
    
    weight_kg = CASE 
      WHEN p_profile_data ? 'weight_kg' AND p_profile_data->>'weight_kg' NOT IN ('', 'null') THEN
        (p_profile_data->>'weight_kg')::numeric
      ELSE weight_kg
    END,
    
    reach_cm = CASE 
      WHEN p_profile_data ? 'reach_cm' AND p_profile_data->>'reach_cm' NOT IN ('', 'null') THEN
        (p_profile_data->>'reach_cm')::integer
      ELSE reach_cm
    END,
    
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' AND p_profile_data->>'fighting_style' NOT IN ('', 'null') THEN
        (p_profile_data->>'fighting_style')::text
      ELSE fighting_style
    END,
    
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' AND p_profile_data->>'gym_name' NOT IN ('', 'null') THEN
        (p_profile_data->>'gym_name')::text
      ELSE gym_name
    END,
    
    medical_conditions = CASE 
      WHEN p_profile_data ? 'medical_conditions' AND p_profile_data->>'medical_conditions' NOT IN ('', 'null') THEN
        (p_profile_data->>'medical_conditions')::text
      ELSE medical_conditions
    END,
    
    medical_allergies = CASE 
      WHEN p_profile_data ? 'medical_allergies' AND p_profile_data->>'medical_allergies' NOT IN ('', 'null') THEN
        (p_profile_data->>'medical_allergies')::text
      ELSE medical_allergies
    END,
    
    gender = CASE 
      WHEN p_profile_data ? 'gender' AND p_profile_data->>'gender' NOT IN ('', 'null') THEN
        (p_profile_data->>'gender')::text
      ELSE gender
    END,
    
    stance = CASE 
      WHEN p_profile_data ? 'stance' AND p_profile_data->>'stance' NOT IN ('', 'null') THEN
        (p_profile_data->>'stance')::text
      ELSE stance
    END,
    
    level = CASE 
      WHEN p_profile_data ? 'level' AND p_profile_data->>'level' NOT IN ('', 'null') THEN
        (p_profile_data->>'level')::text
      ELSE level
    END,
    
    emergency_contact_name = CASE 
      WHEN p_profile_data ? 'emergency_contact_name' AND p_profile_data->>'emergency_contact_name' NOT IN ('', 'null') THEN
        (p_profile_data->>'emergency_contact_name')::text
      ELSE emergency_contact_name
    END,
    
    emergency_contact_relation = CASE 
      WHEN p_profile_data ? 'emergency_contact_relation' AND p_profile_data->>'emergency_contact_relation' NOT IN ('', 'null') THEN
        (p_profile_data->>'emergency_contact_relation')::text
      ELSE emergency_contact_relation
    END,
    
    emergency_contact_phone = CASE 
      WHEN p_profile_data ? 'emergency_contact_phone' AND p_profile_data->>'emergency_contact_phone' NOT IN ('', 'null') THEN
        (p_profile_data->>'emergency_contact_phone')::text
      ELSE emergency_contact_phone
    END,
    
    bio = CASE 
      WHEN p_profile_data ? 'bio' AND p_profile_data->>'bio' NOT IN ('', 'null') THEN
        (p_profile_data->>'bio')::text
      ELSE bio
    END,
    
    updated_at = now()
  WHERE id = p_fighter_id;
  
  -- Verify that at least one row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter profile not found with id: %', p_fighter_id;
  END IF;
END;
$function$;