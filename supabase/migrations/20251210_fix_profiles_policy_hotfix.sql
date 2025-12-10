-- ============================================================================
-- HOTFIX: Ensure profiles can be viewed properly
-- ============================================================================
-- This migration ensures the RLS policy allows users to view their own profile
-- without conflicts from the buyer-agent associations policy

-- First, let's ensure there's a simple policy for viewing own profile
-- This is separate from the buyer-agent associations policy

-- Check if "Users can view their own profile" policy exists, if not create it
DO $$
BEGIN
  -- Drop our complex policy temporarily
  DROP POLICY IF EXISTS "Agents can view their buyers and transaction participants" ON public.profiles;

  -- Create a simple base policy for viewing own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END$$;

-- Now recreate the comprehensive policy without the potential for conflicts
CREATE POLICY "Agents can view their buyers and transaction participants"
  ON public.profiles FOR SELECT
  USING (
    -- User can view their own profile (redundant but safe)
    auth.uid() = id
    OR
    -- Agents can view their buyers
    (
      EXISTS (
        SELECT 1 FROM public.buyer_agent_associations
        WHERE agent_id = auth.uid() AND buyer_id = profiles.id
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

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Profiles RLS policy hotfix completed!';
  RAISE NOTICE 'Users can now view their own profiles and related profiles';
END $$;
