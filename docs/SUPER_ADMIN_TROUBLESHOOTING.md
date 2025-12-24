# Super Admin Troubleshooting Guide

## Problem: Super Admin Menu Item Not Appearing

If the Super Admin menu item doesn't appear in the hamburger menu after setting `is_super_admin = true`, follow this systematic troubleshooting guide.

## Quick Diagnosis

### Step 1: Access the Debug Page

1. Log in to your production site as the super admin user
2. Navigate to: `/debug/super-admin`
3. This page will show you exactly what's wrong

The debug page checks:
- ✅ Is the `is_super_admin` column present?
- ✅ Does the `current_user_is_super_admin()` function exist?
- ✅ What does your profile show in the database?
- ✅ What does the RPC function return?

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to the Console tab
3. Look for `[useSuperAdmin]` log messages
4. These will tell you exactly what's happening:
   - Is the profile being fetched?
   - Does it include `is_super_admin`?
   - Is the RPC function being called?
   - What errors are occurring?

## Common Issues and Solutions

### Issue 1: Column Doesn't Exist in Production

**Symptoms:**
- Debug page shows "Column exists: ✗ NO"
- Console shows error about column not existing

**Solution:**
Run the verification script in your Supabase SQL Editor:

```bash
# In your production Supabase dashboard:
# Database > SQL Editor > New Query
# Paste and run: supabase/migrations/VERIFY_AND_FIX_SUPER_ADMIN.sql
```

This script will:
1. Add the column if missing
2. Create both RPC functions
3. Set your super admin user
4. Verify everything is working

### Issue 2: RPC Function Doesn't Exist

**Symptoms:**
- Debug page shows "Function exists: ✗ NO"
- Console shows error code `42883` (function does not exist)

**Solution:**
The `VERIFY_AND_FIX_SUPER_ADMIN.sql` script will create both required functions:
- `current_user_is_super_admin()` - Used by frontend
- `auth_user_is_super_admin()` - Used by RLS policies

### Issue 3: Profile Not Being Fetched

**Symptoms:**
- Console shows `profileIsSuperAdmin: undefined`
- Debug page shows profile from context is missing `is_super_admin`

**Possible Causes:**

#### A. Profile Query Doesn't Include the Column
Check `AuthContext.tsx` line 111-115. It should use `.select('*')` which gets all columns.

#### B. RLS Policy Blocking the Column
The profile RLS policy might be preventing the column from being read.

**Solution:**
Run this in Supabase SQL Editor:

```sql
-- Check current profile policy
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE '%view%';

-- If needed, recreate the policy
DROP POLICY IF EXISTS "Users can view their own profile or super admin can view all" ON public.profiles;

CREATE POLICY "Users can view their own profile or super admin can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can see their own profile
  id = auth.uid()
  OR
  -- Super admin can see all profiles
  auth_user_is_super_admin() = true
);
```

### Issue 4: User Set in Wrong Database

**Symptoms:**
- Everything works locally
- Nothing works in production
- Debug page shows no super admin users

**Solution:**
You might have set the super admin flag in your local database but not in production.

1. Go to your **PRODUCTION** Supabase dashboard
2. Database > SQL Editor
3. Run:

```sql
-- Check which database you're in
SELECT current_database();

-- Set super admin in THIS database
UPDATE public.profiles
SET is_super_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'superadmin@rainedrop.co.uk'
);

-- Verify it worked
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.is_super_admin
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'superadmin@rainedrop.co.uk';
```

### Issue 5: Caching Issues

**Symptoms:**
- Database shows `is_super_admin = true`
- RPC function returns `true`
- But menu still doesn't appear

**Solution:**

1. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear all site data in DevTools

2. **Force profile refresh:**
   - Log out completely
   - Close all browser tabs
   - Clear cookies for your site
   - Log back in

3. **Check if old session is cached:**
   ```javascript
   // In browser console:
   localStorage.clear();
   sessionStorage.clear();
   // Then refresh page
   ```

### Issue 6: Environment Variables Not Set

**Symptoms:**
- Console shows "Supabase client not configured"
- Debug page shows "Configured: No"

**Solution:**

Check your production environment variables:

```bash
# On your production server:
cd /var/www/thepropertygateway.com/E-Agent

# Check if .env.local or .env.production exists
ls -la | grep env

# Verify variables are set
cat .env.local  # or .env.production

# Should contain:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

If missing, create the file and restart PM2:

```bash
# Create env file
nano .env.local
# Add your variables, save

# Rebuild and restart
npm run build
pm2 restart thepropertygateway
pm2 logs thepropertygateway
```

## Verification Checklist

Run through this checklist to confirm everything is working:

### Database Level
- [ ] Column `is_super_admin` exists in `public.profiles`
- [ ] Function `current_user_is_super_admin()` exists
- [ ] Function `auth_user_is_super_admin()` exists
- [ ] Your user has `is_super_admin = true` in the profiles table
- [ ] RLS policies include super admin checks

### Application Level
- [ ] Environment variables are set in production
- [ ] Application can connect to Supabase
- [ ] AuthContext fetches profile with all fields
- [ ] useSuperAdmin hook is being called
- [ ] Console logs show super admin status

### UI Level
- [ ] HamburgerMenu component includes super admin check
- [ ] Menu item appears when `isSuperAdmin` is true
- [ ] Can access `/admin/dashboard` route
- [ ] Middleware allows access to admin routes

## Testing the Fix

After applying fixes:

1. **Test in SQL Editor:**
   ```sql
   -- As super admin user, this should return true
   SELECT public.current_user_is_super_admin();
   ```

2. **Test in Browser Console:**
   ```javascript
   // After logging in, check:
   const { data } = await supabase.rpc('current_user_is_super_admin');
   console.log('Am I super admin?', data);
   ```

3. **Test in UI:**
   - Log out and log back in
   - Open hamburger menu
   - Look for "Super Admin Dashboard" menu item with shield icon
   - Click it and verify you can access `/admin/dashboard`

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Collect diagnostic information:**
   - Screenshot of `/debug/super-admin` page
   - Browser console logs (filter by "useSuperAdmin")
   - Result of SQL query: `SELECT * FROM profiles WHERE is_super_admin = true`
   - Result of: `SELECT public.current_user_is_super_admin()`

2. **Check the order of migrations:**
   Migrations must be run in this order:
   1. `20251223_add_super_admin_role.sql` - Adds column and function
   2. `20251223_add_admin_audit_log.sql` - Creates audit table
   3. `20251223_update_rls_for_super_admin.sql` - Updates RLS policies
   4. `20251223_fix_rls_infinite_recursion.sql` - Fixes RLS recursion issue

3. **Nuclear option - Reapply all migrations:**
   ```sql
   -- Run VERIFY_AND_FIX_SUPER_ADMIN.sql
   -- This will recreate everything from scratch
   ```

## Prevention

To avoid this issue in the future:

1. **Always test migrations locally first**
2. **Apply migrations to production immediately after local testing**
3. **Keep a checklist of migrations applied to each environment**
4. **Use Supabase CLI to manage migrations:**
   ```bash
   # Link to production
   supabase link --project-ref your-prod-ref
   
   # Push migrations
   supabase db push
   ```

## Related Files

- `/src/hooks/useSuperAdmin.ts` - Hook that checks super admin status
- `/src/components/layout/HamburgerMenu.tsx` - Menu that shows/hides admin item
- `/src/contexts/AuthContext.tsx` - Fetches profile from database
- `/supabase/migrations/20251223_add_super_admin_role.sql` - Adds column and function
- `/supabase/migrations/20251223_fix_rls_infinite_recursion.sql` - Fixes RLS issues
- `/supabase/migrations/VERIFY_AND_FIX_SUPER_ADMIN.sql` - All-in-one fix script

