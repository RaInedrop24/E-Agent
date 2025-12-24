-- Fix save_milestone_template function to include Polish language support
-- The function was missing label_pl in the INSERT statement

CREATE OR REPLACE FUNCTION public.save_milestone_template(
  p_template_name text,
  p_description text,
  p_milestones jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id uuid;
  v_agent_role text;
  v_template_id uuid;
  v_milestone jsonb;
  v_index int := 0;
BEGIN
  -- Get current user
  v_agent_id := auth.uid();

  -- Validate user is an agent
  SELECT role INTO v_agent_role
  FROM public.profiles
  WHERE id = v_agent_id;

  IF v_agent_role IS NULL OR v_agent_role != 'agent' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only agents can create milestone templates'
    );
  END IF;

  -- Validate template name
  IF p_template_name IS NULL OR trim(p_template_name) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Template name is required'
    );
  END IF;

  -- Check if template name already exists for this agent
  IF EXISTS (
    SELECT 1 FROM public.milestone_templates
    WHERE agent_id = v_agent_id AND template_name = p_template_name
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'A template with this name already exists'
    );
  END IF;

  -- Create template
  INSERT INTO public.milestone_templates (agent_id, template_name, description)
  VALUES (v_agent_id, p_template_name, p_description)
  RETURNING id INTO v_template_id;

  -- Insert milestone items (NOW INCLUDING label_pl)
  FOR v_milestone IN SELECT * FROM jsonb_array_elements(p_milestones)
  LOOP
    INSERT INTO public.milestone_template_items (
      template_id,
      order_index,
      code,
      label_en,
      label_it,
      label_de,
      label_fr,
      label_es,
      label_pl
    )
    VALUES (
      v_template_id,
      v_index,
      v_milestone->>'code',
      v_milestone->>'label_en',
      v_milestone->>'label_it',
      v_milestone->>'label_de',
      v_milestone->>'label_fr',
      v_milestone->>'label_es',
      v_milestone->>'label_pl'
    );

    v_index := v_index + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'template_id', v_template_id,
    'message', 'Template saved successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

COMMENT ON FUNCTION public.save_milestone_template IS
  'Saves a set of milestones as a reusable template. Agent-specific. Now includes Polish language support.';

-- ============================================================================
-- Fix apply_milestone_template function to include Polish language support
-- ============================================================================

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

  -- Verify template belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates
    WHERE id = p_template_id AND agent_id = v_agent_id
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

  -- Insert milestones from template (NOW INCLUDING label_pl)
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
      label_pl,
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
      v_milestone.label_pl,
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

COMMENT ON FUNCTION public.apply_milestone_template IS
  'Replaces all milestones in a transaction with milestones from a template. Now includes Polish language support.';

-- ============================================================================
-- Fix get_milestone_template_items function to include Polish language support
-- ============================================================================

-- Drop the existing function first (required when changing return type)
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
  label_es text,
  label_pl text
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
    mti.label_es,
    mti.label_pl
  FROM public.milestone_template_items mti
  WHERE mti.template_id = p_template_id
  ORDER BY mti.order_index;
END;
$$;

COMMENT ON FUNCTION public.get_milestone_template_items IS
  'Retrieves all milestone template items for a template. Now includes Polish language support.';

