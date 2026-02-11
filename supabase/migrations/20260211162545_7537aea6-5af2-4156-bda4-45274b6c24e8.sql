
-- Seed combat sports disciplines
INSERT INTO public.disciplines (name, slug, active) VALUES
  ('MMA', 'mma', true),
  ('Muay Thai', 'muay-thai', true),
  ('Brazilian Jiu-Jitsu', 'bjj', true),
  ('Kickboxing', 'kickboxing', true),
  ('Wrestling', 'wrestling', true),
  ('Judo', 'judo', true),
  ('Karate', 'karate', true),
  ('Taekwondo', 'taekwondo', true)
ON CONFLICT (slug) DO NOTHING;

-- Deactivate non-combat disciplines
UPDATE public.disciplines SET active = false WHERE slug IN ('singing', 'dance');
