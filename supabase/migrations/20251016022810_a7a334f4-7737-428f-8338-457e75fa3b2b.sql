-- Agregar campos para fotos específicas del evento en la tabla fights
ALTER TABLE public.fights 
ADD COLUMN IF NOT EXISTS fighter_a_event_image_url text,
ADD COLUMN IF NOT EXISTS fighter_b_event_image_url text;

COMMENT ON COLUMN public.fights.fighter_a_event_image_url IS 'Foto específica del peleador A para este evento (opcional, si no existe usa avatar_url del perfil)';
COMMENT ON COLUMN public.fights.fighter_b_event_image_url IS 'Foto específica del peleador B para este evento (opcional, si no existe usa avatar_url del perfil)';

-- Crear storage bucket para fotos de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-fighter-images', 'event-fighter-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para event-fighter-images: Admins pueden subir
CREATE POLICY "Admins can upload event fighter images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-fighter-images' AND
  (SELECT is_admin FROM public.app_user WHERE auth_user_id = auth.uid())
);

-- RLS para event-fighter-images: Todos pueden ver
CREATE POLICY "Anyone can view event fighter images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-fighter-images');