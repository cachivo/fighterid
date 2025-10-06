-- Sync is_admin field in app_user with user_roles table
UPDATE app_user au
SET is_admin = EXISTS (
  SELECT 1 
  FROM user_roles ur 
  WHERE ur.user_id = au.auth_user_id 
  AND ur.role = 'admin'
);

-- Create trigger to keep is_admin in sync when user_roles changes
CREATE OR REPLACE FUNCTION sync_app_user_is_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update is_admin based on whether user has admin role
  IF TG_OP = 'INSERT' AND NEW.role = 'admin' THEN
    UPDATE app_user 
    SET is_admin = true 
    WHERE auth_user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
    -- Check if user still has admin role after deletion
    UPDATE app_user 
    SET is_admin = EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = OLD.user_id AND role = 'admin'
    )
    WHERE auth_user_id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_is_admin_on_role_change ON user_roles;
CREATE TRIGGER sync_is_admin_on_role_change
  AFTER INSERT OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_app_user_is_admin();

COMMENT ON FUNCTION sync_app_user_is_admin IS 'Keeps app_user.is_admin in sync with user_roles table';
COMMENT ON TRIGGER sync_is_admin_on_role_change ON user_roles IS 'Automatically updates app_user.is_admin when admin role is added or removed';