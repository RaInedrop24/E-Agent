-- Add super admin access to milestone templates
-- Super admins should be able to view all templates and items

-- Drop existing policies and recreate with super admin support
DROP POLICY IF EXISTS "Agents can view their own templates" ON public.milestone_templates;
DROP POLICY IF EXISTS "Agents can view items of their templates" ON public.milestone_template_items;

-- Templates: Agents can see their own, super admins can see all
CREATE POLICY "Agents can view their own templates or super admin can view all"
  ON public.milestone_templates FOR SELECT
  USING (
    agent_id = auth.uid()
    OR
    auth_user_is_super_admin() = true
  );

-- Template Items: Agents can see items of their templates, super admins can see all
CREATE POLICY "Agents can view items of their templates or super admin can view all"
  ON public.milestone_template_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_templates
      WHERE id = template_id AND agent_id = auth.uid()
    )
    OR
    auth_user_is_super_admin() = true
  );

