-- Add property URL and title translations to transactions table
-- Created: 2025-12-16
-- Description: Adds optional property URL field and multilingual title fields

-- Add property_url column for linking to agent's property listing
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS property_url text;

COMMENT ON COLUMN public.transactions.property_url IS 'Optional URL to the property listing on agent''s website';

-- Add title translation columns (similar to milestones pattern)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS title_en text,
ADD COLUMN IF NOT EXISTS title_it text,
ADD COLUMN IF NOT EXISTS title_de text,
ADD COLUMN IF NOT EXISTS title_fr text,
ADD COLUMN IF NOT EXISTS title_es text;

COMMENT ON COLUMN public.transactions.title_en IS 'English translation of transaction title';
COMMENT ON COLUMN public.transactions.title_it IS 'Italian translation of transaction title';
COMMENT ON COLUMN public.transactions.title_de IS 'German translation of transaction title';
COMMENT ON COLUMN public.transactions.title_fr IS 'French translation of transaction title';
COMMENT ON COLUMN public.transactions.title_es IS 'Spanish translation of transaction title';

-- Migrate existing titles to title_en (assuming existing titles are in English)
-- Only update where title_en is null to avoid overwriting existing data
UPDATE public.transactions
SET title_en = title
WHERE title_en IS NULL AND title IS NOT NULL;

