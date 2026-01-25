-- Add onboarding_completed field to profiles table
-- This tracks whether a user has completed the interactive onboarding tour

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed the interactive onboarding tour';
