-- Migration: Add Milestone Templates Feature
-- Created: 2025-12-18
-- Description: Adds tables and functions for reusable milestone templates

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: milestone_templates
-- Stores template metadata (agent-specific)
CREATE TABLE IF NOT EXISTS public.milestone_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT milestone_templates_name_agent_unique UNIQUE (agent_id, template_name)
);

CREATE INDEX idx_milestone_templates_agent ON public.milestone_templates(agent_id);

COMMENT ON TABLE public.milestone_templates IS
  'Reusable milestone templates created by agents';
COMMENT ON COLUMN public.milestone_templates.agent_id IS
  'Agent who created this template (templates are agent-specific)';
COMMENT ON COLUMN public.milestone_templates.template_name IS
  'User-defined name for the template';

-- Table: milestone_template_items
-- Stores individual milestones within a template
CREATE TABLE IF NOT EXISTS public.milestone_template_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES public.milestone_templates(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  code text NOT NULL,
  label_en text NOT NULL,
  label_it text,
  label_de text,
  label_fr text,
  label_es text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT milestone_template_items_template_order_unique UNIQUE (template_id, order_index)
);

CREATE INDEX idx_milestone_template_items_template ON public.milestone_template_items(template_id);
CREATE INDEX idx_milestone_template_items_order ON public.milestone_template_items(template_id, order_index);

COMMENT ON TABLE public.milestone_template_items IS
  'Individual milestone definitions within a template';
COMMENT ON COLUMN public.milestone_template_items.order_index IS
  'Display order of this milestone in the template';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_milestone_templates_updated_at
  BEFORE UPDATE ON public.milestone_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.milestone_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_template_items ENABLE ROW LEVEL SECURITY;

-- Templates: Agents can only see their own templates
CREATE POLICY "Agents can view their own templates"
  ON public.milestone_templates FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can create templates"
  ON public.milestone_templates FOR INSERT
  WITH CHECK (
    agent_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  );

CREATE POLICY "Agents can update their own templates"
  ON public.milestone_templates FOR UPDATE
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete their own templates"
  ON public.milestone_templates FOR DELETE
  USING (agent_id = auth.uid());

-- Template Items: Accessible if parent template is accessible
CREATE POLICY "Agents can view items of their templates"
  ON public.milestone_template_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_templates
      WHERE id = template_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create items for their templates"
  ON public.milestone_template_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.milestone_templates
      WHERE id = template_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update items of their templates"
  ON public.milestone_template_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_templates
      WHERE id = template_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can delete items of their templates"
  ON public.milestone_template_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.milestone_templates
      WHERE id = template_id AND agent_id = auth.uid()
    )
  );

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function: save_milestone_template
-- Saves current milestones as a new template
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

  -- Insert milestone items
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
      label_es
    )
    VALUES (
      v_template_id,
      v_index,
      v_milestone->>'code',
      v_milestone->>'label_en',
      v_milestone->>'label_it',
      v_milestone->>'label_de',
      v_milestone->>'label_fr',
      v_milestone->>'label_es'
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

GRANT EXECUTE ON FUNCTION public.save_milestone_template TO authenticated;

COMMENT ON FUNCTION public.save_milestone_template IS
  'Saves a set of milestones as a reusable template. Agent-specific.';

-- Function: get_milestone_templates
-- Retrieves all templates for current agent
CREATE OR REPLACE FUNCTION public.get_milestone_templates()
RETURNS TABLE (
  id uuid,
  template_name text,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  milestone_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mt.id,
    mt.template_name,
    mt.description,
    mt.created_at,
    mt.updated_at,
    COUNT(mti.id) as milestone_count
  FROM public.milestone_templates mt
  LEFT JOIN public.milestone_template_items mti ON mti.template_id = mt.id
  WHERE mt.agent_id = auth.uid()
  GROUP BY mt.id, mt.template_name, mt.description, mt.created_at, mt.updated_at
  ORDER BY mt.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_milestone_templates TO authenticated;

COMMENT ON FUNCTION public.get_milestone_templates IS
  'Retrieves all milestone templates for the current agent';

-- Function: get_milestone_template_items
-- Retrieves all items for a specific template
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
  -- Verify template belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates
    WHERE id = p_template_id AND agent_id = auth.uid()
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

-- Function: delete_milestone_template
-- Deletes a template (cascade deletes items automatically)
CREATE OR REPLACE FUNCTION public.delete_milestone_template(p_template_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify template belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates
    WHERE id = p_template_id AND agent_id = auth.uid()
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

-- Function: apply_milestone_template
-- Replaces all milestones in a transaction with template milestones
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
