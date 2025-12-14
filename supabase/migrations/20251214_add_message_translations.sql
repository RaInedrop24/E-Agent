-- Add translation caching to messages table
-- This stores translated versions so we don't call DeepL repeatedly

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS translated_text JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.messages.translated_text IS 'Cached translations in format: {"it": "translated text", "en": "translated text", ...}';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_translated_text ON public.messages USING gin (translated_text);

