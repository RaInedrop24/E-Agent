-- Fix transactions RLS and Trigger interaction
-- 1. Use auth.jwt() for role check to avoid potential recursion/access issues with profiles table
-- 2. Ensure trigger function is SECURITY DEFINER and has correct search_path

-- Drop existing policy
DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;

-- Create robust policy using JWT metadata first, then profiles table fallback
CREATE POLICY "Agents can create transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'agent'
    OR
    (
      SELECT role FROM public.profiles 
      WHERE id = auth.uid()
    ) = 'agent'
  );

-- Ensure handle_new_transaction is secure and robust
CREATE OR REPLACE FUNCTION public.handle_new_transaction()
RETURNS trigger AS $$
BEGIN
  -- Insert into transaction_participants
  -- ON CONFLICT DO NOTHING ensures idempotency if trigger fires multiple times
  INSERT INTO public.transaction_participants (transaction_id, profile_id, participant_role)
  VALUES (NEW.id, NEW.created_by, 'agent')
  ON CONFLICT (transaction_id, profile_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_transaction();

