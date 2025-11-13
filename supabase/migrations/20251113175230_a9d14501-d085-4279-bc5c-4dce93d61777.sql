-- Crear tabla de gimnasios
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  telefono TEXT,
  whatsapp TEXT,
  email TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT DEFAULT 'Honduras',
  disciplinas TEXT[] DEFAULT '{}',
  logo_url TEXT,
  banner_url TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  website TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de entrenadores
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  bio TEXT,
  telefono TEXT,
  whatsapp TEXT,
  email TEXT,
  ciudad TEXT,
  pais TEXT DEFAULT 'Honduras',
  especialidades TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vincular fighter_profiles con gyms y coaches
ALTER TABLE public.fighter_profiles
  ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS gyms_slug_idx ON public.gyms(slug);
CREATE INDEX IF NOT EXISTS gyms_ciudad_idx ON public.gyms(ciudad);
CREATE INDEX IF NOT EXISTS gyms_activo_idx ON public.gyms(activo);
CREATE INDEX IF NOT EXISTS coaches_slug_idx ON public.coaches(slug);
CREATE INDEX IF NOT EXISTS coaches_gym_idx ON public.coaches(gym_id);
CREATE INDEX IF NOT EXISTS coaches_activo_idx ON public.coaches(activo);
CREATE INDEX IF NOT EXISTS fighter_profiles_gym_idx ON public.fighter_profiles(gym_id);
CREATE INDEX IF NOT EXISTS fighter_profiles_coach_idx ON public.fighter_profiles(coach_id);

-- Triggers para actualizar updated_at
CREATE TRIGGER gyms_updated_at BEFORE UPDATE ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER coaches_updated_at BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Lectura pública de gimnasios y entrenadores activos
CREATE POLICY "gyms_public_read" ON public.gyms
  FOR SELECT USING (activo = TRUE);

CREATE POLICY "coaches_public_read" ON public.coaches
  FOR SELECT USING (activo = TRUE);

-- Admins pueden gestionar todo
CREATE POLICY "gyms_admin_all" ON public.gyms
  FOR ALL USING (is_admin());

CREATE POLICY "coaches_admin_all" ON public.coaches
  FOR ALL USING (is_admin());

-- Owners pueden gestionar sus propios registros
CREATE POLICY "gyms_owner_manage" ON public.gyms
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "coaches_owner_manage" ON public.coaches
  FOR ALL USING (auth.uid() = owner_id);

-- Storage buckets y policies
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('gyms', 'gyms', TRUE),
  ('coaches', 'coaches', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policies para gyms bucket
CREATE POLICY "gyms_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gyms' AND
    (is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "gyms_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'gyms');

CREATE POLICY "gyms_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gyms' AND
    (is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
  );

-- Policies para coaches bucket
CREATE POLICY "coaches_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'coaches' AND
    (is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "coaches_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'coaches');

CREATE POLICY "coaches_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'coaches' AND
    (is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
  );