-- ============================================================================
-- SECURE ROLE-BASED ACCESS CONTROL SYSTEM
-- ============================================================================
-- This migration implements a professional RBAC system to replace the
-- insecure is_admin boolean field with a proper user_roles table
-- ============================================================================

-- 1. CREATE ROLE ENUM
-- ----------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. CREATE USER_ROLES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SECURITY DEFINER FUNCTION (Prevents RLS recursion)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. CREATE AUXILIARY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Function to assign a role to a user (admin only)
CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_user_id uuid,
  p_role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (p_user_id, p_role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to remove a role from a user (admin only)
CREATE OR REPLACE FUNCTION public.remove_user_role(
  p_user_id uuid,
  p_role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can remove roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can remove roles';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = p_user_id AND role = p_role;
END;
$$;

-- 5. MIGRATE EXISTING DATA
-- ----------------------------------------------------------------------------

-- Migrate existing admins from app_user.is_admin = true
INSERT INTO public.user_roles (user_id, role)
SELECT au.auth_user_id, 'admin'::public.app_role
FROM public.app_user au
WHERE au.is_admin = true
  AND au.auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Add lunatime@hotmail.com as admin
INSERT INTO public.user_roles (user_id, role)
SELECT au.auth_user_id, 'admin'::public.app_role
FROM public.app_user au
WHERE au.email = 'lunatime@hotmail.com'
  AND au.auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign default 'user' role to all existing users who don't have a role yet
INSERT INTO public.user_roles (user_id, role)
SELECT au.auth_user_id, 'user'::public.app_role
FROM public.app_user au
WHERE au.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = au.auth_user_id
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. CREATE RLS POLICIES FOR USER_ROLES TABLE
-- ----------------------------------------------------------------------------

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert roles (via function)
CREATE POLICY "Admins can insert roles via function"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles (via function)
CREATE POLICY "Admins can delete roles via function"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. UPDATE EXISTING is_admin() FUNCTION TO USE NEW SYSTEM
-- ----------------------------------------------------------------------------
-- This maintains backward compatibility while transitioning to new system

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 8. ADD TRIGGER TO AUTO-ASSIGN 'user' ROLE TO NEW USERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign 'user' role to newly created app_user
  IF NEW.auth_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.auth_user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_app_user_created_assign_role
  AFTER INSERT ON public.app_user
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 9. ADD HELPFUL COMMENTS
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.user_roles IS 'Stores user role assignments for role-based access control (RBAC)';
COMMENT ON COLUMN public.user_roles.user_id IS 'Reference to auth.users - the user who has this role';
COMMENT ON COLUMN public.user_roles.role IS 'The role assigned to the user (admin, moderator, or user)';
COMMENT ON COLUMN public.user_roles.assigned_by IS 'The admin user who assigned this role';
COMMENT ON FUNCTION public.has_role IS 'Security definer function to check if a user has a specific role - prevents RLS recursion';
COMMENT ON FUNCTION public.has_any_role IS 'Security definer function to check if a user has any of the specified roles';
COMMENT ON COLUMN public.app_user.is_admin IS 'DEPRECATED: Use user_roles table instead. This field is maintained for backward compatibility only.';