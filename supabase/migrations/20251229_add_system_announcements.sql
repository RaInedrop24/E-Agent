-- Create system_announcements table for tracking admin messages
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('agents', 'buyers', 'all')),
  message_type TEXT NOT NULL CHECK (message_type IN ('notification', 'email', 'both')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Super admins can view all announcements
CREATE POLICY "Super admins can view all announcements"
  ON public.system_announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can insert announcements
CREATE POLICY "Super admins can insert announcements"
  ON public.system_announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Add index for faster queries
CREATE INDEX idx_system_announcements_admin_user ON public.system_announcements(admin_user_id);
CREATE INDEX idx_system_announcements_sent_at ON public.system_announcements(sent_at DESC);

-- Grant permissions
GRANT SELECT, INSERT ON public.system_announcements TO authenticated;

COMMENT ON TABLE public.system_announcements IS 'Stores system-wide announcements sent by super admins to agents and/or buyers';

