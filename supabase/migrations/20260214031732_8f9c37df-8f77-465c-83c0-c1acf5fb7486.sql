
-- =============================================
-- Email Campaigns V2: Drafts & TipTap Editor
-- =============================================

-- Table for draft campaigns with auto-save support
CREATE TABLE public.email_campaigns_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL DEFAULT 'Sin título',
  asunto TEXT NOT NULL DEFAULT '',
  preview_text TEXT DEFAULT '',
  html_content TEXT DEFAULT '',
  json_content JSONB DEFAULT '{}',
  from_name TEXT DEFAULT 'Fighter ID',
  from_email TEXT DEFAULT 'noreply@fighterid.com',
  reply_to TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programada', 'enviando', 'enviada', 'error')),
  recipient_filter TEXT DEFAULT 'all',
  metadata JSONB DEFAULT '{}',
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  last_autosave TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for campaign image metadata
CREATE TABLE public.email_campaign_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns_v2(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT DEFAULT '',
  public_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for reusable email templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  html_content TEXT DEFAULT '',
  json_content JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  categoria TEXT DEFAULT 'general',
  activo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_campaigns_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_campaigns_v2
CREATE POLICY "Admins can manage campaigns v2"
  ON public.email_campaigns_v2
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for email_campaign_images
CREATE POLICY "Admins can manage campaign images"
  ON public.email_campaign_images
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage templates"
  ON public.email_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (activo = true);

-- Trigger for updated_at
CREATE TRIGGER update_email_campaigns_v2_updated_at
  BEFORE UPDATE ON public.email_campaigns_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_email_campaigns_v2_estado ON public.email_campaigns_v2(estado);
CREATE INDEX idx_email_campaigns_v2_created_by ON public.email_campaigns_v2(created_by);
CREATE INDEX idx_email_campaign_images_campaign ON public.email_campaign_images(campaign_id);

-- Storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-campaign-images', 'email-campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload campaign images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'email-campaign-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update campaign images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'email-campaign-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete campaign images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'email-campaign-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Campaign images are publicly viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'email-campaign-images');
