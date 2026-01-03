-- Add activity feed filter preference fields to profiles table
-- These preferences control what activities are shown on the dashboard

ALTER TABLE public.profiles
ADD COLUMN activity_type_filters jsonb DEFAULT '{"milestone": true, "message": true, "file": true, "notification": true}'::jsonb,
ADD COLUMN activity_time_range text DEFAULT '7d' CHECK (activity_time_range IN ('24h', '3d', '7d', '30d', 'all'));

-- Add comments
COMMENT ON COLUMN public.profiles.activity_type_filters IS 'User preference: which activity types to show on dashboard (milestone, message, file, notification)';
COMMENT ON COLUMN public.profiles.activity_time_range IS 'User preference: time range for activity feed (24h, 3d, 7d, 30d, all)';
