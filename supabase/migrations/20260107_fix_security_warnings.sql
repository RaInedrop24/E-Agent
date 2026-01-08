-- =============================================================================
-- Security Fixes: Supabase Advisor Warnings
-- Date: January 7, 2026
-- =============================================================================

-- =============================================================================
-- FIX 1: Function Search Path Mutable (is_super_admin)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp  -- 🔒 Security: Prevent schema poisoning
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  );
$$;

-- =============================================================================
-- FIX 2: RLS Policy Always True (user_notifications)
-- =============================================================================

-- Remove insecure policy that allows anyone to insert notifications
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Super admin can insert notifications" ON public.user_notifications;

-- Create secure policy: ONLY super admin can insert notifications
-- Regular users cannot create notifications (they're created by system)
-- Service role (backend) bypasses RLS anyway
CREATE POLICY "Super admin can insert notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (public.is_super_admin());

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check the updated function
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM pg_proc 
WHERE proname = 'is_super_admin';

-- Check notification policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_notifications'
ORDER BY cmd, policyname;

-- =============================================================================
-- EXPECTED RESULTS
-- =============================================================================
-- Function should show:
--   is_security_definer: true
--   config_settings: {search_path=public,pg_temp}
--
-- Policies should show:
--   "Super admin can insert notifications" | INSERT | (with_check uses is_super_admin)
--   "Users can view own notifications" | SELECT
--   "Users can update own notifications" | UPDATE
--   "Users can delete own notifications" | DELETE
-- =============================================================================

