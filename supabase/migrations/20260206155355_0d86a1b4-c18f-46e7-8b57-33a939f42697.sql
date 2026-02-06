-- Fix: RPC check_user_license_status now prioritizes primary_license_id from fighter_profiles
-- This ensures consistency when the profile already has an assigned primary license

CREATE OR REPLACE FUNCTION public.check_user_license_status(p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_app_user record;
  v_profile record;
  v_license record;
BEGIN
  -- 1. Get app_user
  SELECT id, email, phone INTO v_app_user
  FROM app_user 
  WHERE auth_user_id = p_auth_user_id;
  
  IF v_app_user IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'no_user',
      'message', 'No app_user found for this auth user'
    );
  END IF;
  
  -- 2. Get active fighter profile
  SELECT * INTO v_profile
  FROM fighter_profiles
  WHERE user_id = v_app_user.id 
    AND active = true;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'no_profile',
      'user_id', v_app_user.id,
      'email', v_app_user.email
    );
  END IF;
  
  -- 3. PRIORITY: If profile has primary_license_id, fetch that license directly
  IF v_profile.primary_license_id IS NOT NULL THEN
    SELECT id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url, created_at
    INTO v_license
    FROM fighter_licenses
    WHERE id = v_profile.primary_license_id;
    
    IF v_license IS NOT NULL THEN
      IF v_license.status = 'ACTIVE' THEN
        RETURN jsonb_build_object(
          'status', 'active_license',
          'license', jsonb_build_object(
            'id', v_license.id,
            'license_number', v_license.license_number,
            'status', v_license.status,
            'license_level', v_license.license_level,
            'issued_at', v_license.issued_at,
            'expires_at', v_license.expires_at,
            'is_primary', v_license.is_primary,
            'qr_code_url', v_license.qr_code_url,
            'created_at', v_license.created_at
          ),
          'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
        );
      ELSIF v_license.status IN ('PENDING_REVIEW', 'APPLIED') THEN
        RETURN jsonb_build_object(
          'status', 'pending_license',
          'license', jsonb_build_object(
            'id', v_license.id,
            'license_number', v_license.license_number,
            'status', v_license.status,
            'license_level', v_license.license_level,
            'issued_at', v_license.issued_at,
            'expires_at', v_license.expires_at,
            'is_primary', v_license.is_primary,
            'qr_code_url', v_license.qr_code_url,
            'created_at', v_license.created_at
          ),
          'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
        );
      ELSIF v_license.status = 'SUSPENDED' THEN
        RETURN jsonb_build_object(
          'status', 'suspended_license',
          'license', jsonb_build_object(
            'id', v_license.id,
            'license_number', v_license.license_number,
            'status', v_license.status,
            'license_level', v_license.license_level,
            'issued_at', v_license.issued_at,
            'expires_at', v_license.expires_at,
            'is_primary', v_license.is_primary,
            'qr_code_url', v_license.qr_code_url,
            'created_at', v_license.created_at
          ),
          'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
        );
      END IF;
    END IF;
  END IF;
  
  -- 4. FALLBACK: Search by fighter_id for ACTIVE license
  SELECT id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url, created_at
  INTO v_license
  FROM fighter_licenses
  WHERE fighter_id = v_profile.id
    AND status = 'ACTIVE'
    AND is_primary = true;
  
  IF v_license IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'active_license',
      'license', jsonb_build_object(
        'id', v_license.id,
        'license_number', v_license.license_number,
        'status', v_license.status,
        'license_level', v_license.license_level,
        'issued_at', v_license.issued_at,
        'expires_at', v_license.expires_at,
        'is_primary', v_license.is_primary,
        'qr_code_url', v_license.qr_code_url,
        'created_at', v_license.created_at
      ),
      'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
    );
  END IF;
  
  -- 5. FALLBACK: Check for pending/applied license
  SELECT id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url, created_at
  INTO v_license
  FROM fighter_licenses
  WHERE fighter_id = v_profile.id
    AND status IN ('PENDING_REVIEW', 'APPLIED')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_license IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'pending_license',
      'license', jsonb_build_object(
        'id', v_license.id,
        'license_number', v_license.license_number,
        'status', v_license.status,
        'license_level', v_license.license_level,
        'issued_at', v_license.issued_at,
        'expires_at', v_license.expires_at,
        'is_primary', v_license.is_primary,
        'qr_code_url', v_license.qr_code_url,
        'created_at', v_license.created_at
      ),
      'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
    );
  END IF;
  
  -- 6. Has profile but no license at all
  RETURN jsonb_build_object(
    'status', 'no_license',
    'profile', to_jsonb(v_profile) || jsonb_build_object('phone', v_app_user.phone)
  );
END;
$$;

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION public.check_user_license_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_license_status(uuid) TO service_role;