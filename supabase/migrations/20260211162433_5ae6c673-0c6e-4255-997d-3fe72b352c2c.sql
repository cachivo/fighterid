
-- =============================================
-- FASE 1: Reestructuración Sistema de Gimnasios
-- =============================================

-- 1. Enums
CREATE TYPE public.gym_staff_role AS ENUM ('OWNER', 'HEAD_COACH', 'ASSISTANT_COACH');
CREATE TYPE public.membership_status AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'SUSPENDED');

-- 2. Tabla gym_disciplines (N:N entre gyms y disciplines)
CREATE TABLE public.gym_disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  discipline_id uuid NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, discipline_id)
);

-- 3. Tabla gym_staff (reemplaza coaches para vincular usuarios reales)
CREATE TABLE public.gym_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  role public.gym_staff_role NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, user_id)
);

-- 4. Tabla fighter_gym_memberships (historial de membresías)
CREATE TABLE public.fighter_gym_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  coach_user_id uuid REFERENCES public.app_user(id) ON DELETE SET NULL,
  status public.membership_status NOT NULL DEFAULT 'ACTIVE',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Constraint: solo 1 membresía activa por peleador
CREATE UNIQUE INDEX unique_active_membership
  ON public.fighter_gym_memberships(fighter_id)
  WHERE status = 'ACTIVE';

-- 6. Índices de rendimiento
CREATE INDEX idx_gym_staff_gym ON public.gym_staff(gym_id);
CREATE INDEX idx_gym_staff_user ON public.gym_staff(user_id);
CREATE INDEX idx_gym_staff_active ON public.gym_staff(gym_id) WHERE active = true;
CREATE INDEX idx_fgm_gym ON public.fighter_gym_memberships(gym_id);
CREATE INDEX idx_fgm_fighter ON public.fighter_gym_memberships(fighter_id);
CREATE INDEX idx_fgm_status ON public.fighter_gym_memberships(status);
CREATE INDEX idx_fgm_active_gym ON public.fighter_gym_memberships(gym_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_gym_disciplines_gym ON public.gym_disciplines(gym_id);
CREATE INDEX idx_gym_disciplines_disc ON public.gym_disciplines(discipline_id);

-- 7. SECURITY DEFINER function para RLS sin recursión
CREATE OR REPLACE FUNCTION public.is_gym_staff(_user_id uuid, _gym_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_staff
    WHERE user_id = _user_id
      AND gym_id = _gym_id
      AND active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_gym_owner(_user_id uuid, _gym_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_staff
    WHERE user_id = _user_id
      AND gym_id = _gym_id
      AND role = 'OWNER'
      AND active = true
  )
$$;

-- 8. Helper: check if user is admin (reuses existing pattern)
CREATE OR REPLACE FUNCTION public.is_app_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user
    WHERE auth_user_id = _user_id
      AND is_admin = true
  )
$$;

-- 9. RLS: gym_disciplines
ALTER TABLE public.gym_disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym disciplines are publicly readable"
  ON public.gym_disciplines FOR SELECT
  USING (true);

CREATE POLICY "Gym owner or admin can manage disciplines"
  ON public.gym_disciplines FOR ALL
  TO authenticated
  USING (
    public.is_gym_owner(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  )
  WITH CHECK (
    public.is_gym_owner(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  );

-- 10. RLS: gym_staff
ALTER TABLE public.gym_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym staff is publicly readable"
  ON public.gym_staff FOR SELECT
  USING (true);

CREATE POLICY "Gym owner or admin can manage staff"
  ON public.gym_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_gym_owner(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  );

CREATE POLICY "Gym owner or admin can update staff"
  ON public.gym_staff FOR UPDATE
  TO authenticated
  USING (
    public.is_gym_owner(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  );

CREATE POLICY "Gym owner or admin can delete staff"
  ON public.gym_staff FOR DELETE
  TO authenticated
  USING (
    public.is_gym_owner(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  );

-- 11. RLS: fighter_gym_memberships
ALTER TABLE public.fighter_gym_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships are publicly readable"
  ON public.fighter_gym_memberships FOR SELECT
  USING (true);

CREATE POLICY "Gym staff or admin can manage memberships"
  ON public.fighter_gym_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_gym_staff(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  );

CREATE POLICY "Gym staff or admin can update memberships"
  ON public.fighter_gym_memberships FOR UPDATE
  TO authenticated
  USING (
    public.is_gym_staff(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  );

CREATE POLICY "Gym staff or admin can delete memberships"
  ON public.fighter_gym_memberships FOR DELETE
  TO authenticated
  USING (
    public.is_gym_staff(auth.uid(), gym_id)
    OR public.is_app_admin(auth.uid())
  );

-- 12. Trigger para updated_at en gym_staff
CREATE TRIGGER update_gym_staff_updated_at
  BEFORE UPDATE ON public.gym_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Trigger para updated_at en fighter_gym_memberships
CREATE TRIGGER update_fgm_updated_at
  BEFORE UPDATE ON public.fighter_gym_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
