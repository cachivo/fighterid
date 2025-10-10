-- Create RPC function to get post comments with author information
-- This bypasses RLS on app_user while only exposing public profile fields
CREATE OR REPLACE FUNCTION public.get_post_comments_with_author(p_post_id uuid)
RETURNS TABLE (
  id uuid,
  post_id uuid,
  user_id uuid,
  content text,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text,
  author_handle text,
  author_avatar text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pc.id,
    pc.post_id,
    pc.user_id,
    pc.content,
    pc.active,
    pc.created_at,
    pc.updated_at,
    -- Build author name: first+last name, or handle, or email prefix, or fallback to 'Usuario'
    COALESCE(
      NULLIF(TRIM(CONCAT(au.first_name, ' ', au.last_name)), ''),
      au.handle,
      SPLIT_PART(au.email, '@', 1),
      'Usuario'
    ) as author_name,
    au.handle as author_handle,
    au.avatar_url as author_avatar
  FROM post_comments pc
  JOIN app_user au ON au.id = pc.user_id
  WHERE pc.post_id = p_post_id
    AND pc.active = true
  ORDER BY pc.created_at ASC;
$$;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_post_comments_with_author(uuid) TO anon, authenticated;