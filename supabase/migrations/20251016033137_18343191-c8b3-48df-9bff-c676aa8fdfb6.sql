
-- Desactivar perfil de fighter para blackboxdjhn@gmail.com
-- Fighter ID: d58d56d6-3fe0-4d65-ac4b-52d242ee6590

-- Desactivar el perfil existente
UPDATE public.fighter_profiles
SET 
  active = false,
  updated_at = now()
WHERE id = 'd58d56d6-3fe0-4d65-ac4b-52d242ee6590'::uuid;

-- Log de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Perfil de fighter desactivado para blackboxdjhn@gmail.com - deberá completar toda la información de nuevo';
END $$;
