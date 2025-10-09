-- ============================================
-- Security Fix: Fighter Invitations - Remove Public Access
-- ============================================

-- Drop the insecure public policy
DROP POLICY IF EXISTS "Anyone can read by token for registration" ON public.fighter_invitations;

-- Create secure RPC function to validate invitation by token
-- This prevents scanning the entire table
CREATE OR REPLACE FUNCTION public.validate_fighter_invitation(p_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  weight_class TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return invitation if token is valid and not expired
  RETURN QUERY
  SELECT 
    fi.id,
    fi.email,
    fi.first_name,
    fi.last_name,
    fi.phone,
    fi.weight_class,
    fi.expires_at
  FROM public.fighter_invitations fi
  WHERE fi.token = p_token
    AND fi.status = 'pending'
    AND fi.expires_at > now();
END;
$$;

-- Create secure RPC function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_fighter_invitation(
  p_token TEXT,
  p_fighter_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
BEGIN
  -- Verify token is valid and not expired
  SELECT id INTO v_invitation_id
  FROM public.fighter_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();
  
  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Update invitation status
  UPDATE public.fighter_invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    fighter_profile_id = p_fighter_profile_id
  WHERE id = v_invitation_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_fighter_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_fighter_invitation(TEXT, UUID) TO authenticated;

-- Also grant to anon for registration flow (users registering via invitation aren't authenticated yet)
GRANT EXECUTE ON FUNCTION public.validate_fighter_invitation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.accept_fighter_invitation(TEXT, UUID) TO anon;