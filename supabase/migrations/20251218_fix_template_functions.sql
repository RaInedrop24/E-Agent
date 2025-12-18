-- Migration: Fix Ambiguous Column References in Template RPC Functions
-- Created: 2025-12-18
-- Description: Fixes "column reference 'id' is ambiguous" errors in RPC functions

-- ============================================================================
-- FIX get_milestone_template_items FUNCTION
-- ============================================================================

-- Drop and recreate with properly qualified column names
DROP FUNCTION IF EXISTS public.get_milestone_template_items(uuid);

CREATE OR REPLACE FUNCTION public.get_milestone_template_items(p_template_id uuid)
RETURNS TABLE (
  id uuid,
  order_index int,
  code text,
  label_en text,
  label_it text,
  label_de text,
  label_fr text,
  label_es text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify template belongs to current user (with properly qualified columns)
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates mt
    WHERE mt.id = p_template_id AND mt.agent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Template not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    mti.id,
    mti.order_index,
    mti.code,
    mti.label_en,
    mti.label_it,
    mti.label_de,
    mti.label_fr,
    mti.label_es
  FROM public.milestone_template_items mti
  WHERE mti.template_id = p_template_id
  ORDER BY mti.order_index ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_milestone_template_items TO authenticated;

COMMENT ON FUNCTION public.get_milestone_template_items IS
  'Retrieves all milestone items for a specific template';

-- ============================================================================
-- FIX delete_milestone_template FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.delete_milestone_template(uuid);

CREATE OR REPLACE FUNCTION public.delete_milestone_template(p_template_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify template belongs to current user (with properly qualified columns)
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates mt
    WHERE mt.id = p_template_id AND mt.agent_id = auth.uid()
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Template not found or access denied'
    );
  END IF;

  -- Delete template (cascade will delete items)
  DELETE FROM public.milestone_templates
  WHERE id = p_template_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Template deleted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_milestone_template TO authenticated;

COMMENT ON FUNCTION public.delete_milestone_template IS
  'Deletes a milestone template and all its items';

-- ============================================================================
-- FIX apply_milestone_template FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.apply_milestone_template(uuid, uuid);

CREATE OR REPLACE FUNCTION public.apply_milestone_template(
  p_transaction_id uuid,
  p_template_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id uuid;
  v_transaction_creator uuid;
  v_milestone record;
BEGIN
  v_agent_id := auth.uid();

  -- Verify template belongs to current user (with properly qualified columns)
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates mt
    WHERE mt.id = p_template_id AND mt.agent_id = v_agent_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Template not found or access denied'
    );
  END IF;

  -- Verify user is transaction creator or participant
  SELECT created_by INTO v_transaction_creator
  FROM public.transactions
  WHERE id = p_transaction_id;

  IF v_transaction_creator IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  END IF;

  IF v_transaction_creator != v_agent_id THEN
    -- Check if user is a participant
    IF NOT EXISTS (
      SELECT 1 FROM public.transaction_participants
      WHERE transaction_id = p_transaction_id
        AND profile_id = v_agent_id
        AND participant_role = 'agent'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Access denied. You must be the transaction creator or an agent participant.'
      );
    END IF;
  END IF;

  -- Delete all existing milestones for this transaction
  DELETE FROM public.milestones
  WHERE transaction_id = p_transaction_id;

  -- Insert milestones from template
  FOR v_milestone IN
    SELECT * FROM public.milestone_template_items
    WHERE template_id = p_template_id
    ORDER BY order_index
  LOOP
    INSERT INTO public.milestones (
      transaction_id,
      order_index,
      code,
      label_en,
      label_it,
      label_de,
      label_fr,
      label_es,
      completed
    )
    VALUES (
      p_transaction_id,
      v_milestone.order_index,
      v_milestone.code,
      v_milestone.label_en,
      v_milestone.label_it,
      v_milestone.label_de,
      v_milestone.label_fr,
      v_milestone.label_es,
      false
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Template applied successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_milestone_template TO authenticated;

COMMENT ON FUNCTION public.apply_milestone_template IS
  'Replaces all milestones in a transaction with milestones from a template. Deletes existing milestones first.';

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Template RPC functions fixed successfully!';
  RAISE NOTICE 'All ambiguous column references have been resolved';
END;
$$;
