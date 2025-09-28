-- Fix RLS policies that are preventing profile creation
-- The current policies are too restrictive and cause race conditions

-- 1. Create a transactional function for profile + license creation (fixed parameter order)
CREATE OR REPLACE FUNCTION public.create_fighter_profile_with_license(
  p_auth_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_country text,
  p_weight_class text,
  p_height_cm integer,
  p_weight_kg numeric,
  p_phone text DEFAULT NULL,
  p_birthdate date DEFAULT NULL,
  p_nickname text DEFAULT NULL,
  p_reach_cm integer DEFAULT NULL,
  p_discipline discipline_type DEFAULT NULL,
  p_martial_arts text[] DEFAULT ARRAY[]::text[],
  p_gym_name text DEFAULT NULL,
  p_fighting_style text DEFAULT NULL,
  p_stance text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_record_wins integer DEFAULT 0,
  p_record_losses integer DEFAULT 0,
  p_record_draws integer DEFAULT 0,
  p_record_type text DEFAULT 'Amateur',
  p_gender text DEFAULT NULL,
  p_bio text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_license_id uuid;
  v_license_number text;
  v_result jsonb;
BEGIN
  -- Check if user exists, create if not
  SELECT id INTO v_user_id
  FROM public.app_user
  WHERE auth_user_id = p_auth_user_id;
  
  IF v_user_id IS NULL THEN
    INSERT INTO public.app_user (
      auth_user_id, email, phone, birthdate, 
      handle, is_admin, country
    ) VALUES (
      p_auth_user_id, 
      p_email, 
      p_phone, 
      p_birthdate,
      LOWER(p_first_name || '_' || p_last_name || '_' || extract(epoch from now())::text),
      false,
      p_country
    )
    RETURNING id INTO v_user_id;
  ELSE
    -- Update existing user
    UPDATE public.app_user 
    SET phone = COALESCE(p_phone, phone),
        birthdate = COALESCE(p_birthdate, birthdate),
        country = COALESCE(p_country, country)
    WHERE id = v_user_id;
  END IF;
  
  -- Check if profile already exists
  SELECT id INTO v_profile_id
  FROM public.fighter_profiles
  WHERE user_id = v_user_id AND active = true;
  
  IF v_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an active fighter profile';
  END IF;
  
  -- Create fighter profile
  INSERT INTO public.fighter_profiles (
    user_id, first_name, last_name, nickname, country, weight_class,
    height_cm, weight_kg, reach_cm, discipline, martial_arts,
    gym_name, fighting_style, stance, level,
    record_wins, record_losses, record_draws, record_type,
    gender, bio, active
  ) VALUES (
    v_user_id, p_first_name, p_last_name, p_nickname, p_country, p_weight_class,
    p_height_cm, p_weight_kg, p_reach_cm, p_discipline, p_martial_arts,
    p_gym_name, p_fighting_style, p_stance, p_level,
    p_record_wins, p_record_losses, p_record_draws, p_record_type,
    p_gender, p_bio, true
  )
  RETURNING id INTO v_profile_id;
  
  -- Generate license number
  v_license_number := public.generate_license_number();
  
  -- Create fighter license
  INSERT INTO public.fighter_licenses (
    fighter_id, discipline, license_level, status, is_primary, license_number
  ) VALUES (
    v_profile_id, p_discipline, 'AMATEUR', 'PENDING_REVIEW', true, v_license_number
  )
  RETURNING id INTO v_license_id;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'profile_id', v_profile_id,
    'license_id', v_license_id,
    'license_number', v_license_number
  );
  
  RETURN v_result;
END;
$$;

-- 2. Update RLS policies for fighter_profiles to allow function-based creation
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil de peleador" ON public.fighter_profiles;

CREATE POLICY "Users can create their own profile via function" 
ON public.fighter_profiles FOR INSERT 
WITH CHECK (
  -- Allow if called by the transactional function
  current_setting('role') = 'authenticator' OR
  -- Or if the user owns the profile
  (EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE app_user.id = fighter_profiles.user_id 
    AND app_user.auth_user_id = auth.uid()
  ))
);

-- 3. Update RLS policies for fighter_licenses to allow function-based creation
DROP POLICY IF EXISTS "Users can create license applications" ON public.fighter_licenses;

CREATE POLICY "Users can create license applications via function" 
ON public.fighter_licenses FOR INSERT 
WITH CHECK (
  -- Allow if called by the transactional function
  current_setting('role') = 'authenticator' OR
  -- Or if the user owns the fighter profile
  (EXISTS (
    SELECT 1 FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id = fighter_licenses.fighter_id 
    AND au.auth_user_id = auth.uid()
  ))
);

-- 4. Create function to safely approve licenses with proper state sync
CREATE OR REPLACE FUNCTION public.approve_license_with_sync(
  p_license_id uuid,
  p_level license_level DEFAULT 'AMATEUR'::license_level
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fighter_id uuid;
  v_old_status license_status;
BEGIN
  -- Only admins can approve licenses
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve licenses';
  END IF;

  -- Get license info
  SELECT status, fighter_id INTO v_old_status, v_fighter_id
  FROM public.fighter_licenses 
  WHERE id = p_license_id;

  IF v_fighter_id IS NULL THEN
    RAISE EXCEPTION 'License not found';
  END IF;

  -- Update license atomically
  UPDATE public.fighter_licenses 
  SET 
    status = 'ACTIVE',
    license_level = p_level,
    approved_by = auth.uid(),
    approved_at = now(),
    version = version + 1
  WHERE id = p_license_id;

  -- Sync fighter profile license fields
  UPDATE public.fighter_profiles 
  SET 
    license_status = 'active',
    primary_license_id = p_license_id,
    updated_at = now()
  WHERE id = v_fighter_id;

  -- Log the action
  INSERT INTO public.license_audit_log (
    license_id, action, old_status, new_status,
    reason, performed_by, performed_at
  ) VALUES (
    p_license_id, 'APPROVED', v_old_status, 'ACTIVE',
    'License approved by admin', auth.uid(), now()
  );
END;
$$;