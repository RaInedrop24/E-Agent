-- Simplify transactions INSERT policy to debug RLS issue
-- Removes reliance on the helper function to rule it out as the cause

DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;

CREATE POLICY "Agents can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'agent'
  );

