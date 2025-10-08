-- Crear tabla de invitaciones para peleadores
CREATE TABLE public.fighter_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  weight_class TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  fighter_profile_id UUID REFERENCES public.fighter_profiles(id)
);

-- Crear índices para optimizar búsquedas
CREATE INDEX idx_fighter_invitations_token ON public.fighter_invitations(token);
CREATE INDEX idx_fighter_invitations_email ON public.fighter_invitations(email);
CREATE INDEX idx_fighter_invitations_status ON public.fighter_invitations(status);

-- Habilitar Row Level Security
ALTER TABLE public.fighter_invitations ENABLE ROW LEVEL SECURITY;

-- Política: Admins pueden gestionar todas las invitaciones
CREATE POLICY "Admins can manage all invitations"
ON public.fighter_invitations
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política: Cualquiera puede leer invitaciones por token (necesario para registro)
CREATE POLICY "Anyone can read by token for registration"
ON public.fighter_invitations
FOR SELECT
USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.fighter_invitations IS 'Tabla de invitaciones para registro de peleadores';
COMMENT ON COLUMN public.fighter_invitations.status IS 'Estados: pending, accepted, expired, cancelled';
COMMENT ON COLUMN public.fighter_invitations.token IS 'Token único para validar registro (UUID)';
COMMENT ON COLUMN public.fighter_invitations.expires_at IS 'Las invitaciones expiran en 7 días por defecto';