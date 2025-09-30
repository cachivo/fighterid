-- Add RLS policies for regular users to create posts
-- This allows any authenticated user (not just fighters or admins) to create posts

-- Add RLS policy for users to create their own posts
CREATE POLICY "Users can create their own posts"
ON public.social_posts
FOR INSERT
WITH CHECK (
  (author_type = 'user') AND 
  (EXISTS (
    SELECT 1 FROM app_user au 
    WHERE au.id = social_posts.author_id::uuid
    AND au.auth_user_id = auth.uid()
  ))
);

-- Add RLS policy for users to update their own posts
CREATE POLICY "Users can update their own posts"
ON public.social_posts
FOR UPDATE
USING (
  (author_type = 'user') AND 
  (EXISTS (
    SELECT 1 FROM app_user au 
    WHERE au.id = social_posts.author_id::uuid
    AND au.auth_user_id = auth.uid()
  ))
);