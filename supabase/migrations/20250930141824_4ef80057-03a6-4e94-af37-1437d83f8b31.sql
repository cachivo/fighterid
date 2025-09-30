-- ============================================
-- FIX: Remove Security Definer View and use RLS only
-- ============================================

-- Drop the problematic view
DROP VIEW IF EXISTS public.fighter_profiles_public CASCADE;

-- The RLS policies we created are sufficient
-- They allow:
-- 1. Public/anonymous: can see basic info from active fighters
-- 2. Fighter owners: can see their own complete profile
-- 3. Admins: can see all profiles completely

-- The key is that the application layer MUST filter sensitive fields
-- when displaying to non-owners/non-admins

-- Add helpful comment
COMMENT ON TABLE public.fighter_profiles IS 
'Fighter profiles with RLS protecting sensitive PII. 
Access levels:
- Public (anon/authenticated): Can query active fighters but MUST filter sensitive fields in app layer
- Owner (authenticated): Full access to own profile
- Admin (authenticated): Full access to all profiles
Sensitive fields: birthdate, birthplace, blood_type, document_*, emergency_*, medical_*, insurance_*
Use get_fighter_sensitive_data() function for secure access to sensitive fields.';