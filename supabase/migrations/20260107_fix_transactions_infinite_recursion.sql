-- Fix: Infinite Recursion in Transactions RLS Policies
-- Issue: Old/conflicting policies may be causing circular dependencies
-- Solution: Clean slate - drop all transaction policies and recreate

-- ============================================================
-- CLEAN UP: Drop ALL existing transaction policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view transactions they participate in" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions they participate in or super admin" ON public.transactions;
DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Transaction creators can update their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Agents can update their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can update transactions" ON public.transactions;

-- ============================================================
-- RECREATE: Clean, non-recursive policies
-- ============================================================

-- 1. INSERT: Agents can create transactions
CREATE POLICY "Agents can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check role from profiles table (NO recursion - different table)
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'agent'
  );

-- 2. SELECT: Users can view transactions they participate in
CREATE POLICY "Users can view transactions they participate in"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    -- Super admin can see all
    auth_user_is_super_admin() = true
    OR
    -- Regular users see transactions where they are participants
    id IN (
      SELECT transaction_id 
      FROM public.transaction_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- 3. UPDATE: Transaction creators can update their transactions
CREATE POLICY "Transaction creators can update their transactions"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (
    -- Only the creator can update (NO recursion - simple column check)
    created_by = auth.uid()
  );

-- 4. DELETE: Transaction creators can delete their transactions (if needed)
DROP POLICY IF EXISTS "Transaction creators can delete their transactions" ON public.transactions;
CREATE POLICY "Transaction creators can delete their transactions"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING (
    -- Only the creator can delete
    created_by = auth.uid()
  );

-- ============================================================
-- VERIFY: No circular dependencies
-- ============================================================
-- INSERT policy checks: profiles table (✓ no recursion)
-- SELECT policy checks: transaction_participants table + function (✓ no recursion)
-- UPDATE policy checks: created_by column only (✓ no recursion)
-- DELETE policy checks: created_by column only (✓ no recursion)

