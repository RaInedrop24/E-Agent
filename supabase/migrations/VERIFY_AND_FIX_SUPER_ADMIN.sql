-- ============================================================================
-- SUPER ADMIN VERIFICATION AND FIX SCRIPT
-- ============================================================================
-- This script will:
-- 1. Check if the is_super_admin column exists
-- 2. Check if the RPC functions exist
-- 3. Create them if they don't exist
-- 4. Verify the super admin user is set correctly
-- 5. Test that everything works
-- ============================================================================

-- Step 1: Add is_super_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_super_admin boolean DEFAULT false;
    RAISE NOTICE 'Added is_super_admin column to profiles table';
  ELSE
    RAISE NOTICE 'is_super_admin column already exists';
  END IF;
END $$;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin 
ON public.profiles(is_super_admin)
WHERE is_super_admin = true;

-- Step 3: Add comment
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Whether user has super admin privileges for accessing all data and admin tools';

-- Step 4: Create the frontend RPC function (current_user_is_super_admin)
CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.current_user_is_super_admin IS 'Returns true if the current authenticated user is a super admin';

-- Step 5: Create the RLS-safe function (auth_user_is_super_admin)
CREATE OR REPLACE FUNCTION public.auth_user_is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Temporarily disable RLS for this query to avoid infinite recursion
  PERFORM set_config('row_security', 'off', true);

  SELECT is_super_admin INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;

  -- Re-enable RLS
  PERFORM set_config('row_security', 'on', true);

  RETURN COALESCE(is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable RLS even on error
    PERFORM set_config('row_security', 'on', true);
    RETURN false;
END;
$$;

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.current_user_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_super_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.auth_user_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_is_super_admin() TO anon;

-- Step 7: Set the super admin user (CHANGE THE EMAIL!)
UPDATE public.profiles
SET is_super_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'superadmin@rainedrop.co.uk'
);

-- Step 8: Verify the setup
DO $$
DECLARE
  col_exists boolean;
  func1_exists boolean;
  func2_exists boolean;
  admin_count integer;
BEGIN
  -- Check column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_super_admin'
  ) INTO col_exists;

  -- Check functions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'current_user_is_super_admin'
  ) INTO func1_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'auth_user_is_super_admin'
  ) INTO func2_exists;

  -- Count super admins
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE is_super_admin = true;

  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Column exists: %', col_exists;
  RAISE NOTICE 'Frontend function exists: %', func1_exists;
  RAISE NOTICE 'RLS function exists: %', func2_exists;
  RAISE NOTICE 'Super admin count: %', admin_count;
  RAISE NOTICE '========================================';

  IF col_exists AND func1_exists AND func2_exists AND admin_count > 0 THEN
    RAISE NOTICE 'SUCCESS: All components are in place!';
  ELSE
    RAISE WARNING 'INCOMPLETE: Some components are missing!';
  END IF;
END $$;

-- Step 9: Show super admin users
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.is_super_admin,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_super_admin = true;

-- Step 10: Test the RPC function (will only work if you run this as the super admin user)
-- SELECT public.current_user_is_super_admin() as am_i_super_admin;

