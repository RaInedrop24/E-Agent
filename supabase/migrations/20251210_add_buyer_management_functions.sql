-- ============================================================================
-- BUYER MANAGEMENT RPC FUNCTIONS
-- ============================================================================
-- This migration adds RPC functions for buyer management operations
-- Functions are SECURITY DEFINER to handle auth operations safely

-- ============================================================================
-- FUNCTION 1: ASSOCIATE EXISTING BUYER WITH AGENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.associate_buyer_with_agent(
  p_buyer_id uuid,
  p_agent_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_role text;
  v_agent_role text;
BEGIN
  -- Validate agent
  SELECT role INTO v_agent_role
  FROM public.profiles
  WHERE id = p_agent_id;

  IF v_agent_role IS NULL OR v_agent_role != 'agent' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only agents can associate buyers'
    );
  END IF;

  -- Validate buyer
  SELECT role INTO v_buyer_role
  FROM public.profiles
  WHERE id = p_buyer_id;

  IF v_buyer_role IS NULL OR v_buyer_role != 'buyer' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User is not a buyer'
    );
  END IF;

  -- Check if already associated
  IF EXISTS (
    SELECT 1 FROM public.buyer_agent_associations
    WHERE buyer_id = p_buyer_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Buyer is already associated with an agent'
    );
  END IF;

  -- Create association
  INSERT INTO public.buyer_agent_associations (buyer_id, agent_id)
  VALUES (p_buyer_id, p_agent_id);

  RETURN json_build_object(
    'success', true,
    'message', 'Buyer successfully associated with agent'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.associate_buyer_with_agent(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.associate_buyer_with_agent IS
  'Associates an existing buyer with an agent. Returns JSON with success status.';

-- ============================================================================
-- FUNCTION 2: GET BUYERS FOR AGENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_buyers_for_agent(p_agent_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  preferred_language text,
  avatar_url text,
  created_at timestamptz,
  has_association boolean,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.preferred_language,
    p.avatar_url,
    p.created_at,
    EXISTS (
      SELECT 1 FROM public.buyer_agent_associations
      WHERE buyer_id = p.id
    ) as has_association,
    au.email
  FROM public.profiles p
  LEFT JOIN public.buyer_agent_associations baa ON baa.buyer_id = p.id
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE p.role = 'buyer'
    AND (baa.agent_id = p_agent_id OR baa.agent_id IS NULL)
  ORDER BY p.full_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_buyers_for_agent(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_buyers_for_agent IS
  'Returns all buyers for an agent, including unassociated buyers for backward compatibility. Includes email from auth.users.';

-- ============================================================================
-- FUNCTION 3: CHECK IF BUYER BELONGS TO AGENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.buyer_belongs_to_agent(
  p_buyer_id uuid,
  p_agent_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buyer_agent_associations
    WHERE buyer_id = p_buyer_id AND agent_id = p_agent_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.buyer_belongs_to_agent(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.buyer_belongs_to_agent IS
  'Checks if a buyer belongs to the specified agent. Returns boolean.';

-- ============================================================================
-- FUNCTION 4: GET AGENT FOR BUYER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_agent_for_buyer(p_buyer_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  preferred_language text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    au.email,
    p.preferred_language
  FROM public.buyer_agent_associations baa
  JOIN public.profiles p ON p.id = baa.agent_id
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE baa.buyer_id = p_buyer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_for_buyer(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_agent_for_buyer IS
  'Returns the agent associated with a buyer. Buyers can see their own agent.';

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Buyer management RPC functions migration completed successfully!';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  1. associate_buyer_with_agent(buyer_id, agent_id)';
  RAISE NOTICE '  2. get_buyers_for_agent(agent_id)';
  RAISE NOTICE '  3. buyer_belongs_to_agent(buyer_id, agent_id)';
  RAISE NOTICE '  4. get_agent_for_buyer(buyer_id)';
  RAISE NOTICE 'All functions granted to authenticated role';
END $$;
