-- Update create_profile_for_current_user function to include website_url
CREATE OR REPLACE FUNCTION public.create_profile_for_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  user_email text;
  user_meta json;
  new_profile json;
BEGIN
  -- Get current user ID
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Return existing profile
    SELECT row_to_json(p.*) INTO new_profile
    FROM public.profiles p
    WHERE p.id = user_id;

    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'profile', new_profile
    );
  END IF;

  -- Get user metadata from auth.users
  SELECT
    email,
    raw_user_meta_data
  INTO user_email, user_meta
  FROM auth.users
  WHERE id = user_id;

  -- Insert profile with website_url from metadata
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    preferred_language,
    website_url
  ) VALUES (
    user_id,
    COALESCE(user_meta->>'full_name', split_part(user_email, '@', 1)),
    COALESCE(user_meta->>'role', 'buyer'),
    COALESCE(user_meta->>'preferred_language', 'en'),
    user_meta->>'website_url'
  )
  RETURNING row_to_json(profiles.*) INTO new_profile;

  RETURN json_build_object(
    'success', true,
    'message', 'Profile created successfully',
    'profile', new_profile
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

COMMENT ON FUNCTION public.create_profile_for_current_user()
IS 'Creates a profile for the current authenticated user if one does not exist. Includes website_url from user metadata. Uses SECURITY DEFINER to bypass RLS.';

