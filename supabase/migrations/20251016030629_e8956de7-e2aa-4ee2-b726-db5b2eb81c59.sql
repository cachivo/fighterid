-- Corregir el enum discipline para usar disciplinas de artes marciales

-- Paso 1: Crear tipo temporal con disciplinas correctas
CREATE TYPE discipline_martial_arts AS ENUM ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro');

-- Paso 2: Agregar columnas temporales
ALTER TABLE public.fighter_profiles ADD COLUMN discipline_temp discipline_martial_arts;
ALTER TABLE public.fighter_licenses ADD COLUMN discipline_temp discipline_martial_arts;
ALTER TABLE public.fights_history ADD COLUMN discipline_temp discipline_martial_arts;
ALTER TABLE public.sparring_requests ADD COLUMN discipline_temp discipline_martial_arts;

-- Paso 3: Migrar datos - todos los Boxeo se mantienen, el resto a MMA por defecto
UPDATE public.fighter_profiles 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_martial_arts
  ELSE 'MMA'::discipline_martial_arts
END;

UPDATE public.fighter_licenses 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_martial_arts
  ELSE 'MMA'::discipline_martial_arts
END;

UPDATE public.fights_history 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_martial_arts
  ELSE 'MMA'::discipline_martial_arts
END;

UPDATE public.sparring_requests 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_martial_arts
  ELSE 'MMA'::discipline_martial_arts
END;

-- Paso 4: Eliminar columnas antiguas
ALTER TABLE public.fighter_profiles DROP COLUMN discipline;
ALTER TABLE public.fighter_licenses DROP COLUMN discipline;
ALTER TABLE public.fights_history DROP COLUMN discipline;
ALTER TABLE public.sparring_requests DROP COLUMN discipline;

-- Paso 5: Renombrar columnas temporales
ALTER TABLE public.fighter_profiles RENAME COLUMN discipline_temp TO discipline;
ALTER TABLE public.fighter_licenses RENAME COLUMN discipline_temp TO discipline;
ALTER TABLE public.fights_history RENAME COLUMN discipline_temp TO discipline;
ALTER TABLE public.sparring_requests RENAME COLUMN discipline_temp TO discipline;

-- Paso 6: Eliminar tipo antiguo y renombrar el nuevo
DROP TYPE discipline CASCADE;
ALTER TYPE discipline_martial_arts RENAME TO discipline;

COMMENT ON TYPE discipline IS 'Disciplinas de artes marciales para peleadores';

-- Recrear función create_fighter_profile_with_license
DROP FUNCTION IF EXISTS public.create_fighter_profile_with_license CASCADE;

CREATE OR REPLACE FUNCTION public.create_fighter_profile_with_license(
  p_auth_user_id uuid, 
  p_email text, 
  p_first_name text, 
  p_last_name text, 
  p_country text, 
  p_weight_class text, 
  p_height_cm integer, 
  p_weight_kg numeric, 
  p_phone text DEFAULT NULL::text, 
  p_birthdate date DEFAULT NULL::date, 
  p_nickname text DEFAULT NULL::text, 
  p_reach_cm integer DEFAULT NULL::integer, 
  p_discipline discipline DEFAULT NULL::discipline, 
  p_martial_arts text[] DEFAULT ARRAY[]::text[], 
  p_gym_name text DEFAULT NULL::text, 
  p_fighting_style text DEFAULT NULL::text, 
  p_stance text DEFAULT NULL::text, 
  p_level text DEFAULT NULL::text, 
  p_record_wins integer DEFAULT 0, 
  p_record_losses integer DEFAULT 0, 
  p_record_draws integer DEFAULT 0, 
  p_record_type text DEFAULT 'Amateur'::text, 
  p_gender text DEFAULT NULL::text, 
  p_bio text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_license_id uuid;
  v_license_number text;
  v_result jsonb;
BEGIN
  SELECT id INTO v_user_id FROM public.app_user WHERE auth_user_id = p_auth_user_id;
  
  IF v_user_id IS NULL THEN
    INSERT INTO public.app_user (auth_user_id, email, phone, birthdate, handle, is_admin, country)
    VALUES (p_auth_user_id, p_email, p_phone, p_birthdate, LOWER(p_first_name || '_' || p_last_name || '_' || extract(epoch from now())::text), false, p_country)
    RETURNING id INTO v_user_id;
  ELSE
    UPDATE public.app_user 
    SET phone = COALESCE(p_phone, phone), birthdate = COALESCE(p_birthdate, birthdate), country = COALESCE(p_country, country)
    WHERE id = v_user_id;
  END IF;
  
  SELECT id INTO v_profile_id FROM public.fighter_profiles WHERE user_id = v_user_id AND active = true;
  IF v_profile_id IS NOT NULL THEN RAISE EXCEPTION 'User already has an active fighter profile'; END IF;
  
  INSERT INTO public.fighter_profiles (user_id, first_name, last_name, nickname, country, weight_class, height_cm, weight_kg, reach_cm, discipline, martial_arts, gym_name, fighting_style, stance, level, record_wins, record_losses, record_draws, record_type, gender, bio, active)
  VALUES (v_user_id, p_first_name, p_last_name, p_nickname, p_country, p_weight_class, p_height_cm, p_weight_kg, p_reach_cm, p_discipline, p_martial_arts, p_gym_name, p_fighting_style, p_stance, p_level, p_record_wins, p_record_losses, p_record_draws, p_record_type, p_gender, p_bio, true)
  RETURNING id INTO v_profile_id;
  
  v_license_number := public.generate_license_number();
  
  INSERT INTO public.fighter_licenses (fighter_id, discipline, license_level, status, is_primary, license_number)
  VALUES (v_profile_id, p_discipline, 'AMATEUR', 'PENDING_REVIEW', true, v_license_number)
  RETURNING id INTO v_license_id;
  
  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'profile_id', v_profile_id, 'license_id', v_license_id, 'license_number', v_license_number);
END;
$$;