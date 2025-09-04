-- Create RLS policies for partner logo uploads in fighter-photos bucket

-- Allow authenticated users to upload partner logos
CREATE POLICY "Authenticated users can upload partner logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'fighter-photos' 
  AND auth.uid() IS NOT NULL 
  AND name LIKE 'partners/%'
);

-- Allow authenticated users to update partner logos
CREATE POLICY "Authenticated users can update partner logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'fighter-photos' 
  AND auth.uid() IS NOT NULL 
  AND name LIKE 'partners/%'
);

-- Allow authenticated users to delete partner logos
CREATE POLICY "Authenticated users can delete partner logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'fighter-photos' 
  AND auth.uid() IS NOT NULL 
  AND name LIKE 'partners/%'
);