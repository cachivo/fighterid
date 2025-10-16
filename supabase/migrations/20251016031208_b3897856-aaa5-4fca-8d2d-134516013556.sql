-- Actualizar todas las disciplinas a MMA
UPDATE public.fighter_profiles
SET discipline = 'MMA', updated_at = now()
WHERE active = true AND discipline IS NOT NULL;

-- Insertar notificaciones para peleadores activos (usando app_user.id, no auth_user_id)
INSERT INTO public.notifications (user_id, type, title, message, read, data, created_at)
SELECT 
  au.id,
  'system',
  '⚠️ Actualiza tu disciplina',
  'Hemos restablecido tu disciplina a MMA por defecto. Por favor, actualiza tu perfil y selecciona tu disciplina correcta.',
  false,
  jsonb_build_object(
    'action', 'update_discipline',
    'redirect', '/fighter/me',
    'priority', 'high'
  ),
  now()
FROM public.fighter_profiles fp
JOIN public.app_user au ON au.id = fp.user_id
WHERE fp.active = true;