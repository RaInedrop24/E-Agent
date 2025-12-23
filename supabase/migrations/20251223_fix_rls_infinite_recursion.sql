-- Fix infinite recursion in RLS policies by creating a function that bypasses RLS

-- Create a function to check super admin status that bypasses RLS
-- This uses plpgsql to disable row security before querying
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
  -- This is safe because the function is SECURITY DEFINER and we're only
  -- checking the current user's own super admin status
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.auth_user_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_is_super_admin() TO anon;

-- Update profiles policy to use the function (which won't cause recursion)
DROP POLICY IF EXISTS "Users can view their own profile or super admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile or super admin can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can see their own profile
  id = auth.uid()
  OR
  -- Super admin can see all profiles (using function that bypasses RLS)
  auth_user_is_super_admin() = true
);

-- Update other policies to use the new function instead of subqueries

-- Transactions: Use function to check super admin
DROP POLICY IF EXISTS "Users can view transactions they participate in or super admin" ON public.transactions;
CREATE POLICY "Users can view transactions they participate in or super admin"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all (using function that bypasses RLS)
  auth_user_is_super_admin() = true
  OR
  -- Creator can see
  created_by = auth.uid()
  OR
  -- Participants can see
  EXISTS (
    SELECT 1 FROM public.transaction_participants
    WHERE transaction_participants.transaction_id = transactions.id
    AND transaction_participants.profile_id = auth.uid()
  )
);

-- Milestones: Use function
DROP POLICY IF EXISTS "Users can view milestones for their transactions or super admin" ON public.milestones;
CREATE POLICY "Users can view milestones for their transactions or super admin"
ON public.milestones
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  auth_user_is_super_admin() = true
  OR
  -- Check if user is transaction creator or participant
  EXISTS (
    SELECT 1 FROM public.transactions t
    LEFT JOIN public.transaction_participants tp ON tp.transaction_id = t.id
    WHERE t.id = milestones.transaction_id
    AND (t.created_by = auth.uid() OR tp.profile_id = auth.uid())
  )
);

-- Messages: Use function
DROP POLICY IF EXISTS "Users can view messages in their transactions or super admin" ON public.messages;
CREATE POLICY "Users can view messages in their transactions or super admin"
ON public.messages
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  auth_user_is_super_admin() = true
  OR
  -- Check if user is transaction creator or participant
  EXISTS (
    SELECT 1 FROM public.transactions t
    LEFT JOIN public.transaction_participants tp ON tp.transaction_id = t.id
    WHERE t.id = messages.transaction_id
    AND (t.created_by = auth.uid() OR tp.profile_id = auth.uid())
  )
);

-- Files: Use function
DROP POLICY IF EXISTS "Users can view files in their transactions or super admin" ON public.files;
CREATE POLICY "Users can view files in their transactions or super admin"
ON public.files
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  auth_user_is_super_admin() = true
  OR
  -- Check if user is transaction creator or participant
  EXISTS (
    SELECT 1 FROM public.transactions t
    LEFT JOIN public.transaction_participants tp ON tp.transaction_id = t.id
    WHERE t.id = files.transaction_id
    AND (t.created_by = auth.uid() OR tp.profile_id = auth.uid())
  )
);
