-- Migration: Add Polish Language Support
-- Created: 2025-12-19
-- Description: Adds Polish (pl) language columns and updates constraints

-- ============================================================================
-- UPDATE PROFILES TABLE CONSTRAINT
-- ============================================================================

-- Update preferred_language constraint to include Polish
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_preferred_language_check
CHECK (preferred_language IN ('en', 'it', 'de', 'fr', 'es', 'pl'));

COMMENT ON CONSTRAINT profiles_preferred_language_check ON public.profiles IS
  'Valid language codes: en, it, de, fr, es, pl';

-- ============================================================================
-- ADD POLISH LANGUAGE COLUMNS
-- ============================================================================

-- Add label_pl column to milestones table
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS label_pl text;

COMMENT ON COLUMN public.milestones.label_pl IS
  'Polish translation of milestone label';

-- Add label_pl column to milestone_template_items table
ALTER TABLE public.milestone_template_items
ADD COLUMN IF NOT EXISTS label_pl text;

COMMENT ON COLUMN public.milestone_template_items.label_pl IS
  'Polish translation of milestone label';

-- Add title_pl column to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS title_pl text;

COMMENT ON COLUMN public.transactions.title_pl IS
  'Polish translation of transaction title';
