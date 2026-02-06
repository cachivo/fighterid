-- Storage policies for fighter-photos bucket
-- Allow admins to upload photos to any folder
CREATE POLICY "Admins can upload any fighter photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to update any fighter photo
CREATE POLICY "Admins can update any fighter photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to delete any fighter photo
CREATE POLICY "Admins can delete any fighter photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own fighter photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fighter-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own photos
CREATE POLICY "Users can update own fighter photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fighter-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own fighter photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fighter-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for all fighter photos
CREATE POLICY "Public read access for fighter photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fighter-photos');