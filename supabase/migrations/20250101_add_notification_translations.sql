-- Add translation storage columns to user_notifications table
-- This allows us to cache translations per user/language to avoid repeated DeepL API calls

ALTER TABLE public.user_notifications
ADD COLUMN IF NOT EXISTS translated_subject TEXT,
ADD COLUMN IF NOT EXISTS translated_message TEXT,
ADD COLUMN IF NOT EXISTS translation_language TEXT;

-- Add index for faster lookups when checking for existing translations
CREATE INDEX IF NOT EXISTS idx_user_notifications_translation_language 
ON public.user_notifications(user_id, translation_language) 
WHERE translated_subject IS NOT NULL;

-- Update the view to include translated fields
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
  sa.sent_at,
  un.translated_subject,
  un.translated_message,
  un.translation_language
FROM public.user_notifications un
JOIN public.system_announcements sa ON sa.id = un.announcement_id
ORDER BY un.created_at DESC;

COMMENT ON COLUMN public.user_notifications.translated_subject IS 'Cached translation of the notification subject in the user''s preferred language';
COMMENT ON COLUMN public.user_notifications.translated_message IS 'Cached translation of the notification message in the user''s preferred language';
COMMENT ON COLUMN public.user_notifications.translation_language IS 'Language code for which the translation was made (e.g., it, en, de)';

