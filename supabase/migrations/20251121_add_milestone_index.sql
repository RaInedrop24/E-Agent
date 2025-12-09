-- Fix "Unindexed foreign keys" performance info
-- Adds a covering index for the foreign key 'milestones_completed_by_fkey'

CREATE INDEX IF NOT EXISTS idx_milestones_completed_by ON public.milestones(completed_by);
