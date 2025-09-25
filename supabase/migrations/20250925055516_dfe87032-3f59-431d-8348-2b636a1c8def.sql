-- Limpieza completa de perfiles no-administradores
-- Solo se mantendrán los datos de usuarios donde app_user.is_admin = true

-- 1. Eliminar likes de posts de usuarios no-admin
DELETE FROM public.post_likes 
WHERE user_id IN (
  SELECT au.id FROM public.app_user au 
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 2. Eliminar comentarios de posts de usuarios no-admin
DELETE FROM public.post_comments 
WHERE user_id IN (
  SELECT au.id FROM public.app_user au 
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 3. Eliminar posts sociales de peleadores no-admin
DELETE FROM public.social_posts 
WHERE author_type = 'fighter' 
AND author_id::uuid IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 4. Eliminar solicitudes de sparring de peleadores no-admin
DELETE FROM public.sparring_requests 
WHERE from_fighter_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
)
OR to_fighter_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 5. Eliminar actualizaciones de estado de peleadores no-admin
DELETE FROM public.fighter_status_updates 
WHERE fighter_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 6. Eliminar solicitudes de cambio de perfil de usuarios no-admin
DELETE FROM public.profile_change_requests 
WHERE user_id IN (
  SELECT au.id FROM public.app_user au 
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 7. Eliminar auditoría de solicitudes de cambio (referencias)
DELETE FROM public.change_request_audit 
WHERE request_id NOT IN (SELECT id FROM public.profile_change_requests);

-- 8. Eliminar reservas de peleas de licencias no-admin
DELETE FROM public.fight_bookings 
WHERE license_id IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 9. Eliminar certificaciones médicas de licencias no-admin
DELETE FROM public.medical_certifications 
WHERE license_id IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 10. Eliminar documentos de licencias no-admin
DELETE FROM public.license_documents 
WHERE license_id IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 11. Eliminar tokens de verificación de licencias no-admin
DELETE FROM public.license_verification_tokens 
WHERE license_id IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 12. Eliminar log de auditoría de licencias no-admin
DELETE FROM public.license_audit_log 
WHERE license_id IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 13. Eliminar licencias de peleadores no-admin
DELETE FROM public.fighter_licenses 
WHERE fighter_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 14. Limpiar referencias en fights antes de eliminar perfiles
UPDATE public.fights 
SET fighter_a_id = NULL 
WHERE fighter_a_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

UPDATE public.fights 
SET fighter_b_id = NULL 
WHERE fighter_b_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

UPDATE public.fights 
SET winner_id = NULL 
WHERE winner_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 15. Limpiar referencias en fights_history
UPDATE public.fights_history 
SET red_fighter_id = NULL 
WHERE red_fighter_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

UPDATE public.fights_history 
SET blue_fighter_id = NULL 
WHERE blue_fighter_id IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 16. Finalmente, eliminar perfiles de peleadores no-admin
DELETE FROM public.fighter_profiles 
WHERE user_id IN (
  SELECT au.id FROM public.app_user au 
  WHERE au.is_admin = false OR au.is_admin IS NULL
);

-- 17. Eliminar usuarios no-admin (manteniendo solo los admin)
DELETE FROM public.app_user 
WHERE is_admin = false OR is_admin IS NULL;