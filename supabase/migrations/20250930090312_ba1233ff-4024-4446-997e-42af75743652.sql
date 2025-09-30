-- Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their own friend requests"
ON public.friend_requests FOR SELECT
TO authenticated
USING (
  sender_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
TO authenticated
WITH CHECK (
  sender_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can update their received requests"
ON public.friend_requests FOR UPDATE
TO authenticated
USING (
  receiver_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
);

-- RLS Policies for friendships
CREATE POLICY "Users can view friendships"
ON public.friendships FOR SELECT
TO authenticated
USING (
  user_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
  OR friend_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
);

CREATE POLICY "System can insert friendships"
ON public.friendships FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE
TO authenticated
USING (
  user_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
  OR friend_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
);

-- RLS Policies for user_follows
CREATE POLICY "Anyone can view follows"
ON public.user_follows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
TO authenticated
WITH CHECK (
  follower_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
TO authenticated
USING (
  follower_id IN (SELECT id FROM app_user WHERE auth_user_id = auth.uid())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Function to create mutual friendship
CREATE OR REPLACE FUNCTION public.create_friendship(p_user1_id UUID, p_user2_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (p_user1_id, p_user2_id), (p_user2_id, p_user1_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Trigger to create friendship when request is accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    PERFORM public.create_friendship(NEW.sender_id, NEW.receiver_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_request_accepted
AFTER UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_friend_request_accepted();