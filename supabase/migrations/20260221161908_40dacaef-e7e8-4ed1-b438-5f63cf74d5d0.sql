
-- =====================================================================
-- FASE 1: Expandir Roles y Officials (Fundación del Ecosistema)
-- =====================================================================

-- 1. Expandir el enum app_role con nuevos roles del ecosistema
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'license_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technical_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'promoter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'official_judge';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'official_referee';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'official_doctor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'official_timekeeper';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'official_inspector';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gym_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gym_coach';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gym_assistant';

-- 2. Create the officials table (unified profile for all official types)
CREATE TABLE public.officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Type and certification
  official_type TEXT NOT NULL CHECK (official_type IN ('judge', 'referee', 'doctor', 'timekeeper', 'inspector')),
  certification_level TEXT NOT NULL DEFAULT 'REGIONAL' CHECK (certification_level IN ('REGIONAL', 'NATIONAL', 'INTERNATIONAL')),
  
  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  document_id TEXT UNIQUE,
  photo_url TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  country TEXT DEFAULT 'HN',
  
  -- Certification details
  license_number TEXT UNIQUE,
  certified_by TEXT,
  certification_date DATE,
  certification_expires DATE,
  
  -- Specializations (disciplines they can officiate)
  specialization TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Stats
  total_events_worked INT DEFAULT 0,
  total_fights_worked INT DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  suspended BOOLEAN DEFAULT false,
  
  -- Link to legacy judges table
  legacy_judge_id UUID,
  
  -- Organization
  organization_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create official_certifications table
CREATE TABLE public.official_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_id UUID NOT NULL REFERENCES public.officials(id) ON DELETE CASCADE,
  
  -- Certification details
  discipline TEXT NOT NULL,
  certification_type TEXT NOT NULL,
  issuing_body TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Document
  document_url TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create indexes
CREATE INDEX idx_officials_type ON public.officials(official_type);
CREATE INDEX idx_officials_user_id ON public.officials(user_id);
CREATE INDEX idx_officials_active ON public.officials(active);
CREATE INDEX idx_officials_certification_level ON public.officials(certification_level);
CREATE INDEX idx_official_certifications_official_id ON public.official_certifications(official_id);

-- 5. Enable RLS
ALTER TABLE public.officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_certifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for officials
-- Admins can do everything
CREATE POLICY "Admins can manage officials"
  ON public.officials
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Super admins can do everything
CREATE POLICY "Super admins can manage officials"
  ON public.officials
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Officials can view their own profile
CREATE POLICY "Officials can view own profile"
  ON public.officials
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Everyone can view active officials (public directory)
CREATE POLICY "Public can view active officials"
  ON public.officials
  FOR SELECT
  TO authenticated
  USING (active = true);

-- 7. RLS Policies for official_certifications
CREATE POLICY "Admins can manage certifications"
  ON public.official_certifications
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can manage certifications"
  ON public.official_certifications
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Officials can view own certifications"
  ON public.official_certifications
  FOR SELECT
  TO authenticated
  USING (
    official_id IN (
      SELECT id FROM public.officials WHERE user_id = auth.uid()
    )
  );

-- 8. Updated_at trigger for officials
CREATE TRIGGER update_officials_updated_at
  BEFORE UPDATE ON public.officials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_official_certifications_updated_at
  BEFORE UPDATE ON public.official_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Migrate existing judges data into officials table
INSERT INTO public.officials (
  user_id, official_type, certification_level, first_name, last_name,
  email, phone, country, license_number, specialization,
  total_fights_worked, active, legacy_judge_id, organization_id, created_at, updated_at
)
SELECT
  j.user_id,
  'judge',
  j.certification_level,
  j.first_name,
  j.last_name,
  j.email,
  j.phone,
  j.country,
  j.license_number,
  j.specialization,
  j.total_fights_judged,
  j.active,
  j.id,
  j.organization_id,
  j.created_at,
  j.updated_at
FROM public.judges j;

-- 10. Helper function to check official type role
CREATE OR REPLACE FUNCTION public.has_official_role(_user_id UUID, _official_type TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.officials
    WHERE user_id = _user_id
      AND official_type = _official_type
      AND active = true
  )
$$;
