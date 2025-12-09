-- Re‑apply the fix with corrected search_path in the function definition
-- This ensures the function is fully secured

-- First drop the policy that depends on the function
DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;

-- Then drop the function (no dependency remains)
DROP FUNCTION IF EXISTS public.current_user_is_agent();

-- Re‑create the helper function
CREATE OR REPLACE FUNCTION public.current_user_is_agent()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'agent'
  );
$$;

-- Grant execute permission to both authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.current_user_is_agent() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_agent() TO anon;

-- Re‑create the INSERT policy using the function and the correct role
CREATE POLICY "Agents can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_agent());

COMMENT ON FUNCTION public.current_user_is_agent()
IS 'Returns true if current user has role=agent. Uses SECURITY DEFINER to bypass RLS and prevent recursion.';
