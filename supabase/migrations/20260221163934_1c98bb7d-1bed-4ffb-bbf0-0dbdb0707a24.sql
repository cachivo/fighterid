
-- =====================================================
-- FASE 3: Workflow de Peleas con Aprobación
-- =====================================================

-- 1. Expand fights table with approval workflow and official assignments
ALTER TABLE public.fights
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.app_user(id),
  ADD COLUMN IF NOT EXISTS discipline TEXT DEFAULT 'MMA',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.app_user(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS referee_id UUID REFERENCES public.officials(id),
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.officials(id),
  ADD COLUMN IF NOT EXISTS timekeeper_id UUID REFERENCES public.officials(id),
  ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES public.officials(id),
  ADD COLUMN IF NOT EXISTS number_of_rounds INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS round_duration_seconds INT DEFAULT 180,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for approval workflow queries
CREATE INDEX IF NOT EXISTS idx_fights_status ON public.fights(status);
CREATE INDEX IF NOT EXISTS idx_fights_requested_by ON public.fights(requested_by);
CREATE INDEX IF NOT EXISTS idx_fights_event_id ON public.fights(event_id);

-- 2. Create fight_requests table for gym-initiated requests
CREATE TABLE IF NOT EXISTS public.fight_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.bdg_event(id),
  requested_by UUID NOT NULL REFERENCES public.app_user(id),
  gym_id UUID REFERENCES public.gyms(id),
  
  -- Fighter A (always from the requesting gym)
  fighter_a_id UUID REFERENCES public.fighter_profiles(id),
  fighter_a_name TEXT,
  
  -- Fighter B (opponent - could be from another gym or TBD)
  fighter_b_id UUID REFERENCES public.fighter_profiles(id),
  fighter_b_name TEXT,
  opponent_gym_id UUID REFERENCES public.gyms(id),
  
  -- Fight details
  discipline TEXT NOT NULL DEFAULT 'MMA',
  weight_class TEXT NOT NULL,
  fight_type TEXT NOT NULL DEFAULT 'AMATEUR',
  number_of_rounds INT DEFAULT 3,
  is_championship BOOLEAN DEFAULT false,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled')),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.app_user(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Eligibility check results (stored as JSON)
  eligibility_check JSONB,
  
  -- Generated fight (after approval)
  fight_id UUID REFERENCES public.fights(id),
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fight_requests ENABLE ROW LEVEL SECURITY;

-- Policies for fight_requests
CREATE POLICY "Admins can manage all fight requests"
  ON public.fight_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'technical_coordinator'))
  );

CREATE POLICY "Gym owners/coaches can create and view their requests"
  ON public.fight_requests FOR SELECT
  USING (requested_by = (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Gym owners/coaches can insert fight requests"
  ON public.fight_requests FOR INSERT
  WITH CHECK (requested_by = (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Requesters can update their draft requests"
  ON public.fight_requests FOR UPDATE
  USING (
    requested_by = (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid() LIMIT 1)
    AND status = 'draft'
  );

-- Indexes for fight_requests
CREATE INDEX idx_fight_requests_status ON public.fight_requests(status);
CREATE INDEX idx_fight_requests_gym ON public.fight_requests(gym_id);
CREATE INDEX idx_fight_requests_event ON public.fight_requests(event_id);

-- 3. Create RPC: validate_fight_eligibility
-- Checks if two fighters are eligible to fight each other
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
BEGIN
  -- Get fighter A profile
  SELECT * INTO v_fighter_a FROM fighter_profiles WHERE id = p_fighter_a_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'error', 'Fighter A not found',
      'checks', '[]'::jsonb
    );
  END IF;

  -- Get fighter B profile
  SELECT * INTO v_fighter_b FROM fighter_profiles WHERE id = p_fighter_b_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'error', 'Fighter B not found',
      'checks', '[]'::jsonb
    );
  END IF;

  -- Check 1: Both fighters are active
  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_a_active',
    'label', 'Peleador A activo',
    'passed', COALESCE(v_fighter_a.active, false),
    'detail', CASE WHEN COALESCE(v_fighter_a.active, false) THEN 'Activo' ELSE 'Inactivo' END
  );
  IF NOT COALESCE(v_fighter_a.active, false) THEN v_all_passed := false; END IF;

  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_b_active',
    'label', 'Peleador B activo',
    'passed', COALESCE(v_fighter_b.active, false),
    'detail', CASE WHEN COALESCE(v_fighter_b.active, false) THEN 'Activo' ELSE 'Inactivo' END
  );
  IF NOT COALESCE(v_fighter_b.active, false) THEN v_all_passed := false; END IF;

  -- Check 2: Active licenses
  SELECT * INTO v_license_a FROM fighter_licenses
    WHERE fighter_id = p_fighter_a_id AND status = 'active'
    ORDER BY is_primary DESC NULLS LAST LIMIT 1;

  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_a_license',
    'label', 'Licencia A vigente',
    'passed', FOUND AND (v_license_a.expires_at IS NULL OR v_license_a.expires_at > now()),
    'detail', CASE 
      WHEN NOT FOUND THEN 'Sin licencia activa'
      WHEN v_license_a.expires_at IS NOT NULL AND v_license_a.expires_at <= now() THEN 'Licencia vencida'
      ELSE 'Licencia #' || v_license_a.license_number
    END
  );
  IF NOT FOUND OR (v_license_a.expires_at IS NOT NULL AND v_license_a.expires_at <= now()) THEN v_all_passed := false; END IF;

  SELECT * INTO v_license_b FROM fighter_licenses
    WHERE fighter_id = p_fighter_b_id AND status = 'active'
    ORDER BY is_primary DESC NULLS LAST LIMIT 1;

  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_b_license',
    'label', 'Licencia B vigente',
    'passed', FOUND AND (v_license_b.expires_at IS NULL OR v_license_b.expires_at > now()),
    'detail', CASE 
      WHEN NOT FOUND THEN 'Sin licencia activa'
      WHEN v_license_b.expires_at IS NOT NULL AND v_license_b.expires_at <= now() THEN 'Licencia vencida'
      ELSE 'Licencia #' || v_license_b.license_number
    END
  );
  IF NOT FOUND OR (v_license_b.expires_at IS NOT NULL AND v_license_b.expires_at <= now()) THEN v_all_passed := false; END IF;

  -- Check 3: Not suspended (license)
  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_a_not_suspended',
    'label', 'Peleador A no suspendido',
    'passed', NOT EXISTS (
      SELECT 1 FROM fighter_licenses 
      WHERE fighter_id = p_fighter_a_id AND status = 'suspended'
      AND (suspension_until IS NULL OR suspension_until > now())
    ),
    'detail', CASE 
      WHEN EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_a_id AND status = 'suspended' AND (suspension_until IS NULL OR suspension_until > now()))
      THEN 'Suspendido'
      ELSE 'Sin suspensiones'
    END
  );
  IF EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_a_id AND status = 'suspended' AND (suspension_until IS NULL OR suspension_until > now())) THEN
    v_all_passed := false;
  END IF;

  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_b_not_suspended',
    'label', 'Peleador B no suspendido',
    'passed', NOT EXISTS (
      SELECT 1 FROM fighter_licenses 
      WHERE fighter_id = p_fighter_b_id AND status = 'suspended'
      AND (suspension_until IS NULL OR suspension_until > now())
    ),
    'detail', CASE 
      WHEN EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_b_id AND status = 'suspended' AND (suspension_until IS NULL OR suspension_until > now()))
      THEN 'Suspendido'
      ELSE 'Sin suspensiones'
    END
  );
  IF EXISTS (SELECT 1 FROM fighter_licenses WHERE fighter_id = p_fighter_b_id AND status = 'suspended' AND (suspension_until IS NULL OR suspension_until > now())) THEN
    v_all_passed := false;
  END IF;

  -- Check 4: Medical clearance
  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_a_medical',
    'label', 'Apto médico A',
    'passed', COALESCE(v_license_a.medical_cleared, false),
    'detail', CASE WHEN COALESCE(v_license_a.medical_cleared, false) THEN 'Apto' ELSE 'No verificado' END
  );
  IF NOT COALESCE(v_license_a.medical_cleared, false) THEN v_all_passed := false; END IF;

  v_checks := v_checks || jsonb_build_object(
    'check', 'fighter_b_medical',
    'label', 'Apto médico B',
    'passed', COALESCE(v_license_b.medical_cleared, false),
    'detail', CASE WHEN COALESCE(v_license_b.medical_cleared, false) THEN 'Apto' ELSE 'No verificado' END
  );
  IF NOT COALESCE(v_license_b.medical_cleared, false) THEN v_all_passed := false; END IF;

  -- Check 5: Weight class compatibility (if specified)
  IF p_weight_class IS NOT NULL THEN
    v_checks := v_checks || jsonb_build_object(
      'check', 'weight_compatible',
      'label', 'Categoría de peso compatible',
      'passed', (v_fighter_a.weight_class = p_weight_class AND v_fighter_b.weight_class = p_weight_class),
      'detail', CASE 
        WHEN v_fighter_a.weight_class = p_weight_class AND v_fighter_b.weight_class = p_weight_class THEN 'Ambos en ' || p_weight_class
        ELSE 'A: ' || COALESCE(v_fighter_a.weight_class, 'N/A') || ' / B: ' || COALESCE(v_fighter_b.weight_class, 'N/A')
      END
    );
    IF NOT (v_fighter_a.weight_class = p_weight_class AND v_fighter_b.weight_class = p_weight_class) THEN
      v_all_passed := false;
    END IF;
  END IF;

  -- Check 6: Not the same fighter
  v_checks := v_checks || jsonb_build_object(
    'check', 'different_fighters',
    'label', 'Peleadores diferentes',
    'passed', p_fighter_a_id != p_fighter_b_id,
    'detail', CASE WHEN p_fighter_a_id != p_fighter_b_id THEN 'OK' ELSE 'Mismo peleador' END
  );
  IF p_fighter_a_id = p_fighter_b_id THEN v_all_passed := false; END IF;

  -- Build final result
  v_result := jsonb_build_object(
    'eligible', v_all_passed,
    'fighter_a', jsonb_build_object(
      'id', v_fighter_a.id,
      'name', v_fighter_a.first_name || ' ' || v_fighter_a.last_name,
      'weight_class', v_fighter_a.weight_class
    ),
    'fighter_b', jsonb_build_object(
      'id', v_fighter_b.id,
      'name', v_fighter_b.first_name || ' ' || v_fighter_b.last_name,
      'weight_class', v_fighter_b.weight_class
    ),
    'checks', v_checks,
    'checked_at', now()
  );

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_fight_eligibility TO authenticated;

-- 4. Trigger to update updated_at on fight_requests
CREATE TRIGGER update_fight_requests_updated_at
  BEFORE UPDATE ON public.fight_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
