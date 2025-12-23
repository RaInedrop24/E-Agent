# RLS Infinite Recursion Fix

## Problem

After implementing super admin RLS policies, users could not log in. The error was:

```
[AuthContext] Error message: "infinite recursion detected in policy for relation \"profiles\""
[AuthContext] Error code: "42P17"
```

## Root Cause

The RLS policy for the `profiles` table was checking if the current user is a super admin by querying the `profiles` table:

```sql
CREATE POLICY "Users can view their own profile or super admin can view all"
ON public.profiles
USING (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid()
    AND p2.is_super_admin = true  -- This queries profiles table again!
  )
);
```

This created infinite recursion:
1. User tries to fetch their profile
2. RLS policy checks if user is super admin
3. To check super admin status, it queries profiles table
4. That query triggers the same RLS policy
5. Go to step 2 (infinite loop)

## Solution

Created a new function `auth_user_is_super_admin()` that:
- Uses `SECURITY DEFINER` to run with elevated privileges
- Temporarily disables RLS using `set_config('row_security', 'off', true)`
- Queries the profiles table without triggering RLS
- Re-enables RLS before returning

This breaks the recursion cycle because the function bypasses RLS entirely.

## Migration Applied

Run this migration to fix the issue:

**File**: `20251223_fix_rls_infinite_recursion.sql`

This migration:
1. Creates `auth_user_is_super_admin()` function that bypasses RLS
2. Updates all RLS policies to use this function instead of subqueries
3. Fixes policies on: profiles, transactions, milestones, messages, files

## Testing

After applying the migration:

1. **Existing users can log in** ✅
   - Agents and buyers can log in normally
   - Profile queries work without errors

2. **Super admins have elevated access** ✅
   - Can see all transactions
   - Can see all profiles
   - Can see all messages/files

3. **Non-super-admins have normal access** ✅
   - Can only see their own profile
   - Can only see their transactions
   - RLS works as expected

## Future Prevention

When creating RLS policies that need to check user attributes:
- **DON'T** use subqueries that query the same table
- **DO** create SECURITY DEFINER functions that bypass RLS
- **DO** disable RLS temporarily within those functions
- **DO** ensure RLS is re-enabled (use exception handling)

## Files Modified

- `supabase/migrations/20251223_fix_rls_infinite_recursion.sql` (NEW)
- All RLS policies on: profiles, transactions, milestones, messages, files
