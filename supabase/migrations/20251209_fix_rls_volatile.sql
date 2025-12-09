-- Fix 1: Make helper function VOLATILE to see trigger-inserted rows immediately
-- This fixes the "new row violates row-level security policy" error during INSERT ... RETURNING
-- caused by the SELECT policy using a STABLE function that couldn't see the trigger's changes.
CREATE OR REPLACE FUNCTION public.get_user_transaction_ids(user_id uuid)
RETURNS TABLE(transaction_id uuid)
LANGUAGE sql
SECURITY DEFINER
VOLATILE -- Changed from STABLE
SET search_path TO 'public'
AS $function$
  SELECT transaction_id
  FROM public.transaction_participants
  WHERE profile_id = user_id;
$function$;

-- Fix 2: Restore proper INSERT policy (reverting debug 'true' policy)
DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;

CREATE POLICY "Agents can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'agent'
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'agent'
  );

