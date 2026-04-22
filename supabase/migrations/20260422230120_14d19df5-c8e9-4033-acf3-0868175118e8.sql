UPDATE ranking_organizations
SET 
  name = 'Federación Hondureña de Boxeo Amateur',
  description = 'Liga Nacional Olímpica oficial de Honduras — niveles Olímpico, Profesional y Semi-profesional'
WHERE code = 'FEDEHBOX';

UPDATE ranking_organizations
SET 
  name = 'Honduras Hood Fights',
  short_name = 'HHF',
  description = 'Minor League — boxeo amateur de barrio'
WHERE code = 'HHF_AMATEUR';

UPDATE ranking_organizations
SET 
  description = 'Ranking oficial de MMA en Honduras (disciplina independiente)'
WHERE code = 'UCC_MMA';