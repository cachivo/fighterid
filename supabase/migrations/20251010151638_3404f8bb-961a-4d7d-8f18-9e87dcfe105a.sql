-- FASE 2: REESTRUCTURACIÓN DE BASE DE DATOS
-- Este script consolida el sistema de roles, limpia funciones legacy, 
-- mejora RLS policies y agrega funcionalidad de limpieza automática

-- =====================================================
-- 1. MIGRACIÓN DE SISTEMA DE ROLES
-- =====================================================

-- Migrar todos los usuarios con is_admin=true a la tabla user_roles
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
  auth_user_id, 
  'admin'::app_role,
  auth_user_id -- Self-assigned for existing admins
FROM public.app_user
WHERE is_admin = true
  AND auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Agregar índice para mejorar performance de verificación de roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role);

-- Nota: Mantenemos app_user.is_admin por compatibilidad legacy
-- El trigger sync_app_user_is_admin() ya mantiene la sincronización

-- =====================================================
-- 2. LIMPIAR FUNCIONES RPC LEGACY
-- =====================================================

-- Eliminar versiones antiguas de admin_update_fighter_profile
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile_v4(uuid, jsonb);
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile_v5(uuid, jsonb);

-- Renombrar v9 a nombre canónico (sin sufijo de versión)
ALTER FUNCTION public.admin_update_fighter_profile_v9(uuid, jsonb) 
RENAME TO admin_update_fighter_profile;

-- =====================================================
-- 3. MEJORAR RLS POLICIES PARA SOCIAL_POSTS
-- =====================================================

-- Mejorar policy para que fighters puedan crear posts como fighters
-- Asegurar que author_id se valida correctamente cuando author_type='fighter'
DROP POLICY IF EXISTS "Fighters can create their own posts" ON public.social_posts;

CREATE POLICY "Fighters can create their own posts"
ON public.social_posts
FOR INSERT
WITH CHECK (
  author_type = 'fighter' AND
  EXISTS (
    SELECT 1 
    FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id::text = social_posts.author_id::text 
    AND au.auth_user_id = auth.uid()
  )
);

-- Mejorar policy de actualización para fighters
DROP POLICY IF EXISTS "Fighters can update their own posts" ON public.social_posts;

CREATE POLICY "Fighters can update their own posts"
ON public.social_posts
FOR UPDATE
USING (
  author_type = 'fighter' AND
  EXISTS (
    SELECT 1 
    FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id::text = social_posts.author_id::text 
    AND au.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  author_type = 'fighter' AND
  EXISTS (
    SELECT 1 
    FROM public.fighter_profiles fp
    JOIN public.app_user au ON au.id = fp.user_id
    WHERE fp.id::text = social_posts.author_id::text 
    AND au.auth_user_id = auth.uid()
  )
);

-- =====================================================
-- 4. FUNCIÓN DE LIMPIEZA DE INVITACIONES EXPIRADAS
-- =====================================================

-- Crear función para limpiar invitaciones expiradas automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar invitaciones que:
  -- 1. Están expiradas (expires_at < now())
  -- 2. Están en estado 'pending'
  -- 3. Tienen más de 7 días de expiración (para dar margen)
  DELETE FROM public.fighter_invitations
  WHERE status = 'pending'
    AND expires_at < (now() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log de la limpieza
  RAISE NOTICE 'Cleaned up % expired invitations', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Comentario para documentar la función
COMMENT ON FUNCTION public.cleanup_expired_invitations() IS 
'Elimina invitaciones de peleadores que llevan más de 7 días expiradas y siguen en estado pending. Retorna el número de invitaciones eliminadas.';

-- =====================================================
-- 5. ÍNDICES ESTRATÉGICOS PARA PERFORMANCE
-- =====================================================

-- Índice compuesto para búsquedas eficientes en social_posts
CREATE INDEX IF NOT EXISTS idx_social_posts_author_type_date 
ON public.social_posts(author_id, author_type, created_at DESC)
WHERE active = true;

-- Índice para búsquedas de licencias por estado
CREATE INDEX IF NOT EXISTS idx_fighter_licenses_status_date 
ON public.fighter_licenses(status, created_at DESC);

-- Índice para búsqueda de peleadores (nombre, apellido, licencia)
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_search 
ON public.fighter_profiles(first_name, last_name, license_number)
WHERE active = true;

-- Índice para búsqueda de invitaciones por estado
CREATE INDEX IF NOT EXISTS idx_fighter_invitations_status_expires
ON public.fighter_invitations(status, expires_at)
WHERE status = 'pending';

-- =====================================================
-- 6. VERIFICACIONES Y LOGGING
-- =====================================================

-- Verificar migración de roles
DO $$
DECLARE
  admin_count_old INTEGER;
  admin_count_new INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count_old FROM public.app_user WHERE is_admin = true;
  SELECT COUNT(DISTINCT user_id) INTO admin_count_new FROM public.user_roles WHERE role = 'admin';
  
  RAISE NOTICE 'Admin migration check: % admins in app_user.is_admin, % in user_roles', 
    admin_count_old, admin_count_new;
  
  IF admin_count_new < admin_count_old THEN
    RAISE WARNING 'Some admins may not have been migrated to user_roles!';
  END IF;
END $$;

-- Log de índices creados
DO $$
BEGIN
  RAISE NOTICE 'Database refactoring completed successfully!';
  RAISE NOTICE 'Created indexes:';
  RAISE NOTICE '  - idx_user_roles_user_role';
  RAISE NOTICE '  - idx_social_posts_author_type_date';
  RAISE NOTICE '  - idx_fighter_licenses_status_date';
  RAISE NOTICE '  - idx_fighter_profiles_search';
  RAISE NOTICE '  - idx_fighter_invitations_status_expires';
  RAISE NOTICE 'Cleaned legacy functions: v4, v5';
  RAISE NOTICE 'Renamed admin_update_fighter_profile_v9 -> admin_update_fighter_profile';
  RAISE NOTICE 'Created cleanup_expired_invitations() function';
END $$;