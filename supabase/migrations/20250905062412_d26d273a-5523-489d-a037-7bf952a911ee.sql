-- Fix the admin_update_fighter_profile_v2 function to handle discipline type conversion properly
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v2(p_fighter_id uuid, p_profile_data jsonb, p_admin_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- Verificar si el usuario proporcionado es admin
  SELECT is_admin INTO v_is_admin
  FROM public.app_user 
  WHERE id = p_admin_user_id;
  
  -- Si no se encuentra el usuario o no es admin, rechazar
  IF NOT FOUND OR v_is_admin IS FALSE THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin or does not exist';
  END IF;

  -- Actualizar el perfil con manejo mejorado de martial_arts y discipline
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
    -- Fix discipline handling - ensure proper type casting
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' THEN
        CASE 
          WHEN p_profile_data->>'discipline' IS NULL OR p_profile_data->>'discipline' = '' OR p_profile_data->>'discipline' = 'null' THEN NULL
          WHEN p_profile_data->>'discipline' = 'MMA' THEN 'MMA'::discipline_type
          WHEN p_profile_data->>'discipline' = 'Boxeo' THEN 'Boxeo'::discipline_type
          WHEN p_profile_data->>'discipline' = 'Judo' THEN 'Judo'::discipline_type
          WHEN p_profile_data->>'discipline' = 'JiuJitsu' THEN 'JiuJitsu'::discipline_type
          WHEN p_profile_data->>'discipline' = 'Kickboxing' THEN 'Kickboxing'::discipline_type
          WHEN p_profile_data->>'discipline' = 'MuayThai' THEN 'MuayThai'::discipline_type
          WHEN p_profile_data->>'discipline' = 'Grappling' THEN 'Grappling'::discipline_type
          WHEN p_profile_data->>'discipline' = 'Otro' THEN 'Otro'::discipline_type
          ELSE discipline
        END
      ELSE discipline
    END,
    -- Handle other fields
    gender = CASE 
      WHEN p_profile_data ? 'gender' THEN
        CASE 
          WHEN p_profile_data->>'gender' IS NULL OR p_profile_data->>'gender' = '' OR p_profile_data->>'gender' = 'null' THEN NULL
          ELSE (p_profile_data->>'gender')::text
        END
      ELSE gender
    END,
    sherdog_url = CASE 
      WHEN p_profile_data ? 'sherdog_url' THEN
        CASE 
          WHEN p_profile_data->>'sherdog_url' IS NULL OR p_profile_data->>'sherdog_url' = '' OR p_profile_data->>'sherdog_url' = 'null' THEN NULL
          ELSE (p_profile_data->>'sherdog_url')::text
        END
      ELSE sherdog_url
    END,
    tapology_url = CASE 
      WHEN p_profile_data ? 'tapology_url' THEN
        CASE 
          WHEN p_profile_data->>'tapology_url' IS NULL OR p_profile_data->>'tapology_url' = '' OR p_profile_data->>'tapology_url' = 'null' THEN NULL
          ELSE (p_profile_data->>'tapology_url')::text
        END
      ELSE tapology_url
    END,
    stance = CASE 
      WHEN p_profile_data ? 'stance' THEN
        CASE 
          WHEN p_profile_data->>'stance' IS NULL OR p_profile_data->>'stance' = '' OR p_profile_data->>'stance' = 'null' THEN NULL
          ELSE (p_profile_data->>'stance')::text
        END
      ELSE stance
    END,
    level = CASE 
      WHEN p_profile_data ? 'level' THEN
        CASE 
          WHEN p_profile_data->>'level' IS NULL OR p_profile_data->>'level' = '' OR p_profile_data->>'level' = 'null' THEN NULL
          ELSE (p_profile_data->>'level')::text
        END
      ELSE level
    END,
    -- Handle emergency contact fields
    emergency_contact_name = CASE 
      WHEN p_profile_data ? 'emergency_contact_name' THEN
        CASE 
          WHEN p_profile_data->>'emergency_contact_name' IS NULL OR p_profile_data->>'emergency_contact_name' = '' OR p_profile_data->>'emergency_contact_name' = 'null' THEN NULL
          ELSE (p_profile_data->>'emergency_contact_name')::text
        END
      ELSE emergency_contact_name
    END,
    emergency_contact_relation = CASE 
      WHEN p_profile_data ? 'emergency_contact_relation' THEN
        CASE 
          WHEN p_profile_data->>'emergency_contact_relation' IS NULL OR p_profile_data->>'emergency_contact_relation' = '' OR p_profile_data->>'emergency_contact_relation' = 'null' THEN NULL
          ELSE (p_profile_data->>'emergency_contact_relation')::text
        END
      ELSE emergency_contact_relation
    END,
    emergency_contact_phone = CASE 
      WHEN p_profile_data ? 'emergency_contact_phone' THEN
        CASE 
          WHEN p_profile_data->>'emergency_contact_phone' IS NULL OR p_profile_data->>'emergency_contact_phone' = '' OR p_profile_data->>'emergency_contact_phone' = 'null' THEN NULL
          ELSE (p_profile_data->>'emergency_contact_phone')::text
        END
      ELSE emergency_contact_phone
    END,
    -- Handle bio field
    bio = CASE 
      WHEN p_profile_data ? 'bio' THEN
        CASE 
          WHEN p_profile_data->>'bio' IS NULL OR p_profile_data->>'bio' = '' OR p_profile_data->>'bio' = 'null' THEN NULL
          ELSE (p_profile_data->>'bio')::text
        END
      ELSE bio
    END,
    updated_at = now()
  WHERE id = p_fighter_id;
  
  -- Verificar que al menos una fila fue actualizada
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter profile not found with id: %', p_fighter_id;
  END IF;
END;
$function$;

-- Create function to reprocess approved but unapplied profile change requests
CREATE OR REPLACE FUNCTION public.reprocess_approved_profile_changes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  request_record RECORD;
  admin_user_record RECORD;
BEGIN
  -- Only admins can run this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can reprocess profile changes';
  END IF;

  -- Get first admin user to use as the processor
  SELECT id INTO admin_user_record FROM public.app_user WHERE is_admin = true LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No admin user found to process changes';
  END IF;

  -- Process all approved requests that haven't been applied
  FOR request_record IN 
    SELECT id, fighter_profile_id, requested_changes 
    FROM public.profile_change_requests 
    WHERE status = 'APPROVED' 
  LOOP
    BEGIN
      -- Apply the changes using the fixed function
      PERFORM public.admin_update_fighter_profile_v2(
        request_record.fighter_profile_id, 
        request_record.requested_changes,
        admin_user_record.id
      );
      
      -- Update request status to indicate it was applied
      UPDATE public.profile_change_requests 
      SET 
        status = 'APPLIED',
        admin_notes = COALESCE(admin_notes, '') || ' [Auto-applied during reprocessing]',
        updated_at = now()
      WHERE id = request_record.id;
      
      RAISE NOTICE 'Successfully applied changes for request ID: %', request_record.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to apply changes for request ID: %. Error: %', request_record.id, SQLERRM;
    END;
  END LOOP;
END;
$function$;