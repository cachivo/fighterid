
-- Create the fighter-update-images bucket (public for viewing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fighter-update-images', 'fighter-update-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Fighter update images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'fighter-update-images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload fighter update images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fighter-update-images'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own uploads
CREATE POLICY "Users can delete their own fighter update images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fighter-update-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
