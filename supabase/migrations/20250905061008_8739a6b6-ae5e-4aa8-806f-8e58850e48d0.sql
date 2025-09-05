-- Create profile change requests table
CREATE TABLE public.profile_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  fighter_profile_id UUID NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  requested_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_INFO')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.app_user(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create change request audit log table
CREATE TABLE public.change_request_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.profile_change_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  performed_by UUID REFERENCES public.app_user(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_request_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_change_requests
CREATE POLICY "Users can create requests for their own profiles"
  ON public.profile_change_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fighter_profiles fp 
      WHERE fp.id = profile_change_requests.fighter_profile_id 
      AND fp.user_id = profile_change_requests.user_id
      AND EXISTS (
        SELECT 1 FROM public.app_user au 
        WHERE au.id = profile_change_requests.user_id 
        AND au.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their own requests"
  ON public.profile_change_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.id = profile_change_requests.user_id 
      AND au.auth_user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Admins can manage all requests"
  ON public.profile_change_requests
  FOR ALL
  USING (is_admin());

-- RLS policies for change_request_audit
CREATE POLICY "Admins can manage audit logs"
  ON public.change_request_audit
  FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view audit logs for their requests"
  ON public.change_request_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_change_requests pcr
      JOIN public.app_user au ON au.id = pcr.user_id
      WHERE pcr.id = change_request_audit.request_id
      AND au.auth_user_id = auth.uid()
    ) OR is_admin()
  );

-- Create function to log audit trail
CREATE OR REPLACE FUNCTION public.log_change_request_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.change_request_audit (
      request_id, action, old_status, new_status, performed_by
    ) VALUES (
      NEW.id, 'STATUS_CHANGED', OLD.status, NEW.status, NEW.reviewed_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE TRIGGER log_change_request_audit_trigger
  AFTER UPDATE ON public.profile_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_change_request_audit();

-- Add indexes for performance
CREATE INDEX idx_profile_change_requests_user_id ON public.profile_change_requests(user_id);
CREATE INDEX idx_profile_change_requests_status ON public.profile_change_requests(status);
CREATE INDEX idx_profile_change_requests_fighter_profile_id ON public.profile_change_requests(fighter_profile_id);
CREATE INDEX idx_change_request_audit_request_id ON public.change_request_audit(request_id);