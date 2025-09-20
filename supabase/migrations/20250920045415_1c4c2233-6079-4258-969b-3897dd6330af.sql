-- LIMPIEZA COMPLETA DE BASE DE DATOS
-- Elimina todos los perfiles de peleadores y licencias pero preserva usuarios admin

-- Step 1: Eliminar datos relacionados con licencias
DELETE FROM public.fight_bookings 
WHERE license_id IN (SELECT id FROM public.fighter_licenses);

DELETE FROM public.medical_certifications 
WHERE license_id IN (SELECT id FROM public.fighter_licenses);

DELETE FROM public.license_documents 
WHERE license_id IN (SELECT id FROM public.fighter_licenses);

DELETE FROM public.license_verification_tokens 
WHERE license_id IN (SELECT id FROM public.fighter_licenses);

-- Step 2: Eliminar datos relacionados con perfiles de peleadores
DELETE FROM public.fighter_status_updates 
WHERE fighter_id IN (SELECT id FROM public.fighter_profiles);

DELETE FROM public.sparring_requests 
WHERE from_fighter_id IN (SELECT id FROM public.fighter_profiles)
   OR to_fighter_id IN (SELECT id FROM public.fighter_profiles);

-- Step 3: Limpiar referencias en tablas de peleas
UPDATE public.fights_history 
SET red_fighter_id = NULL 
WHERE red_fighter_id IN (SELECT id FROM public.fighter_profiles);

UPDATE public.fights_history 
SET blue_fighter_id = NULL 
WHERE blue_fighter_id IN (SELECT id FROM public.fighter_profiles);

UPDATE public.fights 
SET fighter_a_id = NULL, winner_id = NULL 
WHERE fighter_a_id IN (SELECT id FROM public.fighter_profiles) 
   OR winner_id IN (SELECT id FROM public.fighter_profiles);

UPDATE public.fights 
SET fighter_b_id = NULL, winner_id = NULL 
WHERE fighter_b_id IN (SELECT id FROM public.fighter_profiles) 
   OR winner_id IN (SELECT id FROM public.fighter_profiles);

-- Step 4: Eliminar todas las licencias de peleadores
DELETE FROM public.fighter_licenses;

-- Step 5: Eliminar todos los perfiles de peleadores
DELETE FROM public.fighter_profiles;

-- Step 6: Eliminar usuarios no-administradores de app_user
-- Solo mantener usuarios que son administradores
DELETE FROM public.app_user 
WHERE is_admin = false OR is_admin IS NULL;

-- Verificación final - mostrar lo que queda
SELECT 'Usuarios admin restantes:' as info, count(*) as cantidad 
FROM public.app_user WHERE is_admin = true
UNION ALL
SELECT 'Perfiles de peleadores restantes:', count(*) 
FROM public.fighter_profiles
UNION ALL  
SELECT 'Licencias restantes:', count(*) 
FROM public.fighter_licenses;