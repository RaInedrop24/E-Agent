-- Create user_notifications table to track which users have seen which announcements
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.system_announcements(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure each user only gets one entry per announcement
  UNIQUE(user_id, announcement_id)
);

-- Add RLS policies
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications for users
CREATE POLICY "Service role can insert notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(user_id, read);
CREATE INDEX idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX idx_user_notifications_announcement_id ON public.user_notifications(announcement_id);

-- Grant permissions
GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;
GRANT INSERT ON public.user_notifications TO service_role;

-- Create a function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.user_notifications
    WHERE user_id = user_uuid
    AND read = false
  );
END;
$$;

-- Create a view for user notifications with announcement details
CREATE OR REPLACE VIEW user_notifications_with_details AS
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

COMMENT ON TABLE public.user_notifications IS 'Tracks which users have seen which system announcements';
COMMENT ON FUNCTION get_unread_notification_count IS 'Returns the count of unread notifications for a user';

