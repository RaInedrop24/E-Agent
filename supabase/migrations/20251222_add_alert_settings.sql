-- Add alert settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_alerts_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_alerts_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_number text;

-- Comment on columns
COMMENT ON COLUMN public.profiles.email_alerts_enabled IS 'Whether the user wants to receive email notifications';
COMMENT ON COLUMN public.profiles.sms_alerts_enabled IS 'Whether the user wants to receive SMS notifications';
COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number including international dialing code';
