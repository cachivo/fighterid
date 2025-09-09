-- Clean up residual suspension data for the user's license
UPDATE public.fighter_licenses 
SET 
  suspension_reason = NULL,
  suspension_until = NULL,
  medical_cleared = true,
  physical_cleared = true
WHERE license_number = 'FGT-2025-008' 
  AND status = 'ACTIVE';