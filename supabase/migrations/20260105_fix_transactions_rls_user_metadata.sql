-- Fix security issue: Remove insecure user_metadata reference from RLS policy
-- user_metadata is editable by end users and should never be used in security context

-- Drop the insecure policy
DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;

-- Recreate the policy using ONLY the profiles table (secure)
CREATE POLICY "Agents can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- ✅ SECURE: Check role from profiles table (database-controlled)
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'agent'
  );

-- Add comment explaining the security model
COMMENT ON POLICY "Agents can create transactions" ON public.transactions IS 
  'Allows agents to create transactions. Uses profiles table (not user_metadata) for security.';

