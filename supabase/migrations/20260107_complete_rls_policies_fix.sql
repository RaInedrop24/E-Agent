-- =============================================================================
-- Complete RLS Policy Fix - No Circular Dependencies
-- Date: January 7, 2026
-- Purpose: Implement all necessary policies without infinite recursion
-- Reference: docs/RLS_POLICIES_SOURCE_OF_TRUTH.md
-- =============================================================================

-- =============================================================================
-- PART 1: Create SECURITY DEFINER Helper Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- Bypasses RLS to prevent recursion
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- =============================================================================
-- PART 2: Drop ALL Existing Policies (Clean Slate)
-- =============================================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or super admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view their buyers and transaction participants" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view their buyers" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view their buyers profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile or via trigger" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Transactions
DROP POLICY IF EXISTS "Users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions they participate in" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions they participate in or super admin" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Transaction creators can update their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Transaction creators can delete their transactions" ON public.transactions;

-- =============================================================================
-- PART 3: Create Complete PROFILES Policies (4 policies)
-- =============================================================================

-- 1. SELECT: Users can view profiles
CREATE POLICY "Users can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    -- Own profile
    id = auth.uid()
    OR
    -- Super admin sees all
    public.is_super_admin()
    OR
    -- Agents see their buyers
    EXISTS (
      SELECT 1 
      FROM public.buyer_agent_associations 
      WHERE agent_id = auth.uid() 
      AND buyer_id = profiles.id
    )
  );

-- 2. INSERT: Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- 3. UPDATE: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid() 
    OR 
    public.is_super_admin()
  );

-- 4. DELETE: Not allowed (for data integrity)
-- No DELETE policy = no one can delete profiles

-- =============================================================================
-- PART 4: Create Complete TRANSACTIONS Policies (4 policies)
-- =============================================================================

-- 1. SELECT: Users can view transactions
CREATE POLICY "Users can view transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    -- Super admin sees all
    public.is_super_admin()
    OR
    -- Creator sees own transactions
    created_by = auth.uid()
    OR
    -- Participants see their transactions
    id IN (
      SELECT transaction_id 
      FROM public.transaction_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- 2. INSERT: Users can create transactions
CREATE POLICY "Users can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 3. UPDATE: Users can update own transactions
CREATE POLICY "Users can update own transactions"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR 
    public.is_super_admin()
  );

-- 4. DELETE: Users can delete own transactions
CREATE POLICY "Users can delete own transactions"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR 
    public.is_super_admin()
  );

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- List all policies for verification
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'transactions')
ORDER BY tablename, cmd, policyname;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- ✅ Created 1 helper function: is_super_admin()
-- ✅ Created 3 profiles policies (SELECT, INSERT, UPDATE)
-- ✅ Created 4 transactions policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Total: 7 policies across 2 tables
-- ✅ No circular dependencies
-- ✅ Super admin support via SECURITY DEFINER function
--
-- Expected output from verification query:
--   profiles    | INSERT | 1
--   profiles    | SELECT | 1  
--   profiles    | UPDATE | 1
--   transactions| DELETE | 1
--   transactions| INSERT | 1
--   transactions| SELECT | 1
--   transactions| UPDATE | 1
-- =============================================================================

