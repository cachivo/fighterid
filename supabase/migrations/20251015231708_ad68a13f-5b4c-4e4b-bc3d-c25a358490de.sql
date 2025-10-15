-- Crear bucket para documentos de identidad (PRIVADO)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity_documents', 
  'identity_documents', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Los usuarios solo pueden subir sus propios documentos
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los usuarios solo pueden ver sus propios documentos
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Admins pueden ver todos los documentos
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity_documents' AND
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Política: Los usuarios pueden actualizar sus propios documentos
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'identity_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los usuarios pueden eliminar sus propios documentos
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Agregar columna para almacenar la URL del documento de identidad
ALTER TABLE public.fighter_profiles
ADD COLUMN IF NOT EXISTS document_image_url TEXT;