-- Insert Team Lunaticos as a gym partner
INSERT INTO public.partners (nombre, tipo, descripcion, logo, orden, activo) 
VALUES (
  'Team Lunaticos', 
  'Gimnasio', 
  'Escuela de artes marciales mixtas especializada en formación de atletas de alto rendimiento con técnicas innovadoras de combate.',
  '/lovable-uploads/team-lunaticos-logo.png',
  1, 
  true
);

-- Insert UCC as an organization partner  
INSERT INTO public.partners (nombre, tipo, descripcion, logo, orden, activo)
VALUES (
  'Ultimate Combat Challenge (UCC)', 
  'Organización', 
  'Organización líder en competencias de artes marciales mixtas, promoviendo eventos profesionales de máximo nivel.',
  '/lovable-uploads/ucc-logo.png',
  2, 
  true
);