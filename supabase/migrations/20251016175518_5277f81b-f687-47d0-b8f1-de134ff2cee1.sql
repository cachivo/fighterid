-- Migration: Identify fighter profiles with incomplete critical data
-- Purpose: Diagnostic query to identify all licenses with missing required fields

-- Create a view for easy monitoring of incomplete profiles
CREATE OR REPLACE VIEW incomplete_fighter_profiles AS
SELECT 
  fl.id as license_id,
  fl.license_number,
  fl.status as license_status,
  fp.id as fighter_id,
  fp.first_name,
  fp.last_name,
  au.email,
  au.phone as user_phone,
  fp.birthdate,
  fp.gender,
  fp.blood_type,
  fp.emergency_contact_name,
  fp.emergency_contact_phone,
  ARRAY_REMOVE(ARRAY[
    CASE WHEN fp.birthdate IS NULL THEN 'birthdate' END,
    CASE WHEN fp.gender IS NULL THEN 'gender' END,
    CASE WHEN au.phone IS NULL THEN 'phone' END,
    CASE WHEN fp.blood_type IS NULL THEN 'blood_type' END,
    CASE WHEN fp.emergency_contact_name IS NULL THEN 'emergency_contact_name' END,
    CASE WHEN fp.emergency_contact_phone IS NULL THEN 'emergency_contact_phone' END
  ], NULL) as missing_fields,
  fl.created_at as license_created_at,
  fl.approved_at
FROM fighter_licenses fl
JOIN fighter_profiles fp ON fp.id = fl.fighter_id
JOIN app_user au ON au.id = fp.user_id
WHERE fl.status IN ('ACTIVE', 'PENDING_REVIEW')
  AND (
    fp.birthdate IS NULL OR 
    fp.gender IS NULL OR 
    au.phone IS NULL OR
    fp.blood_type IS NULL OR
    fp.emergency_contact_name IS NULL OR
    fp.emergency_contact_phone IS NULL
  );

-- Add comment to the view
COMMENT ON VIEW incomplete_fighter_profiles IS 
'View showing all fighter profiles with missing critical data fields. Used for monitoring and notifications.';

-- Create index on fighter_profiles for faster queries
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_critical_fields 
ON fighter_profiles (birthdate, gender, blood_type, emergency_contact_name, emergency_contact_phone)
WHERE birthdate IS NULL OR gender IS NULL OR blood_type IS NULL OR emergency_contact_name IS NULL OR emergency_contact_phone IS NULL;

-- Create index on app_user for phone field
CREATE INDEX IF NOT EXISTS idx_app_user_phone 
ON app_user (phone)
WHERE phone IS NULL;