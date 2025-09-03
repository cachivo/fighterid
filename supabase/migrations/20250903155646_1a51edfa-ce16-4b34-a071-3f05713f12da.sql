-- Create storage buckets for license documents
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('license-documents', 'license-documents', false),
  ('fighter-photos', 'fighter-photos', true);

-- Add storage policies for license documents (private - admin only)
CREATE POLICY "Admins can manage license documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'license-documents' AND is_admin())
WITH CHECK (bucket_id = 'license-documents' AND is_admin());

CREATE POLICY "License owners can upload their documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'license-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "License owners can view their documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'license-documents' 
  AND (
    is_admin() 
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Add storage policies for fighter photos (public)
CREATE POLICY "Fighter photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fighter-photos');

CREATE POLICY "Users can upload their own fighter photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'fighter-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own fighter photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'fighter-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create license documents table to track uploads
CREATE TABLE IF NOT EXISTS public.license_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.fighter_licenses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('identity', 'medical', 'photo', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on license documents
ALTER TABLE public.license_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for license documents
CREATE POLICY "Admins can manage all license documents" 
ON public.license_documents 
FOR ALL 
USING (is_admin());

CREATE POLICY "License owners can view their documents" 
ON public.license_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM fighter_licenses fl
    JOIN fighter_profiles fp ON fp.id = fl.fighter_id
    JOIN app_user au ON au.id = fp.user_id
    WHERE fl.id = license_documents.license_id 
    AND au.auth_user_id = auth.uid()
  )
);

CREATE POLICY "License owners can insert their documents" 
ON public.license_documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM fighter_licenses fl
    JOIN fighter_profiles fp ON fp.id = fl.fighter_id
    JOIN app_user au ON au.id = fp.user_id
    WHERE fl.id = license_documents.license_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Add phone field to app_user if not exists
ALTER TABLE public.app_user 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Create trigger for updated_at on license_documents
CREATE TRIGGER update_license_documents_updated_at
BEFORE UPDATE ON public.license_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();