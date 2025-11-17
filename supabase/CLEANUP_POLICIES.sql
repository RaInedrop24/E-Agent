-- ============================================================================
-- CLEANUP: Remove duplicate and old RLS policies from profiles table
-- ============================================================================
-- This removes the old policies from the initial schema migration
-- and keeps only the simplified policies from APPLY_THIS_FIX.sql
-- ============================================================================

-- Remove old/duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Remove old/duplicate UPDATE policies
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Verify we still have the correct policies
-- After running this, you should only have:
-- - "Authenticated users can view profiles" (SELECT, USING true)
-- - "Users can insert their own profile" (INSERT)
-- - "Users can update their own profile" (UPDATE)

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- Expected result after cleanup:
-- ============================================================================
-- | policyname                            | cmd    | using_clause      | with_check_clause |
-- |---------------------------------------|--------|-------------------|-------------------|
-- | Authenticated users can view profiles | SELECT | true              | null              |
-- | Users can insert their own profile    | INSERT | null              | (auth.uid() = id) |
-- | Users can update their own profile    | UPDATE | (auth.uid() = id) | null              |
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅  CLEANUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Removed duplicate policies:';
  RAISE NOTICE '   - Users can view their own profile (old SELECT)';
  RAISE NOTICE '   - profiles_select_own (old SELECT)';
  RAISE NOTICE '   - profiles_update_own (old UPDATE)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Remaining policies:';
  RAISE NOTICE '   - Authenticated users can view profiles (SELECT)';
  RAISE NOTICE '   - Users can insert their own profile (INSERT)';
  RAISE NOTICE '   - Users can update their own profile (UPDATE)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Next: Test login at http://localhost:3001/login';
  RAISE NOTICE '';
END $$;
