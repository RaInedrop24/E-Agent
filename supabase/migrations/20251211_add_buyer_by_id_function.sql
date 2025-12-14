-- Function to add a buyer to a transaction by buyer ID
-- This function is called by the Agent
CREATE OR REPLACE FUNCTION public.add_buyer_to_transaction_by_id(
  p_transaction_id uuid,
  p_buyer_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_exists boolean;
  v_already_participant boolean;
  v_buyer_exists boolean;
  v_is_associated boolean;
BEGIN
  -- 1. Check if transaction exists and current user has access (is the creator or an agent participant)
  SELECT EXISTS (
    SELECT 1 FROM transactions
    WHERE id = p_transaction_id AND created_by = auth.uid()
  ) INTO v_transaction_exists;

  IF NOT v_transaction_exists THEN
    RETURN json_build_object('success', false, 'message', 'Transaction not found or permission denied');
  END IF;

  -- 2. Check if buyer profile exists
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_buyer_id AND role = 'buyer'
  ) INTO v_buyer_exists;

  IF NOT v_buyer_exists THEN
    RETURN json_build_object('success', false, 'message', 'Buyer not found');
  END IF;

  -- 3. Check if buyer is associated with the agent
  SELECT EXISTS (
    SELECT 1 FROM buyer_agent_associations
    WHERE buyer_id = p_buyer_id AND agent_id = auth.uid()
  ) INTO v_is_associated;

  IF NOT v_is_associated THEN
    RETURN json_build_object('success', false, 'message', 'You can only add buyers that are associated with you');
  END IF;

  -- 4. Check if already a participant
  SELECT EXISTS (
    SELECT 1 FROM transaction_participants
    WHERE transaction_id = p_transaction_id AND profile_id = p_buyer_id
  ) INTO v_already_participant;

  IF v_already_participant THEN
    RETURN json_build_object('success', false, 'message', 'Buyer is already a participant in this transaction');
  END IF;

  -- 5. Add to participants
  INSERT INTO transaction_participants (
    transaction_id,
    profile_id,
    participant_role
  ) VALUES (
    p_transaction_id,
    p_buyer_id,
    'buyer'
  );

  RETURN json_build_object('success', true, 'message', 'Buyer added successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_buyer_to_transaction_by_id(uuid, uuid) TO authenticated;
