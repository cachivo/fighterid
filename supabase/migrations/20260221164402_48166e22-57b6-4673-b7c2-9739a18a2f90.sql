
-- Fix validate_fight_eligibility to use correct enum values (uppercase)
CREATE OR REPLACE FUNCTION public.validate_fight_eligibility(
  p_fighter_a_id UUID,
  p_fighter_b_id UUID,
  p_weight_class TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_result JSONB;
  v_checks JSONB := '[]'::JSONB;
  v_all_passed BOOLEAN := true;
  v_fighter_a RECORD;
  v_fighter_b RECORD;
  v_license_a RECORD;
  v_license_b RECORD;
  v_license_a_found BOOLEAN := false;
  v_license_b_found BOOLEAN := false;
BEGIN
  SELECT * INTO v_fighter_a FROM fighter_profiles WHERE id = p_fighter_a_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'error', 'Fighter A not found', 'checks', '[]'::jsonb);
  END IF;

  SELECT * INTO v_fighter_b FROM fighter_profiles WHERE id = p_fighter_b_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'error', 'Fighter B not found', 'checks', '[]'::jsonb);
  END IF;

  -- Check 1: Active fighters
  v_checks := v_checks || jsonb_build_object('check', 'fighter_a_active', 'label', 'Peleador A activo', 'passed', COALESCE(v_fighter_a.active, false), 'detail', CASE WHEN COALESCE(v_fighter_a.active, false) THEN 'Activo' ELSE 'Inactivo' END);
  IF NOT COALESCE(v_fighter_a.active, false) THEN v_all_passed := false; END IF;

  v_checks := v_checks || jsonb_build_object('check', 'fighter_b_active', 'label', 'Peleador B activo', 'passed', COALESCE(v_fighter_b.active, false), 'detail', CASE WHEN COALESCE(v_fighter_b.active, false) THEN 'Activo' ELSE 'Inactivo' END);
  IF NOT COALESCE(v_fighter_b.active, false) THEN v_all_passed := false; END IF;

  -- Check 2: Active licenses (using uppercase enum values)
  SELECT * INTO v_license_a FROM fighter_licenses WHERE fighter_id = p_fighter_a_id AND status = 'ACTIVE' ORDER BY is_primary DESC NULLS LAST LIMIT 1;
  v_license_a_found := FOUND;

  v_checks := v_checks || jsonb_build_object('check', 'fighter_a_license', 'label', 'Licencia A vigente', 'passed', v_license_a_found AND (v_license_a.expires_at IS NULL OR v_license_a.expires_at > now()), 'detail', CASE WHEN NOT v_license_a_found THEN 'Sin licencia activa' WHEN v_license_a.expires_at IS NOT NULL AND v_license_a.expires_at <= now() THEN 'Licencia vencida' ELSE 'Licencia #' || v_license_a.license_number END);
  IF NOT v_license_a_found OR (v_license_a.expires_at IS NOT NULL AND v_license_a.expires_at <= now()) THEN v_all_passed := false; END IF;

  SELECT * INTO v_license_b FROM fighter_licenses WHERE fighter_id = p_fighter_b_id AND status = 'ACTIVE' ORDER BY is_primary DESC NULLS LAST LIMIT 1;
  v_license_b_found := FOUND;

  v_checks := v_checks || jsonb_build_object('check', 'fighter_b_license', 'label', 'Licencia B vigente', 'passed', v_license_b_found AND (v_license_b.expires_at IS NULL OR v_license_b.expires_at > now()), 'detail', CASE WHEN NOT v_license_b_found THEN 'Sin licencia activa' WHEN v_license_b.expires_at IS NOT NULL AND v_license_b.expires_at <= now() THEN 'Licencia vencida' ELSE 'Licencia #' || v_license_b.license_number END);
  IF NOT v_license_b_found OR (v_license_b.expires_at IS NOT NULL AND v_license_b.expires_at <= now()) THEN v_all_passed := false; END IF;

  -- Check 3: Not suspended
  v_checks := v_checks || jsonb_build_object('check', 'fighter_a_not_suspended', 'label', 'Peleador A no suspendido', 'passed', NOT EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_a_id AND status = 'SUSPENDED' AND (suspension_until IS NULL OR suspension_until > now())), 'detail', CASE WHEN EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_a_id AND status = 'SUSPENDED' AND (suspension_until IS NULL OR suspension_until > now())) THEN 'Suspendido' ELSE 'Sin suspensiones' END);
  IF EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_a_id AND status = 'SUSPENDED' AND (suspension_until IS NULL OR suspension_until > now())) THEN v_all_passed := false; END IF;

  v_checks := v_checks || jsonb_build_object('check', 'fighter_b_not_suspended', 'label', 'Peleador B no suspendido', 'passed', NOT EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_b_id AND status = 'SUSPENDED' AND (suspension_until IS NULL OR suspension_until > now())), 'detail', CASE WHEN EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_b_id AND status = 'SUSPENDED' AND (suspension_until IS NULL OR suspension_until > now())) THEN 'Suspendido' ELSE 'Sin suspensiones' END);
  IF EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_b_id AND status = 'SUSPENDED' AND (suspension_until IS NULL OR suspension_until > now())) THEN v_all_passed := false; END IF;

  -- Check 4: Medical clearance
  v_checks := v_checks || jsonb_build_object('check', 'fighter_a_medical', 'label', 'Apto médico A', 'passed', COALESCE(v_license_a.medical_cleared, false), 'detail', CASE WHEN COALESCE(v_license_a.medical_cleared, false) THEN 'Apto' ELSE 'No verificado' END);
  IF NOT COALESCE(v_license_a.medical_cleared, false) THEN v_all_passed := false; END IF;

  v_checks := v_checks || jsonb_build_object('check', 'fighter_b_medical', 'label', 'Apto médico B', 'passed', COALESCE(v_license_b.medical_cleared, false), 'detail', CASE WHEN COALESCE(v_license_b.medical_cleared, false) THEN 'Apto' ELSE 'No verificado' END);
  IF NOT COALESCE(v_license_b.medical_cleared, false) THEN v_all_passed := false; END IF;

  -- Check 5: Weight class compatibility
  IF p_weight_class IS NOT NULL THEN
    v_checks := v_checks || jsonb_build_object('check', 'weight_compatible', 'label', 'Categoría de peso compatible', 'passed', (v_fighter_a.weight_class = p_weight_class AND v_fighter_b.weight_class = p_weight_class), 'detail', CASE WHEN v_fighter_a.weight_class = p_weight_class AND v_fighter_b.weight_class = p_weight_class THEN 'Ambos en ' || p_weight_class ELSE 'A: ' || COALESCE(v_fighter_a.weight_class, 'N/A') || ' / B: ' || COALESCE(v_fighter_b.weight_class, 'N/A') END);
    IF NOT (v_fighter_a.weight_class = p_weight_class AND v_fighter_b.weight_class = p_weight_class) THEN v_all_passed := false; END IF;
  END IF;

  -- Check 6: Different fighters
  v_checks := v_checks || jsonb_build_object('check', 'different_fighters', 'label', 'Peleadores diferentes', 'passed', p_fighter_a_id != p_fighter_b_id, 'detail', CASE WHEN p_fighter_a_id != p_fighter_b_id THEN 'OK' ELSE 'Mismo peleador' END);
  IF p_fighter_a_id = p_fighter_b_id THEN v_all_passed := false; END IF;

  v_result := jsonb_build_object(
    'eligible', v_all_passed,
    'fighter_a', jsonb_build_object('id', v_fighter_a.id, 'name', v_fighter_a.first_name || ' ' || v_fighter_a.last_name, 'weight_class', v_fighter_a.weight_class),
    'fighter_b', jsonb_build_object('id', v_fighter_b.id, 'name', v_fighter_b.first_name || ' ' || v_fighter_b.last_name, 'weight_class', v_fighter_b.weight_class),
    'checks', v_checks,
    'checked_at', now()
  );

  RETURN v_result;
END;
$$;
