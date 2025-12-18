-- Migration: Seed Default Template for All Agents
-- Created: 2025-12-18
-- Description: Creates a "Default Italian Property Purchase" template for all existing agents

-- ============================================================================
-- SEED DEFAULT TEMPLATE
-- ============================================================================

DO $$
DECLARE
  v_agent_record RECORD;
  v_template_id uuid;
BEGIN
  -- Loop through all agents
  FOR v_agent_record IN
    SELECT id FROM public.profiles WHERE role = 'agent'
  LOOP
    -- Check if this agent already has a template with this name
    IF NOT EXISTS (
      SELECT 1 FROM public.milestone_templates
      WHERE agent_id = v_agent_record.id
      AND template_name = 'Default Italian Property Purchase'
    ) THEN
      -- Create the default template for this agent
      INSERT INTO public.milestone_templates (
        agent_id,
        template_name,
        description,
        created_at,
        updated_at
      )
      VALUES (
        v_agent_record.id,
        'Default Italian Property Purchase',
        'Standard milestone set for Italian property purchases. This is the same set of milestones automatically created with new transactions.',
        now(),
        now()
      )
      RETURNING id INTO v_template_id;

      -- Insert the 5 default milestone items
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
      VALUES
        (v_template_id, 0, 'OFFER_ACCEPTED', 'Offer Accepted', 'Offerta Accettata', 'Angebot Angenommen', 'Offre Acceptée', 'Oferta Aceptada'),
        (v_template_id, 1, 'PRELIM_CONTRACT', 'Preliminary Contract Signed', 'Compromesso Firmato', 'Vorvertrag Unterzeichnet', 'Contrat Préliminaire Signé', 'Contrato Preliminar Firmado'),
        (v_template_id, 2, 'DEPOSIT_PAID', 'Deposit Paid', 'Caparra Versata', 'Anzahlung Geleistet', 'Dépôt Payé', 'Depósito Pagado'),
        (v_template_id, 3, 'SURVEY_COMPLETE', 'Survey Complete', 'Perizia Completata', 'Gutachten Abgeschlossen', 'Expertise Complétée', 'Inspección Completa'),
        (v_template_id, 4, 'FINAL_DEED', 'Final Deed (Rogito)', 'Rogito Finale', 'Notarielle Beurkundung', 'Acte Définitif (Rogito)', 'Escritura Final (Rogito)');

      RAISE NOTICE 'Created default template for agent %', v_agent_record.id;
    ELSE
      RAISE NOTICE 'Agent % already has default template, skipping', v_agent_record.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Default template seeding completed successfully';
END;
$$;

-- ============================================================================
-- HELPER FUNCTION (Optional)
-- ============================================================================
-- Create a function that can be called to seed the default template for new agents
-- This can be used in your application when a new agent signs up

CREATE OR REPLACE FUNCTION public.create_default_template_for_agent(p_agent_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  -- Verify user is an agent
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_agent_id AND role = 'agent'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is not an agent'
    );
  END IF;

  -- Check if template already exists
  IF EXISTS (
    SELECT 1 FROM public.milestone_templates
    WHERE agent_id = p_agent_id
    AND template_name = 'Default Italian Property Purchase'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Default template already exists for this agent'
    );
  END IF;

  -- Create the default template
  INSERT INTO public.milestone_templates (
    agent_id,
    template_name,
    description,
    created_at,
    updated_at
  )
  VALUES (
    p_agent_id,
    'Default Italian Property Purchase',
    'Standard milestone set for Italian property purchases. This is the same set of milestones automatically created with new transactions.',
    now(),
    now()
  )
  RETURNING id INTO v_template_id;

  -- Insert the 5 default milestone items
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
  VALUES
    (v_template_id, 0, 'OFFER_ACCEPTED', 'Offer Accepted', 'Offerta Accettata', 'Angebot Angenommen', 'Offre Acceptée', 'Oferta Aceptada'),
    (v_template_id, 1, 'PRELIM_CONTRACT', 'Preliminary Contract Signed', 'Compromesso Firmato', 'Vorvertrag Unterzeichnet', 'Contrat Préliminaire Signé', 'Contrato Preliminar Firmado'),
    (v_template_id, 2, 'DEPOSIT_PAID', 'Deposit Paid', 'Caparra Versata', 'Anzahlung Geleistet', 'Dépôt Payé', 'Depósito Pagado'),
    (v_template_id, 3, 'SURVEY_COMPLETE', 'Survey Complete', 'Perizia Completata', 'Gutachten Abgeschlossen', 'Expertise Complétée', 'Inspección Completa'),
    (v_template_id, 4, 'FINAL_DEED', 'Final Deed (Rogito)', 'Rogito Finale', 'Notarielle Beurkundung', 'Acte Définitif (Rogito)', 'Escritura Final (Rogito)');

  RETURN json_build_object(
    'success', true,
    'template_id', v_template_id,
    'message', 'Default template created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_template_for_agent TO authenticated;

COMMENT ON FUNCTION public.create_default_template_for_agent IS
  'Creates the default Italian property purchase template for a new agent. Can be called during agent onboarding.';

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Default template migration completed successfully!';
  RAISE NOTICE 'All existing agents now have the "Default Italian Property Purchase" template';
  RAISE NOTICE 'Future agents can use: SELECT create_default_template_for_agent(agent_id)';
END;
$$;
