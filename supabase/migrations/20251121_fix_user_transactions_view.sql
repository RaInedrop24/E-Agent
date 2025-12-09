-- Fix security issue with user_transactions view
-- Original view was created without security_invoker=true, which defaults to the owner's permissions (SECURITY DEFINER behavior for views in some contexts)
-- We want it to respect RLS policies of the underlying tables (SECURITY INVOKER)

DROP VIEW IF EXISTS public.user_transactions;

CREATE OR REPLACE VIEW public.user_transactions WITH (security_invoker = true) AS
SELECT
  t.*,
  p.full_name AS creator_name,
  (SELECT count(*) FROM public.transaction_participants WHERE transaction_id = t.id) AS participant_count,
  (SELECT count(*) FROM public.milestones WHERE transaction_id = t.id AND completed = true) AS completed_milestones,
  (SELECT count(*) FROM public.milestones WHERE transaction_id = t.id) AS total_milestones
FROM public.transactions t
JOIN public.profiles p ON p.id = t.created_by;

COMMENT ON VIEW public.user_transactions IS 'Transactions with aggregated participant and milestone data (Security Invoker)';
