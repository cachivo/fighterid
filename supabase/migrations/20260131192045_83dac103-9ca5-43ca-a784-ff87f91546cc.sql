-- Create table for tracking individual email sends per campaign
CREATE TABLE public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaign_log(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error_message TEXT,
  bounce_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can manage email sends"
ON public.email_sends
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.app_user WHERE auth_user_id = auth.uid() AND is_admin = true)
);

-- Indexes for efficient queries
CREATE INDEX idx_email_sends_campaign ON public.email_sends(campaign_id);
CREATE INDEX idx_email_sends_status ON public.email_sends(status);
CREATE INDEX idx_email_sends_email ON public.email_sends(recipient_email);
CREATE INDEX idx_email_sends_created ON public.email_sends(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_email_sends_updated_at
BEFORE UPDATE ON public.email_sends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();