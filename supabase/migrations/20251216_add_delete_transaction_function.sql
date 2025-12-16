-- Create a function to safely delete a transaction and all related data
-- Created: 2025-12-16
-- Description: Atomic deletion of transaction and all related records

CREATE OR REPLACE FUNCTION delete_transaction(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_exists boolean;
BEGIN
  -- Check if transaction exists
  SELECT EXISTS(SELECT 1 FROM transactions WHERE id = p_transaction_id)
  INTO v_transaction_exists;

  IF NOT v_transaction_exists THEN
    -- Transaction doesn't exist, nothing to do
    RETURN;
  END IF;

  -- Delete all related data in correct order (due to foreign key constraints)
  -- All deletions happen in a single database transaction for atomicity
  
  -- 1. Delete files records (storage deletion handled by client)
  DELETE FROM files WHERE transaction_id = p_transaction_id;
  
  -- 2. Delete messages
  DELETE FROM messages WHERE transaction_id = p_transaction_id;
  
  -- 3. Delete milestones
  DELETE FROM milestones WHERE transaction_id = p_transaction_id;
  
  -- 4. Delete participants
  DELETE FROM transaction_participants WHERE transaction_id = p_transaction_id;
  
  -- 5. Finally, delete the transaction itself
  DELETE FROM transactions WHERE id = p_transaction_id;

  -- If we get here, all deletions succeeded
  -- Note: Storage file deletion must be done via Supabase Storage API in the client
END;
$$;

COMMENT ON FUNCTION delete_transaction(uuid) IS 'Safely deletes a transaction and all related data in a single transaction';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_transaction(uuid) TO authenticated;

