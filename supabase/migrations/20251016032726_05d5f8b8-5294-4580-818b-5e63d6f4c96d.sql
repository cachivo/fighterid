
-- Script temporal para eliminar licencia de blackboxdjhn@gmail.com
-- License ID: f80113f3-4501-4271-9b95-d8649c35b6fa

-- 1. Actualizar primary_license_id a NULL en fighter_profiles
UPDATE public.fighter_profiles 
SET primary_license_id = NULL
WHERE primary_license_id = 'f80113f3-4501-4271-9b95-d8649c35b6fa'::uuid;

-- 2. Eliminar dependencias
DELETE FROM public.license_documents 
WHERE license_id = 'f80113f3-4501-4271-9b95-d8649c35b6fa'::uuid;

DELETE FROM public.license_verification_tokens 
WHERE license_id = 'f80113f3-4501-4271-9b95-d8649c35b6fa'::uuid;

DELETE FROM public.medical_certifications 
WHERE license_id = 'f80113f3-4501-4271-9b95-d8649c35b6fa'::uuid;

DELETE FROM public.fight_bookings 
WHERE license_id = 'f80113f3-4501-4271-9b95-d8649c35b6fa'::uuid;

DELETE FROM public.doping_tests 
WHERE license_id = 'f80113f3-4501-4271-9b95-d8649c35b6fa'::uuid;

-- 3. Eliminar la licencia
DELETE FROM public.fighter_licenses 
WHERE id = 'f80113f3-4501-4271-9b95-d8649c35b6fa'::uuid;

-- Log de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Licencia eliminada exitosamente para blackboxdjhn@gmail.com';
END $$;
