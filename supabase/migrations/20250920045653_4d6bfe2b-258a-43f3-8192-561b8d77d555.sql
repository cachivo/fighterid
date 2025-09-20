-- LIMPIEZA COMPLETA DE BASE DE DATOS - VERSIÓN CORREGIDA
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

-- Step 3: Eliminar peleas que referencian peleadores (en lugar de setear NULL)
DELETE FROM public.fights_history 
WHERE red_fighter_id IN (SELECT id FROM public.fighter_profiles)
   OR blue_fighter_id IN (SELECT id FROM public.fighter_profiles);

DELETE FROM public.fights 
WHERE fighter_a_id IN (SELECT id FROM public.fighter_profiles) 
   OR fighter_b_id IN (SELECT id FROM public.fighter_profiles)
   OR winner_id IN (SELECT id FROM public.fighter_profiles);

-- Step 4: Eliminar scorecards de peleas
DELETE FROM public.fight_scorecards 
WHERE fight_id NOT IN (SELECT id FROM public.fights);

-- Step 5: Eliminar estadísticas de peleas
DELETE FROM public.fight_statistics 
WHERE fight_id NOT IN (SELECT id FROM public.fights);

-- Step 6: Eliminar asignaciones de oficiales
DELETE FROM public.fight_officials 
WHERE fight_id NOT IN (SELECT id FROM public.fights);

-- Step 7: Eliminar todas las licencias de peleadores
DELETE FROM public.fighter_licenses;

-- Step 8: Eliminar todos los perfiles de peleadores
DELETE FROM public.fighter_profiles;

-- Step 9: Eliminar usuarios no-administradores de app_user
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
FROM public.fighter_licenses
UNION ALL
SELECT 'Peleas restantes:', count(*) 
FROM public.fights;