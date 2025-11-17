# Supabase Setup Checklist

## 1. Apply Database Schema ✅ (TO DO)

### Steps:
1. Open Supabase Dashboard: https://skvfgvlwccxetglmfhpm.supabase.co
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open file: `supabase/migrations/20251117_initial_schema.sql`
5. Copy entire contents and paste into SQL Editor
6. Click **RUN** (or Ctrl+Enter)
7. Verify output shows success messages

### What gets created:
- ✅ 7 tables (profiles, transactions, transaction_participants, milestones, messages, files)
- ✅ RLS policies on all tables
- ✅ Triggers for auto-profile creation and updated_at
- ✅ Helper functions (create_default_milestones)

---

## 2. Create Storage Buckets 📦 (TO DO)

### Avatars Bucket
1. Go to **Storage** in Supabase Dashboard
2. Click **Create a new bucket**
3. Settings:
   - **Name:** `avatars`
   - **Public:** ✅ Yes
   - **File size limit:** 2MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
4. Click **Create bucket**
5. Click on the `avatars` bucket
6. Go to **Policies** tab
7. Add policies from `supabase/README.md` (section: Storage Buckets > Avatars)

### Transaction Files Bucket
1. Go to **Storage** in Supabase Dashboard
2. Click **Create a new bucket**
3. Settings:
   - **Name:** `transaction_files`
   - **Public:** ❌ No (Private)
   - **File size limit:** 10MB
   - **Allowed MIME types:** `image/*, application/pdf, application/msword, application/vnd.*`
4. Click **Create bucket**
5. Click on the `transaction_files` bucket
6. Go to **Policies** tab
7. Add policies from `supabase/README.md` (section: Storage Buckets > Transaction Files)

---

## 3. Create Test Users 👥 (TO DO - Can be scripted)

Create via Authentication → Users in Dashboard, or via register page:

### Test Agent
- **Email:** agent@test.com
- **Password:** TestAgent123!
- **Metadata:**
  ```json
  {
    "full_name": "Alessandro Rossi",
    "role": "agent",
    "preferred_language": "it"
  }
  ```

### Test Buyer
- **Email:** buyer@test.com
- **Password:** TestBuyer123!
- **Metadata:**
  ```json
  {
    "full_name": "Sarah Thompson",
    "role": "buyer",
    "preferred_language": "en"
  }
  ```

---

## 4. Verify Setup ✅

Run these queries in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: files, messages, milestones, profiles, transaction_participants, transactions

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Expected: all tables should have rowsecurity = true

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Expected: multiple policies per table

-- Check triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Expected: on_auth_user_created, on_transaction_created, set_updated_at triggers

-- Check storage buckets
SELECT * FROM storage.buckets;
-- Expected: avatars, transaction_files
```

---

## 5. Test Authentication Flow 🔐

1. Start dev server: `npm run dev:3001`
2. Navigate to: http://localhost:3001/register
3. Register a new agent user
4. Verify:
   - ✅ User created in auth.users
   - ✅ Profile created in public.profiles
   - ✅ Can login and see dashboard
5. Repeat for buyer user

---

## 6. Test Transaction Creation 📋

1. Login as agent user
2. Create a new transaction
3. Verify:
   - ✅ Transaction created in public.transactions
   - ✅ Agent auto-added to transaction_participants
   - ✅ 5 default milestones created
   - ✅ Transaction visible on dashboard

---

## Status Tracking

| Task | Status | Notes |
|------|--------|-------|
| Apply database schema | ⏳ Pending | SQL file ready |
| Create avatars bucket | ⏳ Pending | Requires manual setup |
| Create transaction_files bucket | ⏳ Pending | Requires manual setup |
| Create test users | ⏳ Pending | Can use register page |
| Verify setup | ⏳ Pending | Run verification queries |
| Test auth flow | ⏳ Pending | After schema applied |
| Test transaction creation | ⏳ Pending | After all setup complete |

---

## Quick Start (After Manual Setup)

Once the schema and buckets are created:

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev:3001

# In another terminal, seed test data (optional)
node supabase/seed-test-data.js

# Open browser
open http://localhost:3001
```

---

## Troubleshooting

### Schema application fails
- Check for existing tables: `\dt` in psql or view Tables in Dashboard
- Drop existing tables if needed (BE CAREFUL!)
- Re-run the schema SQL

### RLS policies prevent access
- Verify user is authenticated: `SELECT auth.uid();` should return a UUID
- Check policy conditions match your use case
- Temporarily disable RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

### Storage policies not working
- Verify bucket exists and is properly configured
- Check policy conditions in Storage → Policies
- Test with authenticated user (not anonymous)

---

## Next Steps

After completing this checklist:
1. ✅ Schema applied and verified
2. ✅ Storage buckets configured
3. ✅ Test users created
4. ✅ Auth flow tested
5. → Begin building application features (Dashboard, Transactions, Messaging, Files)

See `docs/Project_Brief.md` for full feature roadmap.
