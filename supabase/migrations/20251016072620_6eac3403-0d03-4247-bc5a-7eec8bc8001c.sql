-- Create event-fighter-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-fighter-images',
  'event-fighter-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view event fighter images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-fighter-images');

-- Allow authenticated users to upload/update/delete
CREATE POLICY "Authenticated users can upload event fighter images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-fighter-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update event fighter images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-fighter-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete event fighter images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-fighter-images' 
  AND auth.role() = 'authenticated'
);