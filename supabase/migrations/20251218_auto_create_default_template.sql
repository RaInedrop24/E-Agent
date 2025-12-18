-- Migration: Auto-Create Default Template for New Agents
-- Created: 2025-12-18
-- Description: Updates the handle_new_user trigger to automatically create default template for agents

-- ============================================================================
-- UPDATE HANDLE_NEW_USER FUNCTION
-- ============================================================================

-- Replace the handle_new_user function to create default template for new agents
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_template_id uuid;
BEGIN
  -- Get the role from metadata
  v_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, preferred_language, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'en'),
    v_role
  );

  -- If the new user is an agent, create the default template
  -- We do this in a BEGIN...EXCEPTION block so that if it fails, user creation still succeeds
  IF v_role = 'agent' THEN
    BEGIN
      -- Create the default template
      INSERT INTO public.milestone_templates (
        agent_id,
        template_name,
        description,
        created_at,
        updated_at
      )
      VALUES (
        new.id,
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

      RAISE NOTICE 'Created default template for new agent %', new.id;

    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail user creation
      RAISE WARNING 'Failed to create default template for agent %: %', new.id, SQLERRM;
    END;
  END IF;

  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Creates user profile on signup. For agents, also creates a default milestone template.';

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Auto-create default template migration completed!';
  RAISE NOTICE 'New agents will automatically receive the default template upon registration';
END;
$$;
