-- Migration: Fix Ambiguous Column References in Milestone Template RLS Policies
-- Created: 2025-12-18
-- Description: Fixes "column reference 'id' is ambiguous" error in template item policies

-- ============================================================================
-- DROP AND RECREATE RLS POLICIES WITH PROPER TABLE QUALIFICATION
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Agents can view items of their templates" ON public.milestone_template_items;
DROP POLICY IF EXISTS "Agents can create items for their templates" ON public.milestone_template_items;
DROP POLICY IF EXISTS "Agents can update items of their templates" ON public.milestone_template_items;
DROP POLICY IF EXISTS "Agents can delete items of their templates" ON public.milestone_template_items;

-- Recreate policies with properly qualified column names
-- Template Items: Accessible if parent template is accessible
CREATE POLICY "Agents can view items of their templates"
  ON public.milestone_template_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_templates mt
      WHERE mt.id = milestone_template_items.template_id
        AND mt.agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create items for their templates"
  ON public.milestone_template_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.milestone_templates mt
      WHERE mt.id = milestone_template_items.template_id
        AND mt.agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update items of their templates"
  ON public.milestone_template_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_templates mt
      WHERE mt.id = milestone_template_items.template_id
        AND mt.agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can delete items of their templates"
  ON public.milestone_template_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_templates mt
      WHERE mt.id = milestone_template_items.template_id
        AND mt.agent_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Template RLS policies fixed successfully!';
  RAISE NOTICE 'Ambiguous column references have been resolved with proper table qualification';
END;
$$;
