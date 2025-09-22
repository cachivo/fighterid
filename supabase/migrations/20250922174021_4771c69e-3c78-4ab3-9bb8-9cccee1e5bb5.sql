-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into app_user table when a new auth user is created
  INSERT INTO public.app_user (
    auth_user_id,
    email,
    handle,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'handle', SPLIT_PART(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create app_user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for social_posts to ensure better access
DROP POLICY IF EXISTS "Anyone can view active posts" ON social_posts;
CREATE POLICY "Anyone can view active posts" ON social_posts
  FOR SELECT USING (active = true);

-- Ensure post_likes policies work correctly  
DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
CREATE POLICY "Authenticated users can like posts" ON post_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM app_user au 
      WHERE au.auth_user_id = auth.uid() AND au.id = user_id
    )
  );

DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;
CREATE POLICY "Users can delete their own likes" ON post_likes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM app_user au 
      WHERE au.auth_user_id = auth.uid() AND au.id = user_id
    )
  );

-- Ensure users can view likes properly
DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
CREATE POLICY "Anyone can view likes" ON post_likes
  FOR SELECT USING (true);