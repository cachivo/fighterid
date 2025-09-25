-- Eliminar todos los perfiles excepto los de administradores

-- Primero, eliminar fighter_profiles de usuarios no-admin
DELETE FROM public.fighter_profiles 
WHERE user_id IN (
  SELECT id FROM public.app_user 
  WHERE is_admin = false OR is_admin IS NULL
);

-- Eliminar licencias de peleadores no-admin
DELETE FROM public.fighter_licenses 
WHERE fighter_id NOT IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = true
);

-- Eliminar documentos de licencias relacionados
DELETE FROM public.license_documents 
WHERE license_id NOT IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = true
);

-- Eliminar certificaciones médicas relacionadas  
DELETE FROM public.medical_certifications
WHERE license_id NOT IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = true
);

-- Eliminar tokens de verificación de licencias
DELETE FROM public.license_verification_tokens
WHERE license_id NOT IN (
  SELECT fl.id FROM public.fighter_licenses fl
  JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = true
);

-- Eliminar actualizaciones de estado de peleadores no-admin
DELETE FROM public.fighter_status_updates
WHERE fighter_id NOT IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = true
);

-- Eliminar solicitudes de cambio de perfil de usuarios no-admin
DELETE FROM public.profile_change_requests
WHERE user_id IN (
  SELECT id FROM public.app_user 
  WHERE is_admin = false OR is_admin IS NULL
);

-- Eliminar posts sociales de usuarios no-admin (si son de tipo fighter)
DELETE FROM public.social_posts
WHERE author_type = 'fighter' 
AND author_id::uuid NOT IN (
  SELECT fp.id FROM public.fighter_profiles fp
  JOIN public.app_user au ON au.id = fp.user_id
  WHERE au.is_admin = true
);

-- Eliminar likes y comentarios de usuarios no-admin
DELETE FROM public.post_likes
WHERE user_id IN (
  SELECT id FROM public.app_user 
  WHERE is_admin = false OR is_admin IS NULL
);

DELETE FROM public.post_comments
WHERE user_id IN (
  SELECT id FROM public.app_user 
  WHERE is_admin = false OR is_admin IS NULL
);

-- Finalmente, eliminar app_user de usuarios no-admin
DELETE FROM public.app_user 
WHERE is_admin = false OR is_admin IS NULL;