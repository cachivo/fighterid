-- Crear tabla de perfiles de peleadores
CREATE TABLE IF NOT EXISTS public.fighter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_user(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  country TEXT DEFAULT 'HN',
  weight_class TEXT NOT NULL,
  height_cm INTEGER,
  weight_kg NUMERIC(5,2),
  reach_cm INTEGER,
  fighting_style TEXT,
  record_wins INTEGER DEFAULT 0,
  record_losses INTEGER DEFAULT 0,
  record_draws INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1200,
  avatar_url TEXT,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.fighter_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Perfiles de peleadores públicos visible para todos" 
ON public.fighter_profiles 
FOR SELECT 
USING (active = true);

CREATE POLICY "Usuarios pueden crear su propio perfil de peleador" 
ON public.fighter_profiles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.app_user 
  WHERE id = fighter_profiles.user_id 
  AND auth_user_id = auth.uid()
));

CREATE POLICY "Usuarios pueden actualizar su propio perfil de peleador" 
ON public.fighter_profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.app_user 
  WHERE id = fighter_profiles.user_id 
  AND auth_user_id = auth.uid()
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_fighter_profiles_updated_at
BEFORE UPDATE ON public.fighter_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();