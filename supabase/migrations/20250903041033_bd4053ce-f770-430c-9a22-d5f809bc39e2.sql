-- ============= ENUMS BÁSICOS =============
DO $$ BEGIN
  CREATE TYPE public.discipline AS ENUM ('MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.license_state AS ENUM ('active','suspended','expired','pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.fight_result AS ENUM ('red_win','blue_win','draw','no_contest','scheduled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('pending','accepted','declined','cancelled','expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============= ORGANIZACIONES =============
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text,
  short_code text,           -- ej UCC-HN
  created_at timestamptz DEFAULT now()
);

-- ============= USUARIOS APP (ASEGURAR CAMPO ADMIN) =============
ALTER TABLE public.app_user
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ============= PERFIL DEL PELEADOR (EXTENSIONES) =============
ALTER TABLE public.fighter_profiles
  ADD COLUMN IF NOT EXISTS discipline public.discipline,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level text,            -- ej. Amateur / Pro / Cinturón
  ADD COLUMN IF NOT EXISTS stance text;           -- opcional

-- index útiles
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_org ON public.fighter_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_fighter_profiles_discipline ON public.fighter_profiles(discipline);

-- ============= HISTORIAL DE LICENCIAS =============
CREATE TABLE IF NOT EXISTS public.fighter_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  discipline public.discipline,
  license_number text NOT NULL,
  state public.license_state NOT NULL DEFAULT 'pending',
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 year'),
  notes text,
  created_by uuid,            -- app_user.id que realizó la acción
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_latest_license
ON public.fighter_licenses(fighter_id, license_number);

-- ============= UPDATES DE ESTADO FÍSICO =============
CREATE TABLE IF NOT EXISTS public.fighter_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  weight_kg numeric(5,2),
  bodyfat_pct numeric(4,1),
  injuries text,
  ready_to_fight boolean DEFAULT false,
  note text,
  created_at timestamptz DEFAULT now(),
  created_by uuid             -- app_user.id
);

CREATE INDEX IF NOT EXISTS idx_status_updates_fighter ON public.fighter_status_updates(fighter_id);

-- ============= PELEAS (HISTORIAL) =============
CREATE TABLE IF NOT EXISTS public.fights_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  event_name text,
  event_date date,
  discipline public.discipline,
  weight_class text,
  red_fighter_id uuid REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  blue_fighter_id uuid REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  result public.fight_result DEFAULT 'scheduled',
  method text,        -- KO/TKO/Decisión/Sumisión
  round int,
  time_in_round text, -- "3:12"
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fights_history_date ON public.fights_history(event_date);

-- ============= SOLICITUDES DE SPARRING/PELEA =============
CREATE TABLE IF NOT EXISTS public.sparring_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  to_fighter_id uuid REFERENCES public.fighter_profiles(id) ON DELETE SET NULL, -- null = abierto
  discipline public.discipline,
  weight_range text,     -- ej. "155–170 lbs"
  proposed_at timestamptz,
  location text,
  status public.request_status DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sparring_to ON public.sparring_requests(to_fighter_id);

-- ============= VISTA PÚBLICA (LECTURA) =============
CREATE OR REPLACE VIEW public.public_fighter_profile AS
SELECT
  fp.id,
  fp.first_name,
  fp.last_name,
  fp.nickname,
  fp.country,
  fp.weight_class,
  fp.height_cm,
  fp.weight_kg,
  fp.reach_cm,
  fp.fighting_style,
  fp.bio,
  fp.avatar_url,
  fp.record_wins,
  fp.record_losses,
  fp.record_draws,
  fp.elo_rating,
  fp.active,
  fp.discipline,
  fp.level,
  fp.organization_id,
  o.name as organization_name
FROM public.fighter_profiles fp
LEFT JOIN public.organizations o ON o.id = fp.organization_id
WHERE fp.active = true;

-- ============= RLS POLÍTICAS =============
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fighter_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fighter_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fights_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sparring_requests ENABLE ROW LEVEL SECURITY;

-- helper: es_admin?
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.app_user WHERE auth_user_id = auth.uid() AND is_admin = true);
$$;

-- app_user: solo tú
DROP POLICY IF EXISTS app_user_self_select ON public.app_user;
CREATE POLICY app_user_self_select ON public.app_user
  FOR SELECT USING (auth.uid() = auth_user_id OR public.is_admin());

DROP POLICY IF EXISTS app_user_self_write ON public.app_user;
CREATE POLICY app_user_self_write ON public.app_user
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY app_user_self_update ON public.app_user
  FOR UPDATE USING (auth.uid() = auth_user_id OR public.is_admin());

-- organizations: solo admin escribe, todos leen
DROP POLICY IF EXISTS orgs_read ON public.organizations;
CREATE POLICY orgs_read ON public.organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS orgs_admin_write ON public.organizations;
CREATE POLICY orgs_admin_write ON public.organizations FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY orgs_admin_update ON public.organizations FOR UPDATE USING (public.is_admin());

-- fighter_licenses: dueño lee sus licencias, admin total
DROP POLICY IF EXISTS lic_select ON public.fighter_licenses;
CREATE POLICY lic_select ON public.fighter_licenses
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.fighter_profiles fp WHERE fp.id = fighter_id
      AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS lic_insert_admin ON public.fighter_licenses;
CREATE POLICY lic_insert_admin ON public.fighter_licenses
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lic_update_admin ON public.fighter_licenses;
CREATE POLICY lic_update_admin ON public.fighter_licenses
  FOR UPDATE USING (public.is_admin());

-- status updates: dueño escribe/lee lo suyo, admin total
DROP POLICY IF EXISTS su_select ON public.fighter_status_updates;
CREATE POLICY su_select ON public.fighter_status_updates
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.fighter_profiles fp 
      WHERE fp.id = fighter_id
      AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS su_insert_owner ON public.fighter_status_updates;
CREATE POLICY su_insert_owner ON public.fighter_status_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fighter_profiles fp 
      WHERE fp.id = fighter_id
      AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid())
    )
  );

-- fights: lectura pública (eventos), admin escribe
DROP POLICY IF EXISTS fights_read ON public.fights_history;
CREATE POLICY fights_read ON public.fights_history FOR SELECT USING (true);

DROP POLICY IF EXISTS fights_admin_write ON public.fights_history;
CREATE POLICY fights_admin_write ON public.fights_history
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY fights_admin_update ON public.fights_history
  FOR UPDATE USING (public.is_admin());

-- sparring: dueño lee/enruta sus solicitudes; admin total
DROP POLICY IF EXISTS sp_select ON public.sparring_requests;
CREATE POLICY sp_select ON public.sparring_requests
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.fighter_profiles fp WHERE fp.id = from_fighter_id
               AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.fighter_profiles fp WHERE fp.id = to_fighter_id
               AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid()))
  );

DROP POLICY IF EXISTS sp_insert_owner ON public.sparring_requests;
CREATE POLICY sp_insert_owner ON public.sparring_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.fighter_profiles fp WHERE fp.id = from_fighter_id
            AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid()))
  );

DROP POLICY IF EXISTS sp_update_parties_or_admin ON public.sparring_requests;
CREATE POLICY sp_update_parties_or_admin ON public.sparring_requests
  FOR UPDATE USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.fighter_profiles fp WHERE fp.id = from_fighter_id
               AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.fighter_profiles fp WHERE fp.id = to_fighter_id
               AND EXISTS (SELECT 1 FROM public.app_user au WHERE au.id = fp.user_id AND au.auth_user_id = auth.uid()))
  );

-- Función para auto-expirar licencias
CREATE OR REPLACE FUNCTION public.expire_old_licenses() RETURNS void 
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.fighter_licenses
  SET state = 'expired'
  WHERE state = 'active' AND expires_at < now();
$$;