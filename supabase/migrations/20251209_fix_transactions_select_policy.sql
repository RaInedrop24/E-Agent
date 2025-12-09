-- Fix 3: Optimize transactions SELECT policy to avoid recursion and RLS overhead
-- Direct use of the SECURITY DEFINER function avoids cascading RLS checks
DROP POLICY IF EXISTS "Users can view transactions they participate in" ON public.transactions;

CREATE POLICY "Users can view transactions they participate in"
  ON public.transactions FOR SELECT
  USING (
    id IN (
      SELECT transaction_id
      FROM public.get_user_transaction_ids(auth.uid())
    )
  );

