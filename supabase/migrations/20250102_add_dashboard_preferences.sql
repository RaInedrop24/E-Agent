-- Add dashboard preference fields to profiles table
-- These preferences will follow the user across all devices

ALTER TABLE public.profiles
ADD COLUMN dashboard_filter_active_only boolean DEFAULT false,
ADD COLUMN dashboard_sort_by text DEFAULT 'last_updated' CHECK (dashboard_sort_by IN ('last_updated', 'created_at'));

-- Add comments
COMMENT ON COLUMN public.profiles.dashboard_filter_active_only IS 'User preference: show only active transactions on dashboard';
COMMENT ON COLUMN public.profiles.dashboard_sort_by IS 'User preference: how to sort transactions on dashboard (last_updated or created_at)';
