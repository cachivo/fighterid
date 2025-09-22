-- Update the handle_new_user function to handle user type
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_type text;
BEGIN
  -- Get user type from metadata
  user_type := COALESCE(NEW.raw_user_meta_data ->> 'userType', 'user');
  
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
  
  -- If user is a fighter, create a basic fighter profile to trigger the license flow
  IF user_type = 'fighter' THEN
    INSERT INTO public.fighter_profiles (
      user_id,
      first_name,
      last_name,
      weight_class,
      created_at,
      updated_at
    )
    VALUES (
      (SELECT id FROM public.app_user WHERE auth_user_id = NEW.id),
      'Por completar',
      'Por completar', 
      'Por definir',
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;