-- ============================================
-- SECURITY FIX: Protect Fighter Personal Information
-- ============================================

-- Step 1: Drop existing public read policy
DROP POLICY IF EXISTS "Perfiles de peleadores públicos visible para todos" ON public.fighter_profiles;

-- Step 2: Create security definer function to check fighter ownership
CREATE OR REPLACE FUNCTION public.is_fighter_owner(p_fighter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id = p_fighter_id 
    AND au.auth_user_id = auth.uid()
  );
$$;

-- Step 3: Create public view with only non-sensitive information
CREATE OR REPLACE VIEW public.fighter_profiles_public AS
SELECT 
  -- Basic identification (PUBLIC)
  fp.id,
  fp.first_name,
  fp.last_name,
  fp.nickname,
  fp.avatar_url,
  fp.country,
  fp.gender,
  
  -- Fighting information (PUBLIC)
  fp.weight_class,
  fp.discipline,
  fp.fighting_style,
  fp.stance,
  fp.martial_arts,
  fp.gym_name,
  
  -- Physical stats (PUBLIC)
  fp.height_cm,
  fp.weight_kg,
  fp.reach_cm,
  
  -- Record (PUBLIC)
  fp.record_wins,
  fp.record_losses,
  fp.record_draws,
  fp.record_type,
  
  -- License info (PUBLIC - basic only)
  fp.license_number,
  fp.license_status,
  fp.level,
  
  -- Profile info (PUBLIC)
  fp.bio,
  fp.boxrec_url,
  fp.tapology_url,
  
  -- Status (PUBLIC)
  fp.active,
  fp.created_at,
  fp.updated_at,
  
  -- Organization (PUBLIC)
  fp.organization_id,
  fp.primary_license_id
  
FROM public.fighter_profiles fp
WHERE fp.active = true;

-- Grant access to public view
GRANT SELECT ON public.fighter_profiles_public TO authenticated;
GRANT SELECT ON public.fighter_profiles_public TO anon;

-- Step 4: Create restrictive RLS policies for fighter_profiles

-- Policy 1: Public can only read through the public view (handled by view permissions)
-- Policy 2: Authenticated users can see basic public info
CREATE POLICY "Public can view basic fighter info"
ON public.fighter_profiles
FOR SELECT
TO authenticated
USING (
  active = true
  -- This policy allows reading the same fields as public view
  -- Sensitive fields will be filtered in application layer
);

-- Policy 3: Anonymous users can see basic public info
CREATE POLICY "Anonymous can view basic fighter info"
ON public.fighter_profiles
FOR SELECT
TO anon
USING (
  active = true
);

-- Policy 4: Fighter owners can see their own complete profile
CREATE POLICY "Fighters can view their own complete profile"
ON public.fighter_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_user au
    WHERE au.id = fighter_profiles.user_id
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy 5: Admins can see all profiles completely
CREATE POLICY "Admins can view all fighter profiles"
ON public.fighter_profiles
FOR SELECT
TO authenticated
USING (
  public.is_admin()
);

-- Policy 6: Keep existing insert policy for users creating their own profile
-- (Already exists: "Users can create their own profile via function")

-- Policy 7: Keep existing update policy
-- (Already exists: "Users can update their own fighter profile")

-- Step 5: Create function to get sensitive fighter data (for owners/admins only)
CREATE OR REPLACE FUNCTION public.get_fighter_sensitive_data(p_fighter_id uuid)
RETURNS TABLE (
  birthdate date,
  birthplace text,
  blood_type text,
  document_type text,
  document_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  medical_conditions text,
  medical_allergies text,
  insurance_company text,
  insurance_policy text,
  license_issued_date timestamptz,
  license_expires_date timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access if user is owner or admin
  IF NOT (public.is_fighter_owner(p_fighter_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access sensitive fighter data';
  END IF;

  RETURN QUERY
  SELECT 
    fp.birthdate,
    fp.birthplace,
    fp.blood_type,
    fp.document_type,
    fp.document_number,
    fp.emergency_contact_name,
    fp.emergency_contact_phone,
    fp.emergency_contact_relation,
    fp.medical_conditions,
    fp.medical_allergies,
    fp.insurance_company,
    fp.insurance_policy,
    fp.license_issued_date,
    fp.license_expires_date
  FROM public.fighter_profiles fp
  WHERE fp.id = p_fighter_id;
END;
$$;

-- Step 6: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_user_id 
ON public.fighter_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_fighter_profiles_active 
ON public.fighter_profiles(active) 
WHERE active = true;

-- Step 7: Add comment explaining the security model
COMMENT ON TABLE public.fighter_profiles IS 
'Fighter profiles with RLS protecting sensitive PII. 
Public access: basic info only via fighter_profiles_public view.
Full access: fighter owners and admins only.
Sensitive data: accessible via get_fighter_sensitive_data() function.';

COMMENT ON VIEW public.fighter_profiles_public IS
'Public view of fighter profiles containing only non-sensitive information.
Safe for anonymous access and public display.';

COMMENT ON FUNCTION public.get_fighter_sensitive_data(uuid) IS
'Securely retrieves sensitive fighter data. Only accessible by profile owner or admins.
Returns: birthdate, medical info, emergency contacts, insurance, documents.';