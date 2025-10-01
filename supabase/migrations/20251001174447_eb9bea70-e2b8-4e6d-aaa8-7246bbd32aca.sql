-- Create enums for doping test types and statuses
CREATE TYPE doping_test_type AS ENUM ('PRE_FIGHT', 'RANDOM', 'POST_FIGHT', 'ANNUAL');
CREATE TYPE doping_result_status AS ENUM ('PENDING', 'CLEAN', 'POSITIVE', 'INCONCLUSIVE');

-- Create doping_tests table
CREATE TABLE public.doping_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.fighter_licenses(id) ON DELETE CASCADE,
  test_type doping_test_type NOT NULL,
  test_date TIMESTAMP WITH TIME ZONE NOT NULL,
  result_status doping_result_status NOT NULL DEFAULT 'PENDING',
  substances_detected TEXT[],
  testing_agency TEXT NOT NULL,
  report_file_url TEXT,
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doping_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "License owners can view their doping tests"
  ON public.doping_tests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fighter_licenses fl
      JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
      JOIN public.app_user au ON au.id = fp.user_id
      WHERE fl.id = doping_tests.license_id
      AND au.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "License owners can insert their doping tests"
  ON public.doping_tests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fighter_licenses fl
      JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
      JOIN public.app_user au ON au.id = fp.user_id
      WHERE fl.id = doping_tests.license_id
      AND au.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all doping tests"
  ON public.doping_tests
  FOR ALL
  USING (is_admin());

-- Function to check doping eligibility
CREATE OR REPLACE FUNCTION public.check_doping_eligibility(p_license_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_has_positive BOOLEAN;
  v_latest_test_date TIMESTAMP WITH TIME ZONE;
  v_months_since_test INTEGER;
BEGIN
  -- Check for unresolved positive tests
  SELECT EXISTS(
    SELECT 1 FROM public.doping_tests
    WHERE license_id = p_license_id
    AND result_status = 'POSITIVE'
    AND verified_at IS NULL
  ) INTO v_has_positive;

  -- Get latest test date
  SELECT MAX(test_date) INTO v_latest_test_date
  FROM public.doping_tests
  WHERE license_id = p_license_id
  AND result_status IN ('CLEAN', 'PENDING');

  -- Calculate months since last test
  IF v_latest_test_date IS NOT NULL THEN
    v_months_since_test := EXTRACT(MONTH FROM AGE(now(), v_latest_test_date));
  ELSE
    v_months_since_test := 999; -- No test found
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'eligible', NOT v_has_positive AND v_months_since_test <= 12,
    'has_positive_test', v_has_positive,
    'months_since_last_test', v_months_since_test,
    'latest_test_date', v_latest_test_date,
    'reason', CASE
      WHEN v_has_positive THEN 'Tiene un resultado positivo sin resolver'
      WHEN v_months_since_test > 12 THEN 'No tiene test válido en los últimos 12 meses'
      ELSE 'Elegible para competir'
    END
  );

  RETURN v_result;
END;
$$;

-- Function to get recent doping tests
CREATE OR REPLACE FUNCTION public.get_recent_doping_tests(p_license_id UUID, p_months INTEGER DEFAULT 12)
RETURNS TABLE (
  id UUID,
  test_type doping_test_type,
  test_date TIMESTAMP WITH TIME ZONE,
  result_status doping_result_status,
  testing_agency TEXT,
  verified_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, test_type, test_date, result_status, testing_agency, verified_at
  FROM public.doping_tests
  WHERE license_id = p_license_id
  AND test_date >= now() - (p_months || ' months')::INTERVAL
  ORDER BY test_date DESC;
$$;

-- Create storage bucket for doping reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doping-reports',
  'doping-reports',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for doping reports
CREATE POLICY "License owners can upload their doping reports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'doping-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "License owners can view their doping reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'doping-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all doping reports"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'doping-reports' AND
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE auth_user_id = auth.uid()
    AND is_admin = true
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_doping_tests_updated_at
  BEFORE UPDATE ON public.doping_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();