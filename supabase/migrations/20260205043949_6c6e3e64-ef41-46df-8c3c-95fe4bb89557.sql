-- Create function to sync fighter_profiles changes to fighter_rankings
CREATE OR REPLACE FUNCTION public.sync_fighter_profile_to_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar level a todos los rankings activos
  IF OLD.level IS DISTINCT FROM NEW.level THEN
    UPDATE public.fighter_rankings
    SET level = NEW.level,
        updated_at = now()
    WHERE fighter_id = NEW.id 
      AND is_active = true;
    
    -- Log the synchronization for audit
    RAISE NOTICE 'Synced level "%" to fighter_rankings for fighter %', NEW.level, NEW.id;
  END IF;
  
  -- Sincronizar weight_class a todos los rankings activos
  IF OLD.weight_class IS DISTINCT FROM NEW.weight_class THEN
    UPDATE public.fighter_rankings
    SET weight_class = NEW.weight_class,
        updated_at = now()
    WHERE fighter_id = NEW.id 
      AND is_active = true;
    
    -- Log the synchronization for audit
    RAISE NOTICE 'Synced weight_class "%" to fighter_rankings for fighter %', NEW.weight_class, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that fires after profile updates
DROP TRIGGER IF EXISTS sync_profile_to_rankings_trigger ON public.fighter_profiles;
CREATE TRIGGER sync_profile_to_rankings_trigger
AFTER UPDATE OF level, weight_class ON public.fighter_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_fighter_profile_to_rankings();

-- Create index to optimize ranking lookups by fighter_id
CREATE INDEX IF NOT EXISTS idx_fighter_rankings_fighter_id_active 
ON public.fighter_rankings(fighter_id) 
WHERE is_active = true;

-- Add comment for documentation
COMMENT ON FUNCTION public.sync_fighter_profile_to_rankings() IS 
'Automatically syncs level and weight_class from fighter_profiles to all active fighter_rankings entries when a profile is updated';