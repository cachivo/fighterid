-- Create social posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('fighter', 'admin')),
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'news')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_posts
CREATE POLICY "Anyone can view active posts" ON public.social_posts
  FOR SELECT USING (active = true);

CREATE POLICY "Fighters can create their own posts" ON public.social_posts
  FOR INSERT WITH CHECK (
    author_type = 'fighter' AND 
    EXISTS (
      SELECT 1 FROM public.fighter_profiles fp
      JOIN public.app_user au ON au.id = fp.user_id
      WHERE fp.id::text = author_id::text AND au.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create any posts" ON public.social_posts
  FOR INSERT WITH CHECK (
    author_type = 'admin' AND is_admin()
  );

CREATE POLICY "Authors can update their own posts" ON public.social_posts
  FOR UPDATE USING (
    (author_type = 'fighter' AND 
     EXISTS (
       SELECT 1 FROM public.fighter_profiles fp
       JOIN public.app_user au ON au.id = fp.user_id
       WHERE fp.id::text = author_id::text AND au.auth_user_id = auth.uid()
     )) OR
    (author_type = 'admin' AND is_admin())
  );

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own likes" ON public.post_likes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view active comments" ON public.post_comments
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can create comments" ON public.post_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments" ON public.post_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.app_user au
      WHERE au.auth_user_id = auth.uid()
    )
  );

-- Triggers to update post counts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.active = false AND OLD.active = true) THEN
    UPDATE public.social_posts 
    SET comments_count = comments_count - 1 
    WHERE id = COALESCE(OLD.post_id, NEW.post_id);
    RETURN COALESCE(OLD, NEW);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE OR UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Update timestamps trigger
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at  
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();