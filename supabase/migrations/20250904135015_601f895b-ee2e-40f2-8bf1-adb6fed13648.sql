-- Create admin function to safely delete fighter profiles
CREATE OR REPLACE FUNCTION public.admin_delete_fighter_profile(p_fighter_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete fighter profiles';
  END IF;

  -- Delete related data in cascade order
  
  -- Delete fight bookings
  DELETE FROM public.fight_bookings 
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Delete medical certifications
  DELETE FROM public.medical_certifications
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Delete license documents
  DELETE FROM public.license_documents
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Delete license verification tokens
  DELETE FROM public.license_verification_tokens
  WHERE license_id IN (
    SELECT id FROM public.fighter_licenses WHERE fighter_id = p_fighter_id
  );
  
  -- Delete audit logs (keep for history)
  -- We keep audit logs for compliance/history tracking
  
  -- Delete fighter licenses
  DELETE FROM public.fighter_licenses WHERE fighter_id = p_fighter_id;
  
  -- Delete fighter status updates
  DELETE FROM public.fighter_status_updates WHERE fighter_id = p_fighter_id;
  
  -- Delete fights history references
  UPDATE public.fights_history 
  SET red_fighter_id = NULL 
  WHERE red_fighter_id = p_fighter_id;
  
  UPDATE public.fights_history 
  SET blue_fighter_id = NULL 
  WHERE blue_fighter_id = p_fighter_id;
  
  -- Delete fight references
  UPDATE public.fights 
  SET fighter_a_id = NULL, winner_id = NULL 
  WHERE fighter_a_id = p_fighter_id OR winner_id = p_fighter_id;
  
  UPDATE public.fights 
  SET fighter_b_id = NULL, winner_id = NULL 
  WHERE fighter_b_id = p_fighter_id OR winner_id = p_fighter_id;
  
  -- Finally delete the fighter profile
  DELETE FROM public.fighter_profiles WHERE id = p_fighter_id;
END;
$function$;