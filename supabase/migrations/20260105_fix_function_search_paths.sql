-- Fix security issue: Add SET search_path to functions
-- Functions with role mutable search_path can be exploited for privilege escalation
-- All SECURITY DEFINER functions should have an explicit search_path set

-- 1. Fix: update_transaction_last_updated
CREATE OR REPLACE FUNCTION public.update_transaction_last_updated(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Fixed: Added explicit search_path
AS $$
BEGIN
  -- Update the last_updated timestamp to current time
  UPDATE public.transactions
  SET last_updated = now()
  WHERE id = p_transaction_id;
END;
$$;

COMMENT ON FUNCTION public.update_transaction_last_updated(uuid) IS
'Updates the last_updated timestamp for a transaction. Used to track significant user activity (milestone changes, messages, file uploads). SECURITY DEFINER allows participants (not just creator) to update via activity.';

-- 2. Fix: create_profile_for_current_user
CREATE OR REPLACE FUNCTION public.create_profile_for_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth  -- ✅ Fixed: Added explicit search_path (needs auth schema for auth.uid())
AS $$
DECLARE
  user_id uuid;
  user_email text;
  user_meta json;
  new_profile json;
BEGIN
  -- Get current user ID
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Return existing profile
    SELECT row_to_json(p.*) INTO new_profile
    FROM public.profiles p
    WHERE p.id = user_id;

    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'profile', new_profile
    );
  END IF;

  -- Get user metadata from auth.users
  SELECT
    email,
    raw_user_meta_data
  INTO user_email, user_meta
  FROM auth.users
  WHERE id = user_id;

  -- Insert profile with website_url from metadata
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    preferred_language,
    website_url
  ) VALUES (
    user_id,
    COALESCE(user_meta->>'full_name', split_part(user_email, '@', 1)),
    COALESCE(user_meta->>'role', 'buyer'),
    COALESCE(user_meta->>'preferred_language', 'en'),
    user_meta->>'website_url'
  )
  RETURNING row_to_json(profiles.*) INTO new_profile;

  RETURN json_build_object(
    'success', true,
    'message', 'Profile created successfully',
    'profile', new_profile
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

COMMENT ON FUNCTION public.create_profile_for_current_user()
IS 'Creates a profile for the current authenticated user if one does not exist. Includes website_url from user metadata. Uses SECURITY DEFINER to bypass RLS.';

-- 3. Fix: delete_transaction
CREATE OR REPLACE FUNCTION public.delete_transaction(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Fixed: Added explicit search_path
AS $$
DECLARE
  v_transaction_exists boolean;
BEGIN
  -- Check if transaction exists
  SELECT EXISTS(SELECT 1 FROM public.transactions WHERE id = p_transaction_id)
  INTO v_transaction_exists;

  IF NOT v_transaction_exists THEN
    -- Transaction doesn't exist, nothing to do
    RETURN;
  END IF;

  -- Delete all related data in correct order (due to foreign key constraints)
  -- All deletions happen in a single database transaction for atomicity
  
  -- 1. Delete files records (storage deletion handled by client)
  DELETE FROM public.files WHERE transaction_id = p_transaction_id;
  
  -- 2. Delete messages
  DELETE FROM public.messages WHERE transaction_id = p_transaction_id;
  
  -- 3. Delete milestones
  DELETE FROM public.milestones WHERE transaction_id = p_transaction_id;
  
  -- 4. Delete participants
  DELETE FROM public.transaction_participants WHERE transaction_id = p_transaction_id;
  
  -- 5. Finally, delete the transaction itself
  DELETE FROM public.transactions WHERE id = p_transaction_id;

  -- If we get here, all deletions succeeded
  -- Note: Storage file deletion must be done via Supabase Storage API in the client
END;
$$;

COMMENT ON FUNCTION public.delete_transaction(uuid) IS 'Safely deletes a transaction and all related data in a single transaction';

-- 4. Fix: add_buyer_to_transaction
CREATE OR REPLACE FUNCTION public.add_buyer_to_transaction(
  p_transaction_id uuid,
  p_buyer_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth  -- ✅ Fixed: Added explicit search_path (needs auth schema)
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

COMMENT ON FUNCTION public.add_buyer_to_transaction(uuid, text) IS 
  'Adds a buyer to a transaction by email. Uses SECURITY DEFINER with explicit search_path for security.';

-- Grant permissions (re-apply after function recreation)
GRANT EXECUTE ON FUNCTION public.update_transaction_last_updated(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_buyer_to_transaction(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_transaction(uuid) TO authenticated;

