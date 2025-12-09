-- Fix "Auth RLS Initialization Plan" performance warnings
-- Replaces auth.uid() with (select auth.uid()) to prevent unnecessary re-evaluation

-- ============================================================================
-- PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Agents can create transactions" ON public.transactions;
CREATE POLICY "Agents can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'agent'
    )
  );

DROP POLICY IF EXISTS "Transaction creators can update their transactions" ON public.transactions;
CREATE POLICY "Transaction creators can update their transactions"
  ON public.transactions FOR UPDATE
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view transactions they participate in" ON public.transactions;
CREATE POLICY "Users can view transactions they participate in"
  ON public.transactions FOR SELECT
  USING (
    id IN (
      SELECT transaction_id FROM public.transaction_participants
      WHERE profile_id = (select auth.uid())
    )
  );

-- ============================================================================
-- TRANSACTION PARTICIPANTS
-- ============================================================================

DROP POLICY IF EXISTS "Transaction creators can add participants" ON public.transaction_participants;
CREATE POLICY "Transaction creators can add participants"
  ON public.transaction_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE id = transaction_id AND created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Transaction creators can remove participants" ON public.transaction_participants;
CREATE POLICY "Transaction creators can remove participants"
  ON public.transaction_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE id = transaction_id AND created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view participants of their transactions" ON public.transaction_participants;
CREATE POLICY "Users can view participants of their transactions"
  ON public.transaction_participants FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id FROM public.transaction_participants
      WHERE profile_id = (select auth.uid())
    )
  );

-- ============================================================================
-- MILESTONES
-- ============================================================================

DROP POLICY IF EXISTS "Agents can create milestones for their transactions" ON public.milestones;
CREATE POLICY "Agents can create milestones for their transactions"
  ON public.milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE id = transaction_id AND created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Agents can update milestones of their transactions" ON public.milestones;
CREATE POLICY "Agents can update milestones of their transactions"
  ON public.milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE id = transaction_id AND created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view milestones of their transactions" ON public.milestones;
CREATE POLICY "Users can view milestones of their transactions"
  ON public.milestones FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id FROM public.transaction_participants
      WHERE profile_id = (select auth.uid())
    )
  );

-- ============================================================================
-- MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Participants can send messages in their transactions" ON public.messages;
CREATE POLICY "Participants can send messages in their transactions"
  ON public.messages FOR INSERT
  WITH CHECK (
    transaction_id IN (
      SELECT transaction_id FROM public.transaction_participants
      WHERE profile_id = (select auth.uid())
    )
    AND author_profile_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can view messages in their transactions" ON public.messages;
CREATE POLICY "Users can view messages in their transactions"
  ON public.messages FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id FROM public.transaction_participants
      WHERE profile_id = (select auth.uid())
    )
  );

-- ============================================================================
-- FILES
-- ============================================================================

DROP POLICY IF EXISTS "Participants can upload files to their transactions" ON public.files;
CREATE POLICY "Participants can upload files to their transactions"
  ON public.files FOR INSERT
  WITH CHECK (
    transaction_id IN (
      SELECT transaction_id FROM public.transaction_participants
      WHERE profile_id = (select auth.uid())
    )
    AND uploaded_by_profile_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Uploaders can delete their own files" ON public.files;
CREATE POLICY "Uploaders can delete their own files"
  ON public.files FOR DELETE
  USING (uploaded_by_profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view files in their transactions" ON public.files;
CREATE POLICY "Users can view files in their transactions"
  ON public.files FOR SELECT
  USING (
    transaction_id IN (
      SELECT transaction_id FROM public.transaction_participants
      WHERE profile_id = (select auth.uid())
    )
  );
