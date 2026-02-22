
CREATE OR REPLACE FUNCTION public.check_user_license_status(p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_user_id uuid;
  v_app_email text;
  v_profile record;
  v_license record;
BEGIN
  SELECT id, email INTO v_app_user_id, v_app_email
  FROM app_user
  WHERE auth_user_id = p_auth_user_id
  LIMIT 1;

  IF v_app_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'no_user', 'message', 'No app_user found');
  END IF;

  SELECT * INTO v_profile
  FROM fighter_profiles
  WHERE user_id = v_app_user_id AND active = true
  LIMIT 1;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('status', 'no_profile', 'message', 'No active fighter profile');
  END IF;

  IF v_profile.primary_license_id IS NOT NULL THEN
    SELECT * INTO v_license
    FROM fighter_licenses
    WHERE id = v_profile.primary_license_id;
  END IF;

  IF v_license IS NULL THEN
    SELECT * INTO v_license
    FROM fighter_licenses
    WHERE fighter_id = v_profile.id
    ORDER BY
      CASE status
        WHEN 'ACTIVE' THEN 1
        WHEN 'PENDING_REVIEW' THEN 2
        WHEN 'SUSPENDED' THEN 3
        ELSE 4
      END,
      created_at DESC
    LIMIT 1;
  END IF;

  DECLARE
    v_profile_json jsonb;
  BEGIN
    v_profile_json := jsonb_build_object(
      'id', v_profile.id,
      'user_id', v_profile.user_id,
      'first_name', v_profile.first_name,
      'last_name', v_profile.last_name,
      'nickname', v_profile.nickname,
      'avatar_url', v_profile.avatar_url,
      'weight_class', v_profile.weight_class,
      'country', v_profile.country,
      'gym_id', v_profile.gym_id,
      'gym_name', v_profile.gym_name,
      'stance', v_profile.stance,
      'primary_discipline', v_profile.primary_discipline,
      'license_status', v_profile.license_status,
      'license_number', v_profile.license_number,
      'primary_license_id', v_profile.primary_license_id,
      'wins', v_profile.wins,
      'losses', v_profile.losses,
      'draws', v_profile.draws,
      'date_of_birth', v_profile.date_of_birth,
      'height_cm', v_profile.height_cm,
      'reach_cm', v_profile.reach_cm,
      'coach_id', v_profile.coach_id
    );

    IF v_license IS NULL THEN
      RETURN jsonb_build_object(
        'status', 'no_license',
        'user_id', v_app_user_id,
        'email', v_app_email,
        'profile', v_profile_json
      );
    END IF;

    DECLARE
      v_license_json jsonb;
      v_status text;
    BEGIN
      v_license_json := jsonb_build_object(
        'id', v_license.id,
        'license_number', v_license.license_number,
        'status', v_license.status,
        'license_level', v_license.license_level,
        'issued_at', v_license.issued_at,
        'expires_at', v_license.expires_at,
        'is_primary', v_license.is_primary,
        'qr_code_url', v_license.qr_code_url,
        'created_at', v_license.created_at,
        'fighter_id', v_license.fighter_id
      );

      IF v_license.status = 'ACTIVE' THEN
        v_status := 'active_license';
      ELSIF v_license.status = 'PENDING_REVIEW' THEN
        v_status := 'pending_license';
      ELSIF v_license.status = 'SUSPENDED' THEN
        v_status := 'suspended_license';
      ELSE
        v_status := 'no_license';
      END IF;

      RETURN jsonb_build_object(
        'status', v_status,
        'user_id', v_app_user_id,
        'email', v_app_email,
        'profile', v_profile_json,
        'license', v_license_json
      );
    END;
  END;
END;
$$;
