-- Update dashboard_sort_by constraint to include new sort options
-- Previously only allowed: 'last_updated', 'created_at'
-- Now also allows: 'title', 'agent_reference'

-- Drop the old constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_dashboard_sort_by_check;

-- Add the updated constraint with all four options
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_dashboard_sort_by_check
CHECK (dashboard_sort_by IN ('last_updated', 'created_at', 'title', 'agent_reference'));

-- Update the comment to reflect new options
COMMENT ON COLUMN public.profiles.dashboard_sort_by IS 'User preference: how to sort transactions on dashboard (last_updated, created_at, title, or agent_reference)';
