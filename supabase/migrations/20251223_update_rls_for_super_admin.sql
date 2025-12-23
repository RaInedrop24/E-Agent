-- Update RLS policies to allow super admins to see all data

-- Transactions: Super admins can see all transactions
DROP POLICY IF EXISTS "Users can view transactions they participate in" ON public.transactions;
CREATE POLICY "Users can view transactions they participate in or super admin"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
  OR
  -- Creator can see
  created_by = auth.uid()
  OR
  -- Participants can see
  EXISTS (
    SELECT 1 FROM public.transaction_participants
    WHERE transaction_participants.transaction_id = transactions.id
    AND transaction_participants.profile_id = auth.uid()
  )
);

-- Milestones: Super admins can see all milestones
DROP POLICY IF EXISTS "Users can view milestones for their transactions" ON public.milestones;
CREATE POLICY "Users can view milestones for their transactions or super admin"
ON public.milestones
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
  OR
  -- Check if user is transaction creator or participant
  EXISTS (
    SELECT 1 FROM public.transactions t
    LEFT JOIN public.transaction_participants tp ON tp.transaction_id = t.id
    WHERE t.id = milestones.transaction_id
    AND (t.created_by = auth.uid() OR tp.profile_id = auth.uid())
  )
);

-- Messages: Super admins can see all messages
DROP POLICY IF EXISTS "Users can view messages in their transactions" ON public.messages;
CREATE POLICY "Users can view messages in their transactions or super admin"
ON public.messages
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
  OR
  -- Check if user is transaction creator or participant
  EXISTS (
    SELECT 1 FROM public.transactions t
    LEFT JOIN public.transaction_participants tp ON tp.transaction_id = t.id
    WHERE t.id = messages.transaction_id
    AND (t.created_by = auth.uid() OR tp.profile_id = auth.uid())
  )
);

-- Files: Super admins can see all files
DROP POLICY IF EXISTS "Users can view files in their transactions" ON public.files;
CREATE POLICY "Users can view files in their transactions or super admin"
ON public.files
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
  OR
  -- Check if user is transaction creator or participant
  EXISTS (
    SELECT 1 FROM public.transactions t
    LEFT JOIN public.transaction_participants tp ON tp.transaction_id = t.id
    WHERE t.id = files.transaction_id
    AND (t.created_by = auth.uid() OR tp.profile_id = auth.uid())
  )
);

-- Profiles: Super admins can see all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or super admin can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid()
    AND p2.is_super_admin = true
  )
  OR
  -- User can see their own profile
  id = auth.uid()
);
