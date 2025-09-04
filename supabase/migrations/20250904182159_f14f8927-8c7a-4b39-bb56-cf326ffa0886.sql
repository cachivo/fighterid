-- Crear el tipo discipline_type que está faltando
CREATE TYPE discipline_type AS ENUM (
  'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
);

-- Corregir las políticas de Storage para fighter-photos
-- Primero eliminamos las políticas existentes que pueden estar causando conflictos
DROP POLICY IF EXISTS "Users can upload fighter photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view fighter photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update fighter photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete fighter photos" ON storage.objects;

-- Crear políticas correctas para el bucket fighter-photos
CREATE POLICY "Anyone can view fighter photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fighter-photos');

CREATE POLICY "Authenticated users can upload fighter photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fighter-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update fighter photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'fighter-photos' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'fighter-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete fighter photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'fighter-photos' AND auth.role() = 'authenticated');