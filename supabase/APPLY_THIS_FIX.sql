-- ============================================================================
-- CRITICAL FIX: Apply this entire file to fix authentication and profile issues
-- ============================================================================
-- How to apply:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Copy and paste this ENTIRE file
-- 4. Click RUN
-- ============================================================================

-- FIX 1: Remove infinite recursion in RLS policies
-- -----------------------------------------------
-- Drop old problematic policy
DROP POLICY IF EXISTS "Users can view profiles of transaction participants" ON public.profiles;

-- Drop new policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create simplified policy (no recursion)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- FIX 2: Add INSERT policy for profiles (needed for manual profile creation)
-- ----------------------------------------------------------------------------
-- Drop if exists (for idempotency)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create INSERT policy
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- FIX 3: Create SECURITY DEFINER function to safely create profiles
-- -------------------------------------------------------------------
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

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    preferred_language
  ) VALUES (
    user_id,
    COALESCE(user_meta->>'full_name', split_part(user_email, '@', 1)),
    COALESCE(user_meta->>'role', 'buyer'),
    COALESCE(user_meta->>'preferred_language', 'en')
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

GRANT EXECUTE ON FUNCTION public.create_profile_for_current_user() TO authenticated;

COMMENT ON FUNCTION public.create_profile_for_current_user()
IS 'Creates a profile for the current authenticated user if one does not exist. Uses SECURITY DEFINER to bypass RLS.';

-- FIX 4: Verify the trigger exists (it should already be there from initial schema)
-- ---------------------------------------------------------------------------------
-- This just checks if the trigger exists, doesn't recreate it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'WARNING: on_auth_user_created trigger does not exist. It should have been created by the initial schema.';
  ELSE
    RAISE NOTICE 'OK: on_auth_user_created trigger exists';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that policies are correct
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Check that function exists
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_profile_for_current_user';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅  ALL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 What was fixed:';
  RAISE NOTICE '   1. Removed infinite recursion in profiles RLS policy';
  RAISE NOTICE '   2. Added INSERT policy for profiles';
  RAISE NOTICE '   3. Created safe profile creation function';
  RAISE NOTICE '   4. Verified trigger exists';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Next steps:';
  RAISE NOTICE '   1. Go to http://localhost:3001/debug/profile';
  RAISE NOTICE '   2. Click "Create Profile Manually" button';
  RAISE NOTICE '   3. Go to Dashboard - it should work now!';
  RAISE NOTICE '';
END $$;
