-- Fix "Auth RLS Initialization Plan" performance warning
-- Optimizes the "Users can insert their own profile" policy by wrapping auth.uid() in a subquery
-- This prevents unnecessary re-evaluation for each row

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);
