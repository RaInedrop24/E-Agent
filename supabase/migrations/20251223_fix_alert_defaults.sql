-- Fix existing users to have email_alerts_enabled = false by default
-- This corrects the issue from the previous migration that set DEFAULT true

UPDATE public.profiles
SET email_alerts_enabled = false
WHERE email_alerts_enabled = true;

-- Update the column default for future users
ALTER TABLE public.profiles
ALTER COLUMN email_alerts_enabled SET DEFAULT false;
