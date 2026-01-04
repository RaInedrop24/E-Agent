# Supabase Production/Staging Migration Plan

## Overview

This document outlines the steps to migrate from a shared dev/prod Supabase instance to a dedicated production/staging setup, and prepares for future migration to a paid production instance.

## Current Situation

- **Current Setup**: Shared Supabase instance used for both development and production
- **Problem**: Email verification links point to production, causing issues during dev testing
- **Goal**: Separate staging/production Supabase instances
- **Future**: Plan for migration to paid production instance

---

## Phase 1: Set Up Staging/Production Supabase Instance

### Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Create New Project**:
   - Click "New Project"
   - Name: `estate-portal-prod` (or your preferred name)
   - Database Password: Generate and save securely
   - Region: Choose closest to your users
   - Pricing Plan: Start with Free tier (can upgrade later)

3. **Wait for Project Setup** (5-10 minutes)

### Step 2: Get Project Credentials

1. **Go to Project Settings** → **API**
2. **Copy the following**:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key (for `SUPABASE_SERVICE_ROLE_KEY`)

3. **Save these securely** - you'll need them for environment variables

---

## Phase 2: Database Schema Migration

### Step 1: Apply All Migrations to New Instance

Your migrations are in `supabase/migrations/` - apply them in order:

```bash
# Option 1: Using Supabase CLI (Recommended)
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your new project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push

# Option 2: Manual Application
# Copy SQL from each migration file and run in Supabase SQL Editor
# Run them in chronological order (by filename date)
```

**Migration Files to Apply** (in order):
- `20251117_initial_schema.sql`
- `20251120_add_buyer_invite_function.sql`
- `20251121_*` (all files)
- `20251122_*` (all files)
- `20251210_*` (all files)
- `20251211_*` (all files)
- `20251214_*` (all files)
- `20251216_*` (all files)
- `20251217_*` (all files)
- `20251218_*` (all files)
- `20251219_*` (all files)
- `20251222_*` (all files)
- `20251223_*` (all files)
- `20251224_*` (all files)
- `20251229_*` (all files)
- `20250101_*` (all files)
- `20250102_*` (all files)
- `20260102_*` (all files)
- `20260103_*` (all files)
- `20260104_*` (all files) ← **New migrations for website URL**

### Step 2: Verify Schema

Run this in Supabase SQL Editor to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `profiles`
- `transactions`
- `transaction_participants`
- `milestones`
- `messages`
- `files`
- `milestone_templates`
- `user_notifications`
- `system_announcements`
- `dashboard_preferences`
- `activity_filter_preferences`

### Step 3: Verify Functions

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

Key functions should include:
- `create_profile_for_current_user()`
- `get_user_transaction_ids()`
- `current_user_is_agent()`
- `invite_buyer_to_transaction()`
- etc.

---

## Phase 3: Environment Variables Configuration

### Step 1: Update Production Environment Variables

**For Vercel/Production Hosting:**

1. Go to your hosting platform (Vercel, etc.)
2. Navigate to Project Settings → Environment Variables
3. **Update or Add**:

```bash
# Production Supabase (NEW)
NEXT_PUBLIC_SUPABASE_URL=https://your-new-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key

# Keep existing (if still needed)
DEEPL_API_KEY=your-deepl-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

4. **Redeploy** the application after updating environment variables

### Step 2: Update Local Development Environment

**Keep using your existing dev Supabase** in `.env.local`:

```bash
# Development Supabase (EXISTING - keep for dev)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# Other keys
DEEPL_API_KEY=your-deepl-key
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### Step 3: Create Environment Variable Reference

Create `.env.production.example` in your repo (without actual values):

```bash
# Production Environment Variables Template
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPL_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

---

## Phase 4: Data Migration (If Needed)

### Option A: Fresh Start (Recommended for Staging)

If this is a staging environment, start fresh:
- No data migration needed
- Test with new registrations

### Option B: Migrate Existing Data

If you need to migrate existing production data:

1. **Export from Old Instance**:
   ```sql
   -- Export each table
   COPY (SELECT * FROM profiles) TO '/tmp/profiles.csv' WITH CSV HEADER;
   COPY (SELECT * FROM transactions) TO '/tmp/transactions.csv' WITH CSV HEADER;
   -- Repeat for all tables
   ```

2. **Import to New Instance**:
   ```sql
   -- Import each table
   COPY profiles FROM '/tmp/profiles.csv' WITH CSV HEADER;
   COPY transactions FROM '/tmp/transactions.csv' WITH CSV HEADER;
   -- Repeat for all tables
   ```

3. **Update Foreign Keys**: Ensure all UUIDs are preserved
4. **Update Auth Users**: You'll need to migrate `auth.users` separately (Supabase doesn't allow direct export)

**Note**: Migrating auth users is complex. Consider:
- Having users re-register
- Or use Supabase's migration tools if available

---

## Phase 5: Email Configuration

### Step 1: Update Email Redirect URLs

In your **new Supabase project**:

1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: `https://your-production-domain.com`
3. **Redirect URLs**: Add:
   - `https://your-production-domain.com/auth/callback`
   - `https://your-production-domain.com/**` (wildcard for all routes)

### Step 2: Configure Email Templates (Optional)

Customize email templates in **Authentication** → **Email Templates**:
- Confirm signup
- Reset password
- Magic link
- Change email address

---

## Phase 6: Storage Buckets

### Step 1: Create Storage Buckets

In your **new Supabase project**, go to **Storage** and create:

1. **`avatars`** bucket:
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

2. **`agency-branding`** bucket:
   - Public: Yes
   - File size limit: 10MB
   - Allowed MIME types: `image/*`

3. **`transaction-files`** bucket:
   - Public: No (private)
   - File size limit: 20MB
   - Allowed MIME types: `*/*`

### Step 2: Set Up Storage Policies

Apply RLS policies for each bucket (check your existing setup for reference)

---

## Phase 7: Testing Checklist

### Pre-Deployment Testing

- [ ] All migrations applied successfully
- [ ] All tables created
- [ ] All functions created and working
- [ ] Storage buckets created
- [ ] Environment variables set in production
- [ ] Email redirect URLs configured

### Post-Deployment Testing

- [ ] User registration works
- [ ] Email verification links point to production
- [ ] Login works
- [ ] Profile creation works
- [ ] Website color extraction works (new feature)
- [ ] Transaction creation works
- [ ] File uploads work
- [ ] Notifications work
- [ ] All API endpoints work

---

## Phase 8: Future Migration to Paid Production

### When to Migrate

Consider migrating to paid production when:
- You exceed free tier limits (500MB database, 2GB bandwidth)
- You need better performance
- You need more storage
- You need advanced features (point-in-time recovery, etc.)

### Migration Steps (Future)

1. **Create New Paid Project**:
   - Choose appropriate plan (Pro, Team, Enterprise)
   - Same region as staging

2. **Follow Same Process**:
   - Apply all migrations
   - Migrate data (if needed)
   - Update environment variables
   - Test thoroughly

3. **DNS/Deployment Switch**:
   - Update production environment variables
   - Redeploy application
   - Monitor for issues

4. **Decommission Old Instance**:
   - After confirming everything works
   - Export final backup
   - Delete old project

---

## Environment Variable Summary

### Required Variables

| Variable | Description | Where Used |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client-side, API routes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Client-side, API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | Server-side API routes only |
| `DEEPL_API_KEY` | DeepL translation API key | Translation service |
| `NEXT_PUBLIC_SITE_URL` | Your site URL | Email links, redirects |

### Optional Variables

| Variable | Description | Where Used |
|----------|-------------|------------|
| `SUPABASE_MANAGEMENT_TOKEN` | Management API token | Supabase management operations |
| `SUPABASE_PROJECT_REF` | Project reference ID | Supabase management operations |

---

## Quick Reference: Migration Checklist

### Initial Setup
- [ ] Create new Supabase project
- [ ] Save credentials securely
- [ ] Apply all migrations
- [ ] Verify schema and functions
- [ ] Create storage buckets
- [ ] Configure email settings

### Configuration
- [ ] Update production environment variables
- [ ] Keep dev environment variables separate
- [ ] Update email redirect URLs
- [ ] Test email verification flow

### Deployment
- [ ] Deploy with new environment variables
- [ ] Test registration flow
- [ ] Test email verification
- [ ] Test all major features
- [ ] Monitor for errors

### Post-Deployment
- [ ] Verify website color extraction works
- [ ] Test with real user registration
- [ ] Monitor Supabase dashboard for issues
- [ ] Set up alerts/monitoring

---

## Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check environment variables are set correctly
   - Verify keys match the project
   - Ensure no extra spaces in values

2. **"RLS policy violation"**
   - Check RLS policies are applied
   - Verify user roles are set correctly
   - Check function permissions

3. **"Email links point to wrong domain"**
   - Update Site URL in Supabase dashboard
   - Update redirect URLs
   - Clear browser cache

4. **"Storage bucket not found"**
   - Create buckets in new project
   - Apply storage policies
   - Check bucket names match code

---

## Security Best Practices

1. **Never commit** `.env` files to git
2. **Rotate keys** if accidentally exposed
3. **Use service role key** only in server-side code
4. **Limit RLS policies** to minimum required access
5. **Monitor** Supabase dashboard for unusual activity
6. **Backup** database regularly (paid plans include automated backups)

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Migration Guide**: https://supabase.com/docs/guides/migrations
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

## Next Steps

1. **Immediate**: Set up staging/production Supabase instance
2. **Short-term**: Test thoroughly before going live
3. **Medium-term**: Monitor usage and performance
4. **Long-term**: Plan migration to paid production when needed

---

**Last Updated**: 2025-01-04  
**Status**: Ready for Implementation

