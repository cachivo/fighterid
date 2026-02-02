-- Normalize stance values to Spanish
UPDATE fighter_profiles SET stance = 'Ortodoxo' WHERE stance = 'Orthodox';
UPDATE fighter_profiles SET stance = 'Zurdo' WHERE stance = 'Southpaw';
-- 'Switch' remains the same