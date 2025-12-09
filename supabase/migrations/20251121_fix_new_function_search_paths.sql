-- Fix "Function Search Path Mutable" security warnings for recently added functions
-- Sets a fixed search_path to prevent search_path hijacking attacks on SECURITY DEFINER functions

-- Fix create_profile_for_current_user function
ALTER FUNCTION public.create_profile_for_current_user() SET search_path = public;

-- Fix get_user_transaction_ids function
ALTER FUNCTION public.get_user_transaction_ids(uuid) SET search_path = public;

-- Note: "Leaked Password Protection" requires a Pro Plan and can be enabled in:
-- Supabase Dashboard > Authentication > Security > Password Strength
