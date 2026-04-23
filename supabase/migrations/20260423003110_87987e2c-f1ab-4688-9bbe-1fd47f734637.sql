-- Create moderation status enum
DO $$ BEGIN
  CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add moderation columns to gyms
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS moderation_status public.moderation_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS moderation_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_notes text,
  ADD COLUMN IF NOT EXISTS submitted_by uuid;

-- Add moderation columns to fighter_profiles
ALTER TABLE public.fighter_profiles
  ADD COLUMN IF NOT EXISTS moderation_status public.moderation_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS moderation_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_notes text,
  ADD COLUMN IF NOT EXISTS submitted_by uuid;

-- Add moderation columns to bdg_event
ALTER TABLE public.bdg_event
  ADD COLUMN IF NOT EXISTS moderation_status public.moderation_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS moderation_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_notes text;

-- Indexes for fast queue queries
CREATE INDEX IF NOT EXISTS idx_gyms_moderation_status ON public.gyms(moderation_status) WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_moderation_status ON public.fighter_profiles(moderation_status) WHERE moderation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bdg_event_moderation_status ON public.bdg_event(moderation_status) WHERE moderation_status = 'pending';

-- Helper function: is current user admin or super_admin?
CREATE OR REPLACE FUNCTION public.is_admin_or_super(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  );
$$;

-- ===== RLS for gyms =====
-- Drop existing public select policies that we need to replace
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view active gyms" ON public.gyms;
  DROP POLICY IF EXISTS "Anyone can view active gyms" ON public.gyms;
  DROP POLICY IF EXISTS "Gyms are viewable by everyone" ON public.gyms;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- New select policy: approved gyms public; pending/rejected only admin or owner
CREATE POLICY "View approved gyms or own pending"
ON public.gyms
FOR SELECT
USING (
  (activo = true AND moderation_status = 'approved')
  OR public.is_admin_or_super(auth.uid())
  OR (auth.uid() IS NOT NULL AND owner_id = auth.uid())
  OR (auth.uid() IS NOT NULL AND submitted_by = auth.uid())
);

-- Admins can update moderation
CREATE POLICY "Admins can moderate gyms"
ON public.gyms
FOR UPDATE
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ===== RLS for fighter_profiles =====
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view fighter profiles" ON public.fighter_profiles;
  DROP POLICY IF EXISTS "Anyone can view fighter profiles" ON public.fighter_profiles;
  DROP POLICY IF EXISTS "Fighter profiles are viewable by everyone" ON public.fighter_profiles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "View approved fighter profiles or own pending"
ON public.fighter_profiles
FOR SELECT
USING (
  moderation_status = 'approved'
  OR public.is_admin_or_super(auth.uid())
  OR (auth.uid() IS NOT NULL AND submitted_by = auth.uid())
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

CREATE POLICY "Admins can moderate fighter profiles"
ON public.fighter_profiles
FOR UPDATE
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ===== RLS for bdg_event =====
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published events" ON public.bdg_event;
  DROP POLICY IF EXISTS "Anyone can view events" ON public.bdg_event;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "View approved events or own pending"
ON public.bdg_event
FOR SELECT
USING (
  (published = true AND moderation_status = 'approved')
  OR public.is_admin_or_super(auth.uid())
  OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
);

CREATE POLICY "Admins can moderate events"
ON public.bdg_event
FOR UPDATE
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));