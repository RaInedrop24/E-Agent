# Buyer Creation Fix - Summary

## Problem Identified

The buyer creation was failing at the profile creation step with error: **"Database error saving new user"**

### Root Cause

The RLS (Row Level Security) policy on the `profiles` table had an INSERT policy that required:
```sql
with_check: "(auth.uid() = id)"
```

When using `supabaseAdmin` (service role key) to create profiles:
- `auth.uid()` returns `NULL` because service role has no session context
- The INSERT policy check fails even though service role should bypass RLS
- This caused profile creation to fail after the auth user was successfully created

## Solution Implemented

Created a new database function `create_profile_for_user()` that:
1. Uses `SECURITY DEFINER` to run with elevated privileges
2. Bypasses RLS policies entirely
3. Accepts user_id, full_name, role, and preferred_language as parameters
4. Returns JSON with success status and profile data

### Migration Applied

```sql
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  p_user_id uuid,
  p_full_name text,
  p_role text,
  p_preferred_language text DEFAULT 'en'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
```

### API Route Updated

Changed from direct INSERT:
```typescript
await supabaseAdmin.from('profiles').insert({...})
```

To RPC function call:
```typescript
await supabaseAdmin.rpc('create_profile_for_user', {
  p_user_id: authData.user.id,
  p_full_name: fullName,
  p_role: 'buyer',
  p_preferred_language: preferredLanguage || 'en',
})
```

## Changes Made

### Files Modified
1. `src/app/api/buyers/create/route.ts`
   - Added comprehensive error logging
   - Changed profile creation to use RPC function
   - Added validation of RPC result

### Database Changes
1. Created new migration: `create_admin_profile_creation_function`
2. Added function `create_profile_for_user` with SECURITY DEFINER

## Testing Instructions

### Prerequisites
- Production site must be rebuilt with latest code
- Database migration already applied ✅

### Manual Test Steps

1. **Login as Agent**
   - Navigate to: https://thepropertygateway.com/login
   - Use agent credentials (e.g., `eagent@rainedrop.co.uk`)

2. **Navigate to Buyers Page**
   - Go to: https://thepropertygateway.com/buyers
   - Click "Create Buyer" button

3. **Fill Create Buyer Form**
   - Email: `testbuyer${Date.now()}@example.com` (use unique email)
   - Full Name: `Test Buyer`
   - Preferred Language: Select any language (e.g., English)
   - Click "Create and Invite"

4. **Expected Behavior**
   - ✅ Form submits successfully
   - ✅ Modal closes
   - ✅ New buyer appears in the list
   - ✅ Success message shown
   - ✅ Invitation email sent to buyer

5. **Check Server Logs** (via SSH terminal)
   ```bash
   pm2 logs thepropertygateway --lines 50
   ```
   
   Look for:
   ```
   [Buyer Creation] Step 1: Inviting user via email
   [Buyer Creation] Step 2: Auth user created successfully
   [Buyer Creation] Step 3: Creating profile via RPC
   [Buyer Creation] Step 4: Profile created successfully
   [Buyer Creation] Step 5: Creating buyer-agent association
   [Buyer Creation] Step 6: Association created successfully
   ```

6. **Verify in Database**
   ```sql
   -- Check if buyer was created
   SELECT 
     u.id,
     u.email,
     p.full_name,
     p.role,
     p.preferred_language
   FROM auth.users u
   LEFT JOIN profiles p ON p.id = u.id
   WHERE u.email LIKE 'testbuyer%'
   ORDER BY u.created_at DESC
   LIMIT 5;
   
   -- Check buyer-agent association
   SELECT 
     baa.id,
     b.email as buyer_email,
     a.email as agent_email
   FROM buyer_agent_associations baa
   JOIN profiles bp ON bp.id = baa.buyer_id
   JOIN profiles ap ON ap.id = baa.agent_id
   JOIN auth.users b ON b.id = bp.id
   JOIN auth.users a ON a.id = ap.id
   ORDER BY baa.created_at DESC
   LIMIT 5;
   ```

### Automated Test (if Playwright is set up)

```bash
# Create test spec for buyer creation
npx playwright test tests/e2e/buyer-creation.spec.ts --headed
```

## Deployment Checklist

- [x] Database migration applied to production
- [x] Code committed and pushed to main branch
- [ ] Production server pulled latest code
- [ ] Production build completed (`npm run build`)
- [ ] PM2 restarted (`pm2 restart thepropertygateway`)
- [ ] Manual test completed successfully
- [ ] Error logs checked for any issues

## Rollback Plan

If issues occur:

1. **Revert API Route**
   ```bash
   git revert HEAD~1
   git push origin main
   ```

2. **Database Function** (optional - can stay, won't hurt)
   ```sql
   DROP FUNCTION IF EXISTS public.create_profile_for_user;
   ```

## Additional Notes

### Why This Fix Works

1. **SECURITY DEFINER**: Function runs with privileges of the function owner (postgres/service_role), not the caller
2. **Bypasses RLS**: Functions with SECURITY DEFINER can ignore RLS policies
3. **Explicit Validation**: Function validates role and user existence before insert
4. **Error Handling**: Returns structured JSON with success status and error details

### Alternative Approaches Considered

1. **Direct INSERT with service role** - Should work but was blocked by RLS
2. **Disable RLS temporarily** - Security risk, not recommended
3. **Modify RLS policy** - Could affect other parts of the application

### Future Improvements

1. **Add rate limiting** to prevent spam buyer creation
2. **Email validation** before sending invitation
3. **Duplicate email check** before creating auth user
4. **Audit logging** for buyer creation events
5. **Batch buyer import** functionality for agents with many clients

## Contact

If issues persist after this fix:
- Check server logs: `pm2 logs thepropertygateway`
- Check browser console for client-side errors
- Verify database migration was applied successfully
- Check Supabase dashboard for any Auth errors

---

**Fix Applied:** January 5, 2026
**Migration ID:** `create_admin_profile_creation_function`
**Commits:** 
- `fcca7e3` - Added detailed error logging
- `e6dcd62` - Fixed buyer creation using SECURITY DEFINER RPC

