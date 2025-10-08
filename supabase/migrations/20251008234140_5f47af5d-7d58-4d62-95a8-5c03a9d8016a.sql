-- Fix RLS policies for social_posts UPDATE to allow deleting posts

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authors can update their own posts" ON social_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON social_posts;

-- Create comprehensive UPDATE policies with WITH CHECK expressions

-- Policy for fighters to update their own posts
CREATE POLICY "Fighters can update their own posts"
ON social_posts
FOR UPDATE
USING (
  author_type = 'fighter' 
  AND EXISTS (
    SELECT 1 FROM fighter_profiles fp
    JOIN app_user au ON au.id = fp.user_id
    WHERE fp.id::text = social_posts.author_id::text
    AND au.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  author_type = 'fighter' 
  AND EXISTS (
    SELECT 1 FROM fighter_profiles fp
    JOIN app_user au ON au.id = fp.user_id
    WHERE fp.id::text = social_posts.author_id::text
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy for regular users to update their own posts
CREATE POLICY "Regular users can update their own posts"
ON social_posts
FOR UPDATE
USING (
  author_type = 'user' 
  AND EXISTS (
    SELECT 1 FROM app_user au
    WHERE au.id = social_posts.author_id
    AND au.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  author_type = 'user' 
  AND EXISTS (
    SELECT 1 FROM app_user au
    WHERE au.id = social_posts.author_id
    AND au.auth_user_id = auth.uid()
  )
);

-- Policy for admins to update any admin posts
CREATE POLICY "Admins can update admin posts"
ON social_posts
FOR UPDATE
USING (
  author_type = 'admin' 
  AND is_admin()
)
WITH CHECK (
  author_type = 'admin' 
  AND is_admin()
);