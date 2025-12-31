-- Function to update last_updated timestamp on a transaction
-- Called from server actions when user activity occurs (milestones, messages, files)
-- Uses SECURITY DEFINER to bypass RLS policies (allows non-creators to trigger updates)

CREATE OR REPLACE FUNCTION public.update_transaction_last_updated(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the last_updated timestamp to current time
  UPDATE public.transactions
  SET last_updated = now()
  WHERE id = p_transaction_id;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.update_transaction_last_updated(uuid) IS
'Updates the last_updated timestamp for a transaction. Used to track significant user activity (milestone changes, messages, file uploads). SECURITY DEFINER allows participants (not just creator) to update via activity.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_transaction_last_updated(uuid) TO authenticated;
