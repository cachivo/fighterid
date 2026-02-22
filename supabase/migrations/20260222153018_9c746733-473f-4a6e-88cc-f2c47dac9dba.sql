
-- 1. Sincronizar owner_id con auth_user_id de los OWNERs existentes
UPDATE gyms g SET owner_id = au.auth_user_id
FROM gym_staff gs
JOIN app_user au ON au.id = gs.user_id
WHERE gs.gym_id = g.id AND gs.role = 'OWNER' AND gs.active = true;

-- 2. Trigger para mantener sincronizado automáticamente
CREATE OR REPLACE FUNCTION public.sync_gym_owner_from_staff()
RETURNS TRIGGER AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.role = 'OWNER' AND NEW.active = true THEN
    SELECT auth_user_id INTO v_auth_user_id FROM app_user WHERE id = NEW.user_id;
    IF v_auth_user_id IS NOT NULL THEN
      UPDATE gyms SET owner_id = v_auth_user_id WHERE id = NEW.gym_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'OWNER' AND (NEW.active = false OR NEW.role != 'OWNER') THEN
    SELECT auth_user_id INTO v_auth_user_id FROM app_user WHERE id = OLD.user_id;
    IF v_auth_user_id IS NOT NULL THEN
      UPDATE gyms SET owner_id = NULL WHERE id = NEW.gym_id AND owner_id = v_auth_user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'OWNER' THEN
    SELECT auth_user_id INTO v_auth_user_id FROM app_user WHERE id = OLD.user_id;
    IF v_auth_user_id IS NOT NULL THEN
      UPDATE gyms SET owner_id = NULL WHERE id = OLD.gym_id AND owner_id = v_auth_user_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_sync_gym_owner
AFTER INSERT OR UPDATE OR DELETE ON public.gym_staff
FOR EACH ROW
EXECUTE FUNCTION public.sync_gym_owner_from_staff();
