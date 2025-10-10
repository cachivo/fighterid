-- Update RPC to prioritize fighter profile info over app_user info
DROP FUNCTION IF EXISTS public.get_post_comments_with_author(uuid);

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
    -- Prioritize fighter profile name, then app_user name, then handle, then email prefix
    COALESCE(
      -- Try fighter profile name first
      NULLIF(TRIM(CONCAT(fp.first_name, ' ', fp.last_name)), ''),
      -- Then app_user name
      NULLIF(TRIM(CONCAT(au.first_name, ' ', au.last_name)), ''),
      -- Then handle
      au.handle,
      -- Then email prefix
      SPLIT_PART(au.email, '@', 1),
      -- Finally fallback
      'Usuario'
    ) as author_name,
    au.handle as author_handle,
    -- Prioritize fighter profile avatar over app_user avatar
    COALESCE(fp.avatar_url, au.avatar_url) as author_avatar
  FROM post_comments pc
  JOIN app_user au ON au.id = pc.user_id
  LEFT JOIN fighter_profiles fp ON fp.user_id = au.id AND fp.active = true
  WHERE pc.post_id = p_post_id
    AND pc.active = true
  ORDER BY pc.created_at ASC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_post_comments_with_author(uuid) TO anon, authenticated;