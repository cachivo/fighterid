-- Create social-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media',
  'social-media',
  true,
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- Storage policies for social-media bucket
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'social-media');

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add media_files column to social_posts
ALTER TABLE public.social_posts
ADD COLUMN IF NOT EXISTS media_files JSONB DEFAULT '[]'::jsonb;

-- Create post_media table for file metadata
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size INTEGER,
  mime_type TEXT,
  thumbnail_path TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- for videos, in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on post_media
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_media
CREATE POLICY "Anyone can view media metadata"
ON public.post_media FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.social_posts
    WHERE id = post_media.post_id AND active = true
  )
);

CREATE POLICY "Post authors can insert media metadata"
ON public.post_media FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.social_posts sp
    WHERE sp.id = post_media.post_id
    AND (
      (sp.author_type = 'user' AND sp.author_id IN (
        SELECT au.id FROM app_user au WHERE au.auth_user_id = auth.uid()
      ))
      OR (sp.author_type = 'fighter' AND sp.author_id::text IN (
        SELECT fp.id::text FROM fighter_profiles fp
        JOIN app_user au ON au.id = fp.user_id
        WHERE au.auth_user_id = auth.uid()
      ))
      OR (sp.author_type = 'admin' AND EXISTS (
        SELECT 1 FROM app_user au
        WHERE au.auth_user_id = auth.uid() AND au.is_admin = true
      ))
    )
  )
);

CREATE POLICY "Post authors can delete their media metadata"
ON public.post_media FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.social_posts sp
    WHERE sp.id = post_media.post_id
    AND (
      (sp.author_type = 'user' AND sp.author_id IN (
        SELECT au.id FROM app_user au WHERE au.auth_user_id = auth.uid()
      ))
      OR (sp.author_type = 'fighter' AND sp.author_id::text IN (
        SELECT fp.id::text FROM fighter_profiles fp
        JOIN app_user au ON au.id = fp.user_id
        WHERE au.auth_user_id = auth.uid()
      ))
      OR (sp.author_type = 'admin' AND EXISTS (
        SELECT 1 FROM app_user au
        WHERE au.auth_user_id = auth.uid() AND au.is_admin = true
      ))
    )
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_file_type ON public.post_media(file_type);