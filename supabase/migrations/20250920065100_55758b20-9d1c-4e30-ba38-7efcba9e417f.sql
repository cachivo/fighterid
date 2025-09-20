-- Make license-documents bucket public so images can be viewed directly
UPDATE storage.buckets 
SET public = true 
WHERE id = 'license-documents';