-- Function to add a buyer to a transaction by email
-- This function is called by the Agent
CREATE OR REPLACE FUNCTION public.add_buyer_to_transaction(
  p_transaction_id uuid,
  p_buyer_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Needed to look up profiles by email and insert into participants
AS $$
DECLARE
  v_buyer_profile_id uuid;
  v_transaction_exists boolean;
  v_is_agent boolean;
  v_already_participant boolean;
BEGIN
  -- 1. Check if transaction exists and current user has access (is the creator or an agent participant)
  -- For MVP, strict check: must be the creator
  SELECT EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = p_transaction_id AND created_by = auth.uid()
  ) INTO v_transaction_exists;

  IF NOT v_transaction_exists THEN
    RETURN json_build_object('success', false, 'message', 'Transaction not found or permission denied');
  END IF;

  -- 2. Find the buyer's profile by email
  -- We need to join with auth.users to get the email, OR assume profiles has email?
  -- The schema shows profiles does NOT have email. It has id, full_name, etc.
  -- So we must query auth.users.
  
  SELECT id INTO v_buyer_profile_id
  FROM auth.users
  WHERE email = p_buyer_email;

  IF v_buyer_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found. The buyer must be registered first.');
  END IF;

  -- 3. Check if already a participant
  SELECT EXISTS (
    SELECT 1 FROM public.transaction_participants
    WHERE transaction_id = p_transaction_id AND profile_id = v_buyer_profile_id
  ) INTO v_already_participant;

  IF v_already_participant THEN
    RETURN json_build_object('success', false, 'message', 'User is already a participant');
  END IF;

  -- 4. Add to participants
  INSERT INTO public.transaction_participants (
    transaction_id,
    profile_id,
    participant_role
  ) VALUES (
    p_transaction_id,
    v_buyer_profile_id,
    'buyer'
  );

  RETURN json_build_object('success', true, 'message', 'Buyer added successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_buyer_to_transaction(uuid, text) TO authenticated;
