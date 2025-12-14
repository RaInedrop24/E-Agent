-- Function to get transaction participants with their email addresses
-- This function uses SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.get_transaction_participants(
  p_transaction_id uuid
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  participant_role text,
  full_name text,
  email text,
  invited_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.id,
    tp.profile_id,
    tp.participant_role,
    COALESCE(p.full_name, 'Unknown') as full_name,
    COALESCE(au.email::text, 'unknown@example.com') as email,
    tp.invited_at
  FROM public.transaction_participants tp
  LEFT JOIN public.profiles p ON p.id = tp.profile_id
  LEFT JOIN auth.users au ON au.id = tp.profile_id
  WHERE tp.transaction_id = p_transaction_id
  ORDER BY tp.invited_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_transaction_participants(uuid) TO authenticated;
