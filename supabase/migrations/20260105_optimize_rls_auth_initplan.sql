-- Performance Optimization: Fix Auth RLS InitPlan Issues
-- Wrap auth.uid() calls in subqueries to prevent re-evaluation for each row
-- This significantly improves query performance at scale

-- ============================================================
-- PROFILES TABLE
-- ============================================================

-- 1. Users can view their own profile or super admin can view all
DROP POLICY IF EXISTS "Users can view their own profile or super admin can view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or super admin can view all"
  ON public.profiles
  FOR SELECT
  USING (
    id = (select auth.uid())  -- ✅ Optimized: Evaluates once per query
    OR 
    auth_user_is_super_admin() = true
  );

-- 2. Agents can view their buyers and transaction participants
DROP POLICY IF EXISTS "Agents can view their buyers and transaction participants" ON public.profiles;
CREATE POLICY "Agents can view their buyers and transaction participants"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.buyer_agent_associations 
      WHERE agent_id = (select auth.uid())  -- ✅ Optimized
      AND buyer_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 
      FROM public.transaction_participants tp
      JOIN public.transactions t ON t.id = tp.transaction_id
      WHERE t.created_by = (select auth.uid())  -- ✅ Optimized
      AND tp.profile_id = profiles.id
    )
  );

-- 3. Users can insert their own profile or via trigger
DROP POLICY IF EXISTS "Users can insert their own profile or via trigger" ON public.profiles;
CREATE POLICY "Users can insert their own profile or via trigger"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    id = (select auth.uid())  -- ✅ Optimized
  );

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================

-- 4. Agents can create transactions
DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;
CREATE POLICY "Agents can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'agent'  -- ✅ Optimized
  );

-- 5. Users can view transactions they participate in or super admin
DROP POLICY IF EXISTS "Users can view transactions they participate in or super admin" ON public.transactions;
CREATE POLICY "Users can view transactions they participate in or super admin"
  ON public.transactions
  FOR SELECT
  USING (
    id IN (
      SELECT transaction_id 
      FROM public.transaction_participants 
      WHERE profile_id = (select auth.uid())  -- ✅ Optimized
    )
    OR
    auth_user_is_super_admin() = true
  );

-- ============================================================
-- MILESTONES TABLE
-- ============================================================

-- 6. Users can view milestones for their transactions or super admin
DROP POLICY IF EXISTS "Users can view milestones for their transactions or super admin" ON public.milestones;
CREATE POLICY "Users can view milestones for their transactions or super admin"
  ON public.milestones
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id 
      FROM public.transaction_participants 
      WHERE profile_id = (select auth.uid())  -- ✅ Optimized
    )
    OR
    auth_user_is_super_admin() = true
  );

-- ============================================================
-- MESSAGES TABLE
-- ============================================================

-- 7. Users can view messages in their transactions or super admin
DROP POLICY IF EXISTS "Users can view messages in their transactions or super admin" ON public.messages;
CREATE POLICY "Users can view messages in their transactions or super admin"
  ON public.messages
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id 
      FROM public.transaction_participants 
      WHERE profile_id = (select auth.uid())  -- ✅ Optimized
    )
    OR
    auth_user_is_super_admin() = true
  );

-- ============================================================
-- FILES TABLE
-- ============================================================

-- 8. Users can view files in their transactions or super admin
DROP POLICY IF EXISTS "Users can view files in their transactions or super admin" ON public.files;
CREATE POLICY "Users can view files in their transactions or super admin"
  ON public.files
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id 
      FROM public.transaction_participants 
      WHERE profile_id = (select auth.uid())  -- ✅ Optimized
    )
    OR
    auth_user_is_super_admin() = true
  );

-- ============================================================
-- BUYER_AGENT_ASSOCIATIONS TABLE
-- ============================================================

-- 9. Agents can view their buyer associations
DROP POLICY IF EXISTS "Agents can view their buyer associations" ON public.buyer_agent_associations;
CREATE POLICY "Agents can view their buyer associations"
  ON public.buyer_agent_associations
  FOR SELECT
  USING (agent_id = (select auth.uid()));  -- ✅ Optimized

-- 10. Buyers can view their agent association
DROP POLICY IF EXISTS "Buyers can view their agent association" ON public.buyer_agent_associations;
CREATE POLICY "Buyers can view their agent association"
  ON public.buyer_agent_associations
  FOR SELECT
  USING (buyer_id = (select auth.uid()));  -- ✅ Optimized

-- 11. Agents can create buyer associations
DROP POLICY IF EXISTS "Agents can create buyer associations" ON public.buyer_agent_associations;
CREATE POLICY "Agents can create buyer associations"
  ON public.buyer_agent_associations
  FOR INSERT
  WITH CHECK (agent_id = (select auth.uid()));  -- ✅ Optimized

-- 12. Agents can update their buyer associations
DROP POLICY IF EXISTS "Agents can update their buyer associations" ON public.buyer_agent_associations;
CREATE POLICY "Agents can update their buyer associations"
  ON public.buyer_agent_associations
  FOR UPDATE
  USING (agent_id = (select auth.uid()));  -- ✅ Optimized

-- 13. Agents can delete their buyer associations
DROP POLICY IF EXISTS "Agents can delete their buyer associations" ON public.buyer_agent_associations;
CREATE POLICY "Agents can delete their buyer associations"
  ON public.buyer_agent_associations
  FOR DELETE
  USING (agent_id = (select auth.uid()));  -- ✅ Optimized

-- ============================================================
-- MILESTONE_TEMPLATES TABLE
-- ============================================================

-- 14. Agents can view their own templates or super admin can view all
DROP POLICY IF EXISTS "Agents can view their own templates or super admin can view all" ON public.milestone_templates;
CREATE POLICY "Agents can view their own templates or super admin can view all"
  ON public.milestone_templates
  FOR SELECT
  USING (
    agent_id = (select auth.uid())  -- ✅ Optimized
    OR
    auth_user_is_super_admin() = true
  );

-- 15. Agents can create templates
DROP POLICY IF EXISTS "Agents can create templates" ON public.milestone_templates;
CREATE POLICY "Agents can create templates"
  ON public.milestone_templates
  FOR INSERT
  WITH CHECK (agent_id = (select auth.uid()));  -- ✅ Optimized

-- 16. Agents can update their own templates
DROP POLICY IF EXISTS "Agents can update their own templates" ON public.milestone_templates;
CREATE POLICY "Agents can update their own templates"
  ON public.milestone_templates
  FOR UPDATE
  USING (agent_id = (select auth.uid()));  -- ✅ Optimized

-- 17. Agents can delete their own templates
DROP POLICY IF EXISTS "Agents can delete their own templates" ON public.milestone_templates;
CREATE POLICY "Agents can delete their own templates"
  ON public.milestone_templates
  FOR DELETE
  USING (agent_id = (select auth.uid()));  -- ✅ Optimized

-- ============================================================
-- MILESTONE_TEMPLATE_ITEMS TABLE
-- ============================================================

-- 18. Agents can view items of their templates or super admin can view all
DROP POLICY IF EXISTS "Agents can view items of their templates or super admin can vie" ON public.milestone_template_items;
CREATE POLICY "Agents can view items of their templates or super admin can vie"
  ON public.milestone_template_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.milestone_templates 
      WHERE id = milestone_template_items.template_id 
      AND agent_id = (select auth.uid())  -- ✅ Optimized
    )
    OR
    auth_user_is_super_admin() = true
  );

-- 19. Agents can create items for their templates
DROP POLICY IF EXISTS "Agents can create items for their templates" ON public.milestone_template_items;
CREATE POLICY "Agents can create items for their templates"
  ON public.milestone_template_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.milestone_templates 
      WHERE id = template_id 
      AND agent_id = (select auth.uid())  -- ✅ Optimized
    )
  );

-- 20. Agents can update items of their templates
DROP POLICY IF EXISTS "Agents can update items of their templates" ON public.milestone_template_items;
CREATE POLICY "Agents can update items of their templates"
  ON public.milestone_template_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.milestone_templates 
      WHERE id = milestone_template_items.template_id 
      AND agent_id = (select auth.uid())  -- ✅ Optimized
    )
  );

-- 21. Agents can delete items of their templates
DROP POLICY IF EXISTS "Agents can delete items of their templates" ON public.milestone_template_items;
CREATE POLICY "Agents can delete items of their templates"
  ON public.milestone_template_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.milestone_templates 
      WHERE id = milestone_template_items.template_id 
      AND agent_id = (select auth.uid())  -- ✅ Optimized
    )
  );

-- ============================================================
-- ADMIN_AUDIT_LOG TABLE
-- ============================================================

-- 22. Super admins can view audit logs
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Super admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = (select auth.uid())  -- ✅ Optimized
      AND is_super_admin = true
    )
  );

-- 23. Super admins can insert audit logs
DROP POLICY IF EXISTS "Super admins can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Super admins can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = (select auth.uid())  -- ✅ Optimized
      AND is_super_admin = true
    )
  );

-- ============================================================
-- SYSTEM_ANNOUNCEMENTS TABLE
-- ============================================================

-- 24. Super admins can view all announcements
DROP POLICY IF EXISTS "Super admins can view all announcements" ON public.system_announcements;
CREATE POLICY "Super admins can view all announcements"
  ON public.system_announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = (select auth.uid())  -- ✅ Optimized
      AND is_super_admin = true
    )
  );

-- 25. Super admins can insert announcements
DROP POLICY IF EXISTS "Super admins can insert announcements" ON public.system_announcements;
CREATE POLICY "Super admins can insert announcements"
  ON public.system_announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = (select auth.uid())  -- ✅ Optimized
      AND is_super_admin = true
    )
  );

-- ============================================================
-- USER_NOTIFICATIONS TABLE
-- ============================================================

-- 26. Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (user_id = (select auth.uid()));  -- ✅ Optimized

-- 27. Users can update their own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications
  FOR UPDATE
  USING (user_id = (select auth.uid()));  -- ✅ Optimized

-- ============================================================
-- SUMMARY
-- ============================================================
-- Fixed 27 RLS policies across 11 tables
-- Performance improvement: auth.uid() now evaluates once per query instead of per row
-- Expected impact: Significant query performance improvement, especially for large result sets

