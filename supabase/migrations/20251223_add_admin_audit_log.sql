-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);

-- Comments
COMMENT ON TABLE public.admin_audit_log IS 'Audit log for all super admin actions';
COMMENT ON COLUMN public.admin_audit_log.action IS 'Action performed (e.g., view_transaction, update_user_settings, etc.)';
COMMENT ON COLUMN public.admin_audit_log.resource_type IS 'Type of resource accessed (e.g., transaction, profile, settings)';
COMMENT ON COLUMN public.admin_audit_log.resource_id IS 'ID of the resource accessed';

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

-- Only super admins can insert audit logs (via service role)
CREATE POLICY "Super admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);
