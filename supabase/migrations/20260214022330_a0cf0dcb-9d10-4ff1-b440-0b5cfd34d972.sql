
-- Step 1: Insert missing gyms from fighter_profiles gym_name text
-- Using the canonical/normalized name for each group of variations

INSERT INTO public.gyms (nombre, slug, disciplinas, pais, activo) VALUES
  ('Dragones Templarios', 'dragones-templarios', ARRAY['MMA'], 'Honduras', true),
  ('Alfa y Omega MMA', 'alfa-y-omega-mma', ARRAY['MMA'], 'Honduras', true),
  ('Martial Gang', 'martial-gang', ARRAY['MMA'], 'Honduras', true),
  ('Pericka MMA Brotherhood', 'pericka-mma-brotherhood', ARRAY['MMA'], 'Honduras', true),
  ('Ortiz Hawaiian Kenpo MMA', 'ortiz-hawaiian-kenpo-mma', ARRAY['MMA'], 'Honduras', true),
  ('Las Palmas Boxing Club', 'las-palmas-boxing-club', ARRAY['Boxeo'], 'Honduras', true),
  ('Espíritu de Guerrero', 'espiritu-de-guerrero', ARRAY['MMA'], 'Honduras', true),
  ('Club Titan MMA', 'club-titan-mma', ARRAY['MMA'], 'Honduras', true),
  ('UCC Training Center', 'ucc-training-center', ARRAY['MMA'], 'Honduras', true),
  ('Coca Fuego Team', 'coca-fuego-team', ARRAY['MMA'], 'Honduras', true),
  ('Chung Do Kwang', 'chung-do-kwang', ARRAY['MMA'], 'Honduras', true),
  ('Club de Boxeo Rivers Choloma', 'club-de-boxeo-rivers-choloma', ARRAY['Boxeo'], 'Honduras', true),
  ('Fight Club Guatemala', 'fight-club-guatemala', ARRAY['MMA'], 'Guatemala', true),
  ('Hermanos Ortíz', 'hermanos-ortiz', ARRAY['MMA'], 'Honduras', true),
  ('HHF Munguia Boxing Club', 'hhf-munguia-boxing-club', ARRAY['Boxeo'], 'Honduras', true),
  ('Muñeco Gonzales', 'muneco-gonzales', ARRAY['Boxeo'], 'Honduras', true),
  ('Ruthless MMA Tabasco', 'ruthless-mma-tabasco', ARRAY['MMA'], 'Mexico', true),
  ('Schumanns Bonebreakers', 'schumanns-bonebreakers', ARRAY['MMA'], 'Honduras', true),
  ('Silverback MMA', 'silverback-mma', ARRAY['MMA'], 'Honduras', true),
  ('Sport Gim', 'sport-gim', ARRAY['MMA'], 'Honduras', true),
  ('Tao del Equilibrio', 'tao-del-equilibrio', ARRAY['MMA'], 'Honduras', true),
  ('Team Monca', 'team-monca', ARRAY['MMA'], 'Honduras', true),
  ('Team Pitbull', 'team-pitbull', ARRAY['MMA'], 'Honduras', true),
  ('Xfit', 'xfit', ARRAY['MMA'], 'Honduras', true)
ON CONFLICT DO NOTHING;

-- Step 2: Link fighters to their gym_id using fuzzy match on gym_name
-- Dragones Templarios variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'dragones-templarios'), gym_name = 'Dragones Templarios'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('dragones templarios');

-- Alfa y Omega MMA variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'alfa-y-omega-mma'), gym_name = 'Alfa y Omega MMA'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('alfa y omega mma', 'alfa & omega mma', 'alfa y omega');

-- Martial Gang variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'martial-gang'), gym_name = 'Martial Gang'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('martial gang', 'martial gang comayagua');

-- Pericka MMA Brotherhood variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'pericka-mma-brotherhood'), gym_name = 'Pericka MMA Brotherhood'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('pericka mma brotherhood', 'perikammabrothehood');

-- Ortiz Hawaiian Kenpo MMA variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'ortiz-hawaiian-kenpo-mma'), gym_name = 'Ortiz Hawaiian Kenpo MMA'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('ortiz hawaiian kenpo mma', 'ortiz hawaiian kenpp');

-- Las Palmas Boxing Club variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'las-palmas-boxing-club'), gym_name = 'Las Palmas Boxing Club'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('las palmas boxing club', 'gimnasio las palmas boxing club');

-- Espíritu de Guerrero variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'espiritu-de-guerrero'), gym_name = 'Espíritu de Guerrero'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('espíritu de guerrero', 'espíritu de guerrero mma');

-- Club Titan MMA variations
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'club-titan-mma'), gym_name = 'Club Titan MMA'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('club titan mma', 'titán mma');

-- Lunaticos (already exists)
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'lunaticos'), gym_name = 'Lunaticos'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('lunaticos team', 'lunático team');

-- UCC Training Center
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'ucc-training-center'), gym_name = 'UCC Training Center'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('ucc training center');

-- Single-fighter gyms
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'coca-fuego-team'), gym_name = 'Coca Fuego Team'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'coca fuego team';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'chung-do-kwang'), gym_name = 'Chung Do Kwang'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'chung do kwang';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'club-de-boxeo-rivers-choloma'), gym_name = 'Club de Boxeo Rivers Choloma'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'club de boxeo rivers choloma';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'fight-club-guatemala'), gym_name = 'Fight Club Guatemala'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'fight club guatemala';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'hermanos-ortiz'), gym_name = 'Hermanos Ortíz'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'hermanos ortíz';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'hhf-munguia-boxing-club'), gym_name = 'HHF Munguia Boxing Club'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'hhf, munguia boxing club';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'muneco-gonzales'), gym_name = 'Muñeco Gonzales'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'muñeco gonzales';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'ruthless-mma-tabasco'), gym_name = 'Ruthless MMA Tabasco'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'ruthless mma tabasco';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'schumanns-bonebreakers'), gym_name = 'Schumanns Bonebreakers'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('schumanns bonebreakers comayagua', 'schummans karate comayagua');

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'silverback-mma'), gym_name = 'Silverback MMA'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'silverback mma';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'sport-gim'), gym_name = 'Sport Gim'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'sport gim';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'tao-del-equilibrio'), gym_name = 'Tao del Equilibrio'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'tao del equilibrio';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'team-monca'), gym_name = 'Team Monca'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'team monca';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'team-pitbull'), gym_name = 'Team Pitbull'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'team pitbull';

UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'xfit'), gym_name = 'Xfit'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) = 'xfit';

-- Also link fighters who have "Club de Boxeo Chele Munguia" text to existing gym
UPDATE public.fighter_profiles SET gym_id = (SELECT id FROM public.gyms WHERE slug = 'club-de-boxeo-chele-munguia'), gym_name = 'Club de Boxeo Chele Munguia'
WHERE gym_id IS NULL AND LOWER(TRIM(gym_name)) IN ('club de boxeo chele munguía', 'club de boxeo chele munguia');
