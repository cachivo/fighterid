-- Update RPC to include fighter nickname, record_type, and discipline
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
  author_nickname text,
  author_avatar text,
  author_record_type text,
  author_discipline text
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
    -- Author full name
    COALESCE(
      NULLIF(TRIM(CONCAT(fp.first_name, ' ', fp.last_name)), ''),
      NULLIF(TRIM(CONCAT(au.first_name, ' ', au.last_name)), ''),
      au.handle,
      SPLIT_PART(au.email, '@', 1),
      'Usuario'
    ) as author_name,
    -- Author nickname (prioritize fighter nickname over handle)
    COALESCE(fp.nickname, au.handle) as author_nickname,
    -- Author avatar
    COALESCE(fp.avatar_url, au.avatar_url) as author_avatar,
    -- Fighter record type (AMATEUR/PROFESSIONAL)
    fp.record_type as author_record_type,
    -- Fighter discipline (MMA/BOXING/etc.)
    fp.discipline::text as author_discipline
  FROM post_comments pc
  JOIN app_user au ON au.id = pc.user_id
  LEFT JOIN fighter_profiles fp ON fp.user_id = au.id AND fp.active = true
  WHERE pc.post_id = p_post_id
    AND pc.active = true
  ORDER BY pc.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_comments_with_author(uuid) TO anon, authenticated;