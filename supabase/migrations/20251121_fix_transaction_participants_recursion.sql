-- Fix "Infinite recursion" in transaction_participants SELECT policy
-- The original policy queries transaction_participants within itself, causing infinite recursion

DROP POLICY IF EXISTS "Users can view participants of their transactions" ON public.transaction_participants;

-- Create a SECURITY DEFINER function to get user's transaction IDs
-- This bypasses RLS and breaks the recursion cycle
CREATE OR REPLACE FUNCTION public.get_user_transaction_ids(user_id uuid)
RETURNS TABLE(transaction_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT transaction_id
  FROM public.transaction_participants
  WHERE profile_id = user_id;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_transaction_ids(uuid) TO authenticated;

-- Create new policy using the SECURITY DEFINER function
CREATE POLICY "Users can view participants of their transactions"
  ON public.transaction_participants FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id FROM public.get_user_transaction_ids((select auth.uid()))
    )
  );

COMMENT ON FUNCTION public.get_user_transaction_ids(uuid)
IS 'Returns transaction IDs for a given user. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

COMMENT ON POLICY "Users can view participants of their transactions" ON public.transaction_participants
IS 'Users can see all participants in transactions they participate in (uses SECURITY_DEFINER function to avoid recursion)';
