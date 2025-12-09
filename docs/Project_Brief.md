# Project Brief

## Current Goal
Validate the **Invite Buyer** feature end‑to‑end. This requires:
1. A logged‑in **agent** (`Eagent_Admin@rainedrop.co.uk`) with a profile that has `role = 'agent'`.
2. Ability to create a transaction (INSERT into `public.transactions`).
3. Ability to invite a registered buyer.

## What Has Been Completed
- **Supabase security warnings** fixed for the two new SECURITY DEFINER functions (`create_profile_for_current_user` and `get_user_transaction_ids`).
- **Performance warning** on `profiles` INSERT policy resolved by using `(select auth.uid())`.
- **AuthContext** now auto‑creates a profile when the fetch returns `PGRST116`.
- Added **debug scripts** to verify RLS policies and the `current_user_is_agent()` function.
- Created migration `20251121_fix_transactions_insert_policy.sql` that:
  - Defines `current_user_is_agent()` (SECURITY DEFINER).
  - Grants EXECUTE to both `authenticated` and `anon`.
  - Updates the INSERT policy on `public.transactions` to use this function and explicitly applies to `authenticated`.
- Playwright test updated with longer waits and profile‑creation fallback.

## Remaining Blocker
- **RLS INSERT on `transactions` still failing** with *"new row violates row-level security policy for table \"transactions\""* even after applying the migration, running the helper SQL, and granting privileges. The authenticated request hits Supabase with the correct bearer token, but the triggered insert into `transaction_participants` still breaks under RLS (the helper is SECURITY DEFINER but the policy continues to reject the trigger).
- Supabase’s API logs show the request being executed as `authenticated` and the `created_by` payload matches the agent, so the failure is happening when the trigger attempts to insert participant rows under the same transaction. Related UI fetches attempt to query `transaction_participants` with `transaction_id=undefined`, producing a 22P02 error.

## Next Steps
1. Inspect the `transaction_participants` INSERT policy/log to identify why the trigger insert is rejected even though the helper returns `true`.
2. Consider wrapping the trigger’s insert policy in a SECURITY DEFINER helper (similar to `current_user_is_agent()`) so the triggered insert can pass RLS.
3. Fix the `transaction_participants` query that fires before the transaction page has a valid ID so PostgREST stops returning 400/22P02.
4. Once the trigger/policy path is confirmed, re-enable RLS on both tables and rerun the `/transactions/create` flow to verify the insert succeeds.
5. With RLS stable, re-run the invite-buyer Playwright spec to confirm the full journey passes.

---
*All changes are tracked in the `supabase/migrations` folder and the Playwright test file `tests/e2e/invite-buyer.spec.ts`.*
