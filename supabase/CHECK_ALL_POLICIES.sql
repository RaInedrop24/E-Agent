-- Check all RLS policies that might affect profile fetching

-- 1. Check profiles table policies
SELECT 'PROFILES TABLE' as table_name, policyname, cmd, qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 2. Check transaction_participants policies (might reference profiles)
SELECT 'TRANSACTION_PARTICIPANTS TABLE' as table_name, policyname, cmd, qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'transaction_participants'
ORDER BY policyname;

-- 3. Check if RLS is enabled on profiles
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';
