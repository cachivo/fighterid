-- Actualizar enum de disciplinas en todas las tablas

-- Paso 1: Crear tipo temporal
CREATE TYPE discipline_new AS ENUM ('Baile', 'Boxeo', 'Canto');

-- Paso 2: Agregar columnas temporales en todas las tablas que usan discipline
ALTER TABLE public.fighter_profiles ADD COLUMN discipline_temp discipline_new;
ALTER TABLE public.fighter_licenses ADD COLUMN discipline_temp discipline_new;
ALTER TABLE public.fights_history ADD COLUMN discipline_temp discipline_new;
ALTER TABLE public.sparring_requests ADD COLUMN discipline_temp discipline_new;

-- Paso 3: Migrar datos - todos los valores se convierten a Boxeo por defecto
UPDATE public.fighter_profiles 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_new
  WHEN discipline::text = 'Baile' THEN 'Baile'::discipline_new
  WHEN discipline::text = 'Canto' THEN 'Canto'::discipline_new
  ELSE 'Boxeo'::discipline_new
END;

UPDATE public.fighter_licenses 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_new
  WHEN discipline::text = 'Baile' THEN 'Baile'::discipline_new
  WHEN discipline::text = 'Canto' THEN 'Canto'::discipline_new
  ELSE 'Boxeo'::discipline_new
END;

UPDATE public.fights_history 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_new
  WHEN discipline::text = 'Baile' THEN 'Baile'::discipline_new
  WHEN discipline::text = 'Canto' THEN 'Canto'::discipline_new
  ELSE 'Boxeo'::discipline_new
END;

UPDATE public.sparring_requests 
SET discipline_temp = CASE 
  WHEN discipline::text = 'Boxeo' THEN 'Boxeo'::discipline_new
  WHEN discipline::text = 'Baile' THEN 'Baile'::discipline_new
  WHEN discipline::text = 'Canto' THEN 'Canto'::discipline_new
  ELSE 'Boxeo'::discipline_new
END;

-- Paso 4: Eliminar columnas antiguas
ALTER TABLE public.fighter_profiles DROP COLUMN discipline;
ALTER TABLE public.fighter_licenses DROP COLUMN discipline;
ALTER TABLE public.fights_history DROP COLUMN discipline;
ALTER TABLE public.sparring_requests DROP COLUMN discipline;

-- Paso 5: Renombrar columnas temporales
ALTER TABLE public.fighter_profiles RENAME COLUMN discipline_temp TO discipline;
ALTER TABLE public.fighter_licenses RENAME COLUMN discipline_temp TO discipline;
ALTER TABLE public.fights_history RENAME COLUMN discipline_temp TO discipline;
ALTER TABLE public.sparring_requests RENAME COLUMN discipline_temp TO discipline;

-- Paso 6: Eliminar tipo antiguo con CASCADE y renombrar el nuevo
DROP TYPE discipline CASCADE;
ALTER TYPE discipline_new RENAME TO discipline;

COMMENT ON TYPE discipline IS 'Disciplinas disponibles: Baile, Boxeo, Canto';