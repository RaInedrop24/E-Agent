-- Performance Optimization: Consolidate Multiple Permissive Policies
-- Multiple permissive policies on the same table for the same action cause
-- each policy to be evaluated, which is suboptimal for performance
-- This migration combines them into single policies with OR conditions

-- ============================================================
-- BUYER_AGENT_ASSOCIATIONS TABLE
-- ============================================================

-- Drop the two separate SELECT policies
DROP POLICY IF EXISTS "Agents can view their buyer associations" ON public.buyer_agent_associations;
DROP POLICY IF EXISTS "Buyers can view their agent association" ON public.buyer_agent_associations;

-- Create consolidated policy
CREATE POLICY "Users can view buyer-agent associations"
  ON public.buyer_agent_associations
  FOR SELECT
  USING (
    agent_id = (select auth.uid())  -- Agents can view their associations
    OR
    buyer_id = (select auth.uid())  -- Buyers can view their association
  );

COMMENT ON POLICY "Users can view buyer-agent associations" ON public.buyer_agent_associations IS
  'Consolidated policy: Agents can view their buyer associations, buyers can view their agent association';

-- ============================================================
-- MILESTONES TABLE
-- ============================================================

-- Drop the two separate SELECT policies
DROP POLICY IF EXISTS "Users can view milestones for their transactions or super admin" ON public.milestones;
DROP POLICY IF EXISTS "Users can view milestones of their transactions" ON public.milestones;

-- Create consolidated policy (the super admin version already covers both cases)
CREATE POLICY "Users can view milestones for their transactions"
  ON public.milestones
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id 
      FROM public.transaction_participants 
      WHERE profile_id = (select auth.uid())
    )
    OR
    auth_user_is_super_admin() = true
  );

COMMENT ON POLICY "Users can view milestones for their transactions" ON public.milestones IS
  'Consolidated policy: Users can view milestones for transactions they participate in, super admins can view all';

-- ============================================================
-- PROFILES TABLE
-- ============================================================

-- Drop the three separate SELECT policies
DROP POLICY IF EXISTS "Agents can view their buyers and transaction participants" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or super admin can view all" ON public.profiles;

-- Create consolidated policy
CREATE POLICY "Users can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    -- Users can view their own profile
    id = (select auth.uid())
    OR
    -- Super admins can view all profiles
    auth_user_is_super_admin() = true
    OR
    -- Agents can view their buyers
    EXISTS (
      SELECT 1 
      FROM public.buyer_agent_associations 
      WHERE agent_id = (select auth.uid())
      AND buyer_id = profiles.id
    )
    OR
    -- Agents can view transaction participants
    EXISTS (
      SELECT 1 
      FROM public.transaction_participants tp
      JOIN public.transactions t ON t.id = tp.transaction_id
      WHERE t.created_by = (select auth.uid())
      AND tp.profile_id = profiles.id
    )
  );

COMMENT ON POLICY "Users can view profiles" ON public.profiles IS
  'Consolidated policy: Users can view their own profile, super admins can view all, agents can view their buyers and transaction participants';

-- ============================================================
-- SUMMARY
-- ============================================================
-- Consolidated 7 policies into 3 policies across 3 tables:
-- - buyer_agent_associations: 2 → 1 policy
-- - milestones: 2 → 1 policy  
-- - profiles: 3 → 1 policy
--
-- Performance improvement: Single policy evaluation instead of multiple
-- Expected impact: Faster queries, especially on tables with many policies

