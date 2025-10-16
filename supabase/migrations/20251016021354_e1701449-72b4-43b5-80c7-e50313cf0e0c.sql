-- Crear tabla para peleadores externos (no registrados)
CREATE TABLE IF NOT EXISTS public.external_fighters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nickname text,
  image_url text,
  weight_class text,
  record jsonb DEFAULT '{"wins": 0, "losses": 0, "draws": 0}'::jsonb,
  gym text,
  country text DEFAULT 'HN',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on external_fighters
ALTER TABLE public.external_fighters ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage external fighters
CREATE POLICY "Admins can manage external fighters"
ON public.external_fighters
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy: Public can view external fighters
CREATE POLICY "Public can view external fighters"
ON public.external_fighters
FOR SELECT
USING (true);

-- Extend fights table to support external fighters
ALTER TABLE public.fights 
ADD COLUMN IF NOT EXISTS fighter_a_external_id uuid REFERENCES public.external_fighters(id),
ADD COLUMN IF NOT EXISTS fighter_b_external_id uuid REFERENCES public.external_fighters(id);

-- Add constraint: at least one fighter identification method must be present
ALTER TABLE public.fights
ADD CONSTRAINT check_fighter_a_identification 
CHECK (fighter_a_id IS NOT NULL OR fighter_a_external_id IS NOT NULL);

ALTER TABLE public.fights
ADD CONSTRAINT check_fighter_b_identification 
CHECK (fighter_b_id IS NOT NULL OR fighter_b_external_id IS NOT NULL);

-- Create storage bucket for external fighter images
INSERT INTO storage.buckets (id, name, public)
VALUES ('external-fighter-images', 'external-fighter-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view external fighter images
CREATE POLICY "Public can view external fighter images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'external-fighter-images');

-- Storage policy: Admins can upload external fighter images
CREATE POLICY "Admins can upload external fighter images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'external-fighter-images' AND is_admin());

-- Storage policy: Admins can update external fighter images
CREATE POLICY "Admins can update external fighter images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'external-fighter-images' AND is_admin());

-- Storage policy: Admins can delete external fighter images
CREATE POLICY "Admins can delete external fighter images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'external-fighter-images' AND is_admin());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_external_fighters_name ON public.external_fighters(name);
CREATE INDEX IF NOT EXISTS idx_fights_external_fighters ON public.fights(fighter_a_external_id, fighter_b_external_id);

-- Update trigger for external_fighters
CREATE TRIGGER update_external_fighters_updated_at
BEFORE UPDATE ON public.external_fighters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();