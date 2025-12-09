-- Fix 4: Allow creators to view their transactions directly
-- This is critical because INSERT ... RETURNING checks visibility BEFORE the AFTER INSERT trigger
-- adds the creator to transaction_participants. Without this, the creator cannot see the row
-- they just inserted during the return phase, causing an RLS violation.

DROP POLICY IF EXISTS "Users can view transactions they participate in" ON public.transactions;

CREATE POLICY "Users can view transactions they participate in"
  ON public.transactions FOR SELECT
  USING (
    created_by = auth.uid() -- Allow creator to see immediately
    OR
    id IN (
      SELECT transaction_id
      FROM public.get_user_transaction_ids(auth.uid())
    )
  );

