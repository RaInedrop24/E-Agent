-- ============================================================================
-- BUYER-AGENT ASSOCIATIONS MIGRATION
-- ============================================================================
-- This migration adds a table to link buyers with their managing agent
-- Each buyer belongs to exactly ONE agent (one-to-many relationship)
-- Implements SaaS multi-tenancy at the agent level

-- ============================================================================
-- CREATE BUYER_AGENT_ASSOCIATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.buyer_agent_associations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_buyer_agent UNIQUE (buyer_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_buyer_agent_buyer
  ON public.buyer_agent_associations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_agent_agent
  ON public.buyer_agent_associations(agent_id);

COMMENT ON TABLE public.buyer_agent_associations IS
  'Links buyers with their managing agent (one-to-many relationship)';
COMMENT ON COLUMN public.buyer_agent_associations.buyer_id IS
  'The buyer profile (each buyer belongs to exactly one agent)';
COMMENT ON COLUMN public.buyer_agent_associations.agent_id IS
  'The agent who manages this buyer';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.buyer_agent_associations ENABLE ROW LEVEL SECURITY;

-- Agents can view all their buyer associations
CREATE POLICY "Agents can view their buyer associations"
  ON public.buyer_agent_associations FOR SELECT
  USING (agent_id = auth.uid());

-- Buyers can view their own association
CREATE POLICY "Buyers can view their agent association"
  ON public.buyer_agent_associations FOR SELECT
  USING (buyer_id = auth.uid());

-- Only agents can create buyer associations (when creating buyers)
CREATE POLICY "Agents can create buyer associations"
  ON public.buyer_agent_associations FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  );

-- Agents can update their buyer associations
CREATE POLICY "Agents can update their buyer associations"
  ON public.buyer_agent_associations FOR UPDATE
  USING (agent_id = auth.uid());

-- Agents can delete their buyer associations
CREATE POLICY "Agents can delete their buyer associations"
  ON public.buyer_agent_associations FOR DELETE
  USING (agent_id = auth.uid());

-- ============================================================================
-- ENHANCED PROFILES RLS POLICIES
-- ============================================================================
-- Update profiles policies to enforce agent-level data isolation

-- Drop existing policy that allows viewing transaction participants
DROP POLICY IF EXISTS "Users can view profiles of transaction participants"
  ON public.profiles;

-- Replace with agent-scoped policy
CREATE POLICY "Agents can view their buyers and transaction participants"
  ON public.profiles FOR SELECT
  USING (
    -- User can view their own profile
    auth.uid() = id
    OR
    -- Agents can view their buyers
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'agent'
      )
      AND EXISTS (
        SELECT 1 FROM public.buyer_agent_associations
        WHERE agent_id = auth.uid() AND buyer_id = id
      )
    )
    OR
    -- Users can view profiles of people in their transactions
    (
      id IN (
        SELECT profile_id FROM public.transaction_participants
        WHERE transaction_id IN (
          SELECT transaction_id FROM public.transaction_participants
          WHERE profile_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Buyer-agent associations migration completed successfully!';
  RAISE NOTICE 'Table created: buyer_agent_associations';
  RAISE NOTICE 'RLS policies applied: 5 on buyer_agent_associations, 1 updated on profiles';
  RAISE NOTICE 'Next step: Run RPC functions migration';
END $$;
