-- Apply approved profile changes for user Musa C
UPDATE public.fighter_profiles SET
  first_name = 'Moises',
  last_name = 'Cardenas', 
  document_type = 'DNI',
  document_number = 'wwwwwwwwww',
  birthdate = '2000-02-01'::date,
  blood_type = 'O+',
  emergency_contact_name = '11111111111',
  emergency_contact_phone = '11111111111111111',
  emergency_contact_relation = '1',
  fighting_style = 'Striker',
  gender = 'M',
  gym_name = '1',
  martial_arts = ARRAY['Boxeo', 'MMA'],
  medical_allergies = '1',
  medical_conditions = '1',
  reach_cm = 110,
  stance = 'Orthodox',
  bio = '1',
  updated_at = now()
WHERE id = '4f49c209-da57-4771-ad83-92fc4ea8bed0';