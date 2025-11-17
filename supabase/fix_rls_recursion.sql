-- Fix for infinite recursion in RLS policies
-- This script removes the problematic policy and adds simplified ones

-- Drop the problematic policy on profiles
DROP POLICY IF EXISTS "Users can view profiles of transaction participants" ON public.profiles;

-- Add a simpler policy: users can view any authenticated user's basic profile
-- This is safe because we're only exposing public profile info
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- If you want more restrictive access later, you can use a SECURITY DEFINER function
-- But for the MVP, allowing authenticated users to view profiles is fine
-- since profiles only contain public information (name, language, role)
