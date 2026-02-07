-- =====================================================
-- FASE 1: Corrección inmediata de datos de Mateo Starozze
-- =====================================================

-- 1. Desactivar inscripción incorrecta en BDG_PRO
UPDATE fighter_rankings
SET is_active = false, updated_at = now()
WHERE fighter_id = '55a30550-b731-4248-99f5-50c3d874dfd2'
  AND organization_id = (SELECT id FROM ranking_organizations WHERE code = 'BDG_PRO');

-- 2. Inscribir en HHF_AMATEUR (organización correcta para Amateur de Boxeo)
INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
SELECT 
  '55a30550-b731-4248-99f5-50c3d874dfd2',
  ro.id,
  'Amateur',
  'Peso Ligero',
  4,
  true
FROM ranking_organizations ro
WHERE ro.code = 'HHF_AMATEUR'
ON CONFLICT (fighter_id, organization_id) 
DO UPDATE SET is_active = true, level = 'Amateur', points = 4, updated_at = now();

-- =====================================================
-- FASE 2: Mejora del RPC admin_update_fighter_profile
-- Agregar migración automática para peleadores de Boxeo
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_nickname text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_discipline text DEFAULT NULL,
  p_level text DEFAULT NULL,
  p_weight_class text DEFAULT NULL,
  p_height_cm integer DEFAULT NULL,
  p_reach_cm integer DEFAULT NULL,
  p_stance text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_gym_id uuid DEFAULT NULL,
  p_coach_id uuid DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_instagram text DEFAULT NULL,
  p_facebook text DEFAULT NULL,
  p_twitter text DEFAULT NULL,
  p_tiktok text DEFAULT NULL,
  p_youtube text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_boxrec_url text DEFAULT NULL,
  p_tapology_url text DEFAULT NULL,
  p_blood_type text DEFAULT NULL,
  p_medical_notes text DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_current_profile RECORD;
  v_discipline text;
  v_level text;
  v_weight_class text;
  v_result jsonb;
BEGIN
  -- Get current profile data
  SELECT * INTO v_current_profile
  FROM fighter_profiles
  WHERE id = p_fighter_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fighter not found');
  END IF;

  -- Determine effective values (new or existing)
  v_discipline := COALESCE(p_discipline, v_current_profile.discipline::text);
  v_level := COALESCE(p_level, v_current_profile.level);
  v_weight_class := COALESCE(p_weight_class, v_current_profile.weight_class);

  -- Update fighter profile with all fields
  UPDATE fighter_profiles SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    nickname = CASE WHEN p_nickname IS NOT NULL THEN NULLIF(p_nickname, '') ELSE nickname END,
    avatar_url = CASE WHEN p_avatar_url IS NOT NULL THEN NULLIF(p_avatar_url, '') ELSE avatar_url END,
    discipline = CASE WHEN p_discipline IS NOT NULL THEN p_discipline::discipline ELSE discipline END,
    level = COALESCE(p_level, level),
    weight_class = COALESCE(p_weight_class, weight_class),
    height_cm = CASE WHEN p_height_cm IS NOT NULL THEN p_height_cm ELSE height_cm END,
    reach_cm = CASE WHEN p_reach_cm IS NOT NULL THEN p_reach_cm ELSE reach_cm END,
    stance = CASE WHEN p_stance IS NOT NULL THEN NULLIF(p_stance, '') ELSE stance END,
    country = COALESCE(p_country, country),
    city = CASE WHEN p_city IS NOT NULL THEN NULLIF(p_city, '') ELSE city END,
    gym_id = CASE WHEN p_gym_id IS NOT NULL THEN p_gym_id ELSE gym_id END,
    coach_id = CASE WHEN p_coach_id IS NOT NULL THEN p_coach_id ELSE coach_id END,
    bio = CASE WHEN p_bio IS NOT NULL THEN NULLIF(p_bio, '') ELSE bio END,
    instagram = CASE WHEN p_instagram IS NOT NULL THEN NULLIF(p_instagram, '') ELSE instagram END,
    facebook = CASE WHEN p_facebook IS NOT NULL THEN NULLIF(p_facebook, '') ELSE facebook END,
    twitter = CASE WHEN p_twitter IS NOT NULL THEN NULLIF(p_twitter, '') ELSE twitter END,
    tiktok = CASE WHEN p_tiktok IS NOT NULL THEN NULLIF(p_tiktok, '') ELSE tiktok END,
    youtube = CASE WHEN p_youtube IS NOT NULL THEN NULLIF(p_youtube, '') ELSE youtube END,
    gender = CASE WHEN p_gender IS NOT NULL THEN NULLIF(p_gender, '') ELSE gender END,
    boxrec_url = CASE WHEN p_boxrec_url IS NOT NULL THEN NULLIF(p_boxrec_url, '') ELSE boxrec_url END,
    tapology_url = CASE WHEN p_tapology_url IS NOT NULL THEN NULLIF(p_tapology_url, '') ELSE tapology_url END,
    blood_type = CASE WHEN p_blood_type IS NOT NULL THEN NULLIF(p_blood_type, '') ELSE blood_type END,
    medical_notes = CASE WHEN p_medical_notes IS NOT NULL THEN NULLIF(p_medical_notes, '') ELSE medical_notes END,
    emergency_contact_name = CASE WHEN p_emergency_contact_name IS NOT NULL THEN NULLIF(p_emergency_contact_name, '') ELSE emergency_contact_name END,
    emergency_contact_phone = CASE WHEN p_emergency_contact_phone IS NOT NULL THEN NULLIF(p_emergency_contact_phone, '') ELSE emergency_contact_phone END,
    updated_at = now()
  WHERE id = p_fighter_id;

  -- =====================================================
  -- NUEVA LÓGICA: Migración automática para Boxeo
  -- =====================================================
  IF v_discipline = 'Boxeo' AND p_level IS NOT NULL THEN
    -- Si cambia a Amateur, mover de BDG_PRO a HHF_AMATEUR
    IF p_level = 'Amateur' THEN
      -- Desactivar de BDG_PRO si estaba ahí
      UPDATE fighter_rankings fr
      SET is_active = false, updated_at = now()
      FROM ranking_organizations ro
      WHERE fr.fighter_id = p_fighter_id
        AND fr.organization_id = ro.id
        AND ro.code = 'BDG_PRO'
        AND fr.is_active = true;
      
      -- Activar/crear en HHF_AMATEUR
      INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
      SELECT p_fighter_id, ro.id, 'Amateur', v_weight_class, 0, true
      FROM ranking_organizations ro WHERE ro.code = 'HHF_AMATEUR'
      ON CONFLICT (fighter_id, organization_id) 
      DO UPDATE SET is_active = true, level = 'Amateur', weight_class = EXCLUDED.weight_class, updated_at = now();
    
    -- Si cambia a Profesional o Semi-profesional, mover de HHF_AMATEUR a BDG_PRO
    ELSIF p_level IN ('Profesional', 'Semi-profesional') THEN
      -- Desactivar de HHF_AMATEUR si estaba ahí
      UPDATE fighter_rankings fr
      SET is_active = false, updated_at = now()
      FROM ranking_organizations ro
      WHERE fr.fighter_id = p_fighter_id
        AND fr.organization_id = ro.id
        AND ro.code = 'HHF_AMATEUR'
        AND fr.is_active = true;
      
      -- Activar/crear en BDG_PRO
      INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
      SELECT p_fighter_id, ro.id, p_level, v_weight_class, 0, true
      FROM ranking_organizations ro WHERE ro.code = 'BDG_PRO'
      ON CONFLICT (fighter_id, organization_id) 
      DO UPDATE SET is_active = true, level = EXCLUDED.level, weight_class = EXCLUDED.weight_class, updated_at = now();
    END IF;
  ELSE
    -- Para MMA y otros: actualizar nivel y peso en rankings activos sin migrar
    UPDATE fighter_rankings
    SET 
      level = COALESCE(p_level, level),
      weight_class = COALESCE(p_weight_class, weight_class),
      updated_at = now()
    WHERE fighter_id = p_fighter_id AND is_active = true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'fighter_id', p_fighter_id,
    'discipline', v_discipline,
    'level', v_level,
    'migration_applied', v_discipline = 'Boxeo' AND p_level IS NOT NULL
  );
END;
$$;