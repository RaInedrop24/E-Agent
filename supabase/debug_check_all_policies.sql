-- Check all active RLS policies on the transactions table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'transactions'
ORDER BY cmd, policyname;

-- This will show all policies and help identify conflicts
