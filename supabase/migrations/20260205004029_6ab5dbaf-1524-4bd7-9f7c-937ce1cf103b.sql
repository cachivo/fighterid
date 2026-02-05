
-- ===========================================
-- Uniformidad de Base de Datos - Fighter ID
-- ===========================================

-- Fase 1.1: Normalizar países a nombres completos
UPDATE fighter_profiles SET country = 'Honduras' WHERE country IN ('HN', 'Honduras ');
UPDATE fighter_profiles SET country = 'Guatemala' WHERE country = 'GUATEMALA';
UPDATE fighter_profiles SET country = 'Panamá' WHERE country = 'PANAMA';
UPDATE fighter_profiles SET country = 'Nicaragua' WHERE country = 'NICARAGUA';
UPDATE fighter_profiles SET country = 'México' WHERE country = 'MEXICO';
UPDATE fighter_profiles SET country = 'Canadá' WHERE country = 'CANADA';
UPDATE fighter_profiles SET country = 'El Salvador' WHERE country = 'EL SALVADOR';

-- Fase 1.2: Normalizar niveles de peleadores
UPDATE fighter_profiles SET level = 'Amateur' WHERE level = 'AMATEUR';
UPDATE fighter_profiles SET level = 'Semi-profesional' WHERE level IN ('SEMI_PRO', 'Semi-Profesional');
UPDATE fighter_profiles SET level = 'Amateur' WHERE level IS NULL;

-- Fase 1.3: Limpiar espacios en nombres
UPDATE fighter_profiles SET first_name = TRIM(first_name) WHERE first_name != TRIM(first_name);
UPDATE fighter_profiles SET last_name = TRIM(last_name) WHERE last_name != TRIM(last_name);

-- Fase 1.4: Migrar Willis Yang de MuayThai → MMA
UPDATE fighter_profiles 
SET discipline = 'MMA', 
    martial_arts = ARRAY['MuayThai', 'MMA']
WHERE id = 'b9701ce3-909b-41a7-ae7a-9a0217cf6846';

-- Fase 2: Agregar BDG Pro Boxing como organización oficial
INSERT INTO partners (nombre, tipo, descripcion, orden, activo)
VALUES (
  'BDG Pro Boxing',
  'Organización',
  'Organización oficial de boxeo profesional en Honduras',
  2,
  true
)
ON CONFLICT DO NOTHING;
