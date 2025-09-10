-- Clean up all residual data for ACTIVE licenses
UPDATE public.fighter_licenses 
SET 
  suspension_reason = NULL,
  suspension_until = NULL,
  medical_cleared = true,
  physical_cleared = true
WHERE status = 'ACTIVE';

-- Ensure proper sync between license status and fighter profiles
UPDATE public.fighter_profiles 
SET license_status = 'active'
WHERE id IN (
  SELECT fighter_id 
  FROM public.fighter_licenses 
  WHERE status = 'ACTIVE' AND is_primary = true
);