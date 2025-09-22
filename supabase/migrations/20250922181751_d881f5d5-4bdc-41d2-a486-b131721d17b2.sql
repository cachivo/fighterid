-- Force update any licenses that might be stuck in cache
UPDATE fighter_profiles 
SET updated_at = now() 
WHERE user_id = (
  SELECT id FROM app_user WHERE auth_user_id = '22d7a05b-4c20-42e5-bc70-65bffccac7c0'
);