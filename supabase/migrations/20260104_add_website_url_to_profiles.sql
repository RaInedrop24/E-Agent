-- Add website_url column to profiles table for agents
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website_url text;

-- Comment on column
COMMENT ON COLUMN public.profiles.website_url IS 'Agent''s website URL for automatic color scheme extraction';

