# How to Apply Migration: Fix Profiles Updated At

**Migration File:** `20251214_fix_profiles_updated_at.sql`  
**Issue:** Trigger error "record 'new' has no field 'updated_at'" when updating profiles

---

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://skvfgvlwccxetglmfhpm.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20251214_fix_profiles_updated_at.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Check the results panel for success messages

**Expected Output:**
```
✅ profiles.updated_at column and trigger are properly configured
Migration 20251214_fix_profiles_updated_at completed successfully
```

---

## Option 2: Via Node.js Script

```bash
cd estate-portal
node supabase/apply-schema.js
```

Then run the specific migration:
```sql
-- In Supabase SQL Editor, run:
\i supabase/migrations/20251214_fix_profiles_updated_at.sql
```

---

## Option 3: Via Supabase CLI

```bash
cd estate-portal

# If you have Supabase CLI installed:
supabase db push --include-all

# Or run the specific migration:
supabase db execute --file supabase/migrations/20251214_fix_profiles_updated_at.sql
```

---

## What This Migration Does

1. **Checks** if `updated_at` column exists in profiles table
2. **Adds** the column if missing (with default value)
3. **Recreates** the `handle_updated_at()` trigger function
4. **Drops and recreates** the trigger on profiles table
5. **Verifies** the setup is correct
6. **Updates** existing rows to have valid timestamps

---

## Verification

After running the migration, test the settings page:

1. Go to: http://localhost:3001/settings
2. Change the **Preferred Language** dropdown
3. Click **Save profile**
4. You should see: "Profile updated successfully! Language changes will apply to new messages."
5. No errors should appear

---

## Testing the Fix

Run this query in Supabase SQL Editor to verify:

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'updated_at';

-- Check trigger exists
SELECT tgname, tgtype, tgenabled, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'set_updated_at'
  AND tgrelid = 'public.profiles'::regclass;

-- Test an update (replace with your user ID)
UPDATE public.profiles 
SET preferred_language = 'it' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'eagent_admin@rainedrop.co.uk')
RETURNING id, preferred_language, updated_at;
```

Expected result: The update should succeed and `updated_at` should be set to the current timestamp.

---

## Troubleshooting

### Error: "column 'updated_at' already exists"
This is fine - the migration handles this case and will skip adding the column.

### Error: "trigger already exists"
The migration drops the trigger before recreating it, so this shouldn't happen.

### Settings page still shows error
1. **Clear browser cache** and refresh
2. **Check Supabase logs** for RLS policy issues
3. **Verify** the migration completed successfully
4. **Restart** the dev server: `npm run dev:3001`

---

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- This is generally NOT recommended, but if needed:
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
-- Note: Don't drop the updated_at column as it may be used elsewhere
```

---

## Related Files

- **Migration:** `supabase/migrations/20251214_fix_profiles_updated_at.sql`
- **Settings Page:** `src/app/settings/page.tsx`
- **Original Schema:** `supabase/migrations/20251117_initial_schema.sql`

---

**Status:** Ready to apply  
**Priority:** High (blocks language settings feature)  
**Risk:** Low (adds column if missing, recreates trigger)

