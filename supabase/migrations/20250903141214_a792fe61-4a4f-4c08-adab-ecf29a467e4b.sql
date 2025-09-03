-- License-Driven System Migration
-- Restructure around licenses as the central entity

-- Create license level enum
CREATE TYPE public.license_level AS ENUM ('AMATEUR', 'SEMI_PRO', 'PROFESSIONAL', 'SUSPENDED', 'RETIRED');

-- Create license status workflow enum  
CREATE TYPE public.license_status AS ENUM ('APPLIED', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- Update fighter_licenses table to be the central entity
ALTER TABLE public.fighter_licenses 
  DROP COLUMN IF EXISTS state,
  ADD COLUMN license_level public.license_level DEFAULT 'AMATEUR',
  ADD COLUMN status public.license_status DEFAULT 'PENDING_REVIEW',
  ADD COLUMN medical_cleared boolean DEFAULT false,
  ADD COLUMN medical_expires_at timestamp with time zone,
  ADD COLUMN physical_cleared boolean DEFAULT false,
  ADD COLUMN next_fight_date timestamp with time zone,
  ADD COLUMN suspension_reason text,
  ADD COLUMN suspension_until timestamp with time zone,
  ADD COLUMN approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN approved_at timestamp with time zone,
  ADD COLUMN version integer DEFAULT 1,
  ADD COLUMN qr_code_url text,
  ADD COLUMN is_primary boolean DEFAULT true;

-- Create license audit log table
CREATE TABLE public.license_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.fighter_licenses(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_status public.license_status,
  new_status public.license_status,
  old_level public.license_level,
  new_level public.license_level,
  reason text,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Create medical certifications table
CREATE TABLE public.medical_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.fighter_licenses(id) ON DELETE CASCADE,
  certification_type text NOT NULL, -- 'ANNUAL', 'PRE_FIGHT', 'POST_INJURY'
  issued_date timestamp with time zone DEFAULT now(),
  expires_date timestamp with time zone NOT NULL,
  issued_by text NOT NULL, -- Doctor/clinic name
  medical_number text, -- Medical license number
  cleared boolean DEFAULT true,
  restrictions text,
  notes text,
  file_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create fight bookings table (upcoming fights)
CREATE TABLE public.fight_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.fighter_licenses(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  scheduled_date timestamp with time zone NOT NULL,
  opponent_license_id uuid REFERENCES public.fighter_licenses(id),
  weight_class text NOT NULL,
  fight_type text DEFAULT 'AMATEUR', -- 'AMATEUR', 'PROFESSIONAL'
  status text DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'CONFIRMED', 'CANCELLED'
  venue text,
  promoter text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create license verification tokens table (for QR codes)
CREATE TABLE public.license_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.fighter_licenses(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.license_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for license_audit_log
CREATE POLICY "Admins can view all audit logs" ON public.license_audit_log
  FOR SELECT USING (is_admin());

CREATE POLICY "License owners can view their audit logs" ON public.license_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fighter_licenses fl
      JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
      JOIN public.app_user au ON au.id = fp.user_id
      WHERE fl.id = license_audit_log.license_id 
      AND au.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for medical_certifications
CREATE POLICY "Admins can manage medical certifications" ON public.medical_certifications
  FOR ALL USING (is_admin());

CREATE POLICY "License owners can view their medical certifications" ON public.medical_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fighter_licenses fl
      JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
      JOIN public.app_user au ON au.id = fp.user_id
      WHERE fl.id = medical_certifications.license_id 
      AND au.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for fight_bookings
CREATE POLICY "Admins can manage fight bookings" ON public.fight_bookings
  FOR ALL USING (is_admin());

CREATE POLICY "License owners can view their fight bookings" ON public.fight_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fighter_licenses fl
      JOIN public.fighter_profiles fp ON fp.id = fl.fighter_id
      JOIN public.app_user au ON au.id = fp.user_id
      WHERE fl.id = fight_bookings.license_id 
      AND au.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for license_verification_tokens
CREATE POLICY "Public can read verification tokens" ON public.license_verification_tokens
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage verification tokens" ON public.license_verification_tokens
  FOR ALL USING (is_admin());

-- Functions for license workflow
CREATE OR REPLACE FUNCTION public.approve_license(
  p_license_id uuid,
  p_level public.license_level DEFAULT 'AMATEUR'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status public.license_status;
  v_old_level public.license_level;
BEGIN
  -- Only admins can approve licenses
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve licenses';
  END IF;

  -- Get current status and level
  SELECT status, license_level INTO v_old_status, v_old_level
  FROM public.fighter_licenses 
  WHERE id = p_license_id;

  -- Update license
  UPDATE public.fighter_licenses 
  SET 
    status = 'ACTIVE',
    license_level = p_level,
    approved_by = auth.uid(),
    approved_at = now(),
    version = version + 1
  WHERE id = p_license_id;

  -- Log the action
  INSERT INTO public.license_audit_log (
    license_id, action, old_status, new_status, old_level, new_level,
    reason, performed_by
  ) VALUES (
    p_license_id, 'APPROVED', v_old_status, 'ACTIVE', v_old_level, p_level,
    'License approved by admin', auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.suspend_license(
  p_license_id uuid,
  p_reason text,
  p_until timestamp with time zone DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status public.license_status;
BEGIN
  -- Only admins can suspend licenses
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can suspend licenses';
  END IF;

  -- Get current status
  SELECT status INTO v_old_status
  FROM public.fighter_licenses 
  WHERE id = p_license_id;

  -- Update license
  UPDATE public.fighter_licenses 
  SET 
    status = 'SUSPENDED',
    suspension_reason = p_reason,
    suspension_until = p_until,
    version = version + 1
  WHERE id = p_license_id;

  -- Log the action
  INSERT INTO public.license_audit_log (
    license_id, action, old_status, new_status,
    reason, performed_by
  ) VALUES (
    p_license_id, 'SUSPENDED', v_old_status, 'SUSPENDED',
    p_reason, auth.uid()
  );
END;
$$;

-- Function to generate QR verification token
CREATE OR REPLACE FUNCTION public.generate_license_qr_token(p_license_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Clean up old tokens for this license
  DELETE FROM public.license_verification_tokens 
  WHERE license_id = p_license_id;
  
  -- Insert new token
  INSERT INTO public.license_verification_tokens (license_id, token)
  VALUES (p_license_id, v_token);
  
  RETURN v_token;
END;
$$;

-- Update existing triggers to use new audit system
CREATE OR REPLACE FUNCTION public.log_license_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log changes to license status or level
  IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.license_level IS DISTINCT FROM NEW.license_level) THEN
    INSERT INTO public.license_audit_log (
      license_id, action, old_status, new_status, old_level, new_level,
      performed_by
    ) VALUES (
      NEW.id, 'UPDATED', OLD.status, NEW.status, OLD.license_level, NEW.license_level,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic audit logging
DROP TRIGGER IF EXISTS trigger_log_license_changes ON public.fighter_licenses;
CREATE TRIGGER trigger_log_license_changes
  AFTER UPDATE ON public.fighter_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.log_license_changes();

-- Update fighter_profiles to reference primary license
ALTER TABLE public.fighter_profiles 
  ADD COLUMN primary_license_id uuid REFERENCES public.fighter_licenses(id);

-- Create index for better performance
CREATE INDEX idx_fighter_licenses_status ON public.fighter_licenses(status);
CREATE INDEX idx_fighter_licenses_level ON public.fighter_licenses(license_level);
CREATE INDEX idx_license_audit_log_license_id ON public.license_audit_log(license_id);
CREATE INDEX idx_medical_certifications_license_id ON public.medical_certifications(license_id);
CREATE INDEX idx_fight_bookings_license_id ON public.fight_bookings(license_id);
CREATE INDEX idx_license_verification_tokens_token ON public.license_verification_tokens(token);