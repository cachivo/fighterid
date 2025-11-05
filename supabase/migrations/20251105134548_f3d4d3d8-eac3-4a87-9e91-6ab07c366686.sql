-- Create email-assets storage bucket for email campaign images and attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Admins can upload email assets
CREATE POLICY "Admins can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Anyone can view email assets (public bucket)
CREATE POLICY "Anyone can view email assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');

-- Policy: Admins can delete email assets
CREATE POLICY "Admins can delete email assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);