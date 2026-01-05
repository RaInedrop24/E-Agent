-- Fix security issue: Change user_notifications_with_details view to SECURITY INVOKER
-- This ensures RLS policies of the querying user are applied, not the view creator's

-- Drop the existing view
DROP VIEW IF EXISTS user_notifications_with_details;

-- Recreate the view with SECURITY INVOKER
CREATE OR REPLACE VIEW user_notifications_with_details
WITH (security_invoker = true)
AS
SELECT 
  un.id,
  un.user_id,
  un.announcement_id,
  un.read,
  un.read_at,
  un.created_at,
  sa.subject,
  sa.message,
  sa.message_type,
  sa.sent_at
FROM public.user_notifications un
JOIN public.system_announcements sa ON sa.id = un.announcement_id
ORDER BY un.created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_notifications_with_details TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW user_notifications_with_details IS 'User notifications with announcement details. Uses SECURITY INVOKER to enforce RLS policies of the querying user.';

-- Also fix the get_unread_notification_count function to use SECURITY INVOKER
-- and add proper permission checks
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER to respect RLS
STABLE
SET search_path = public, auth  -- ✅ Added: Explicit search_path for security
AS $$
BEGIN
  -- Only allow users to check their own notification count
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Access denied: You can only check your own notification count';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.user_notifications
    WHERE user_id = user_uuid
    AND read = false
  );
END;
$$;

COMMENT ON FUNCTION get_unread_notification_count IS 'Returns the count of unread notifications for a user. Uses SECURITY INVOKER with explicit search_path and only allows users to check their own count.';

