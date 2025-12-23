-- Add super_admin role to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON public.profiles(is_super_admin)
WHERE is_super_admin = true;

-- Comment
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Whether user has super admin privileges for accessing all data and admin tools';

-- Create RPC function to check super admin status
CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.current_user_is_super_admin IS 'Returns true if the current authenticated user is a super admin';
