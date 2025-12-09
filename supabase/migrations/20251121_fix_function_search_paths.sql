-- Fix "Function Search Path Mutable" security warnings
-- Sets a fixed search_path for SECURITY DEFINER functions to prevent search_path hijacking

ALTER FUNCTION public.handle_new_transaction() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.create_default_milestones(uuid) SET search_path = public;
ALTER FUNCTION public.add_buyer_to_transaction(uuid, text) SET search_path = public;
ALTER FUNCTION public.create_profile_for_current_user() SET search_path = public;

-- Note: "Leaked Password Protection" must be enabled in the Supabase Dashboard > Authentication > Security
