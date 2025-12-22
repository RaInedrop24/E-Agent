
-- Add branding columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS branding_logo_url text,
ADD COLUMN IF NOT EXISTS branding_settings jsonb DEFAULT '{}'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.profiles.branding_logo_url IS 'URL of the agent''s uploaded logo';
COMMENT ON COLUMN public.profiles.branding_settings IS 'JSON object containing AI-generated or user-selected theme colors (primary, secondary, background, etc.)';
