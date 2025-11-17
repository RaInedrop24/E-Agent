# Supabase Database Setup

This directory contains the database schema and migration files for the Estate Portal.

## Quick Setup

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://skvfgvlwccxetglmfhpm.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `migrations/20251117_initial_schema.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify success messages in the results panel

### Option 2: Via Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref skvfgvlwccxetglmfhpm

# Apply migration
supabase db push
```

### Option 3: Via Node.js Script

```bash
# From estate-portal directory
node supabase/apply-schema.js
```

## What Gets Created

### Tables
1. **profiles** - User profiles (extends auth.users)
2. **transactions** - Property transactions
3. **transaction_participants** - Many-to-many relationship (users ↔ transactions)
4. **milestones** - Progress tracking milestones
5. **messages** - Transaction messaging
6. **files** - Document attachments

### Security (RLS Policies)
- ✅ Row Level Security enabled on all tables
- ✅ Users can only see their own profile
- ✅ Users can only access transactions they're invited to
- ✅ Agents can create transactions and manage milestones
- ✅ All participants can send messages and upload files

### Triggers
- ✅ Auto-create profile when user signs up
- ✅ Auto-add transaction creator as participant
- ✅ Auto-update `updated_at` timestamps

### Functions
- `create_default_milestones(transaction_id)` - Creates 5 standard Italian property purchase milestones

## Storage Buckets

After applying the schema, create these storage buckets manually:

### 1. Avatars Bucket
- **Name:** `avatars`
- **Public:** Yes
- **File size limit:** 2MB
- **Allowed MIME types:** image/jpeg, image/png, image/webp

**Policies:**
```sql
-- Allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
create policy "Avatar images are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Allow users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 2. Transaction Files Bucket
- **Name:** `transaction_files`
- **Public:** No
- **File size limit:** 10MB
- **Allowed MIME types:** image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*

**Policies:**
```sql
-- Allow participants to upload files to their transactions
create policy "Participants can upload transaction files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'transaction_files' and
  (storage.foldername(name))[1]::uuid in (
    select transaction_id::text from public.transaction_participants
    where profile_id = auth.uid()
  )
);

-- Allow participants to view files in their transactions
create policy "Participants can view transaction files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'transaction_files' and
  (storage.foldername(name))[1]::uuid in (
    select transaction_id::text from public.transaction_participants
    where profile_id = auth.uid()
  )
);

-- Allow uploaders to delete their files
create policy "Uploaders can delete their files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'transaction_files' and
  owner = auth.uid()
);
```

## Seeding Test Data

After schema is applied, you can seed test data:

```bash
node supabase/seed-test-data.js
```

This will create:
- 1 test agent user
- 1 test buyer user
- 2 test transactions with milestones

## Verification

To verify the schema was applied correctly:

```sql
-- Check tables exist
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;

-- Check RLS is enabled
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';

-- Check policies exist
select tablename, policyname
from pg_policies
where schemaname = 'public';
```

## Troubleshooting

### Error: "relation already exists"
- The schema has already been applied. Check existing tables before rerunning.

### Error: "permission denied"
- Ensure you're running the SQL as a superuser or service role.
- In Supabase Dashboard SQL Editor, this should work automatically.

### RLS policies not working
- Verify RLS is enabled: `alter table public.table_name enable row level security;`
- Check policies are created: `select * from pg_policies where schemaname = 'public';`

## Schema Updates

For future schema changes, create a new migration file:
```
migrations/YYYYMMDD_description.sql
```

Always include:
- Clear comments
- Rollback instructions if applicable
- Version/date in filename
