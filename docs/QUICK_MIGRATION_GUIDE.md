# Quick Migration Guide - Supabase Production Setup

## TL;DR - Fast Track Setup

### 1. Create New Supabase Project (5 minutes)
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it `estate-portal-prod`
4. Save the credentials

### 2. Get Your Credentials (2 minutes)
From Project Settings → API:
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Apply Migrations (10-15 minutes)

**Option A: Using Supabase Dashboard (Easiest)**
1. Go to SQL Editor in new project
2. Open each migration file from `supabase/migrations/` in order
3. Copy and paste SQL into editor
4. Run each one
5. Start with oldest date, work forward

**Option B: Using Supabase CLI (Faster)**
```bash
# Install CLI
npm install -g supabase

# Link project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### 4. Create Storage Buckets (2 minutes)
In Storage section, create:
- `avatars` (public)
- `agency-branding` (public)  
- `transaction-files` (private)

### 5. Configure Email (2 minutes)
In Authentication → URL Configuration:
- Site URL: `https://your-production-domain.com`
- Redirect URLs: `https://your-production-domain.com/**`

### 6. Update Environment Variables (2 minutes)
In your hosting platform (Vercel/etc.):
- Update `NEXT_PUBLIC_SUPABASE_URL`
- Update `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Update `SUPABASE_SERVICE_ROLE_KEY`
- Redeploy

### 7. Test (5 minutes)
- [ ] Register new user
- [ ] Check email verification link goes to production
- [ ] Login works
- [ ] Website color extraction works

**Total Time: ~30 minutes**

---

## Migration File Order

Apply migrations in this order (by date in filename):

```
20251117_initial_schema.sql
20251120_add_buyer_invite_function.sql
20251121_fix_function_search_paths.sql
20251121_fix_new_function_search_paths.sql
20251121_fix_rls_performance.sql
20251121_fix_transaction_participants_recursion.sql
20251121_fix_transactions_insert_policy.sql
20251121_fix_transactions_rls.sql
20251121_fix_user_transactions_view.sql
20251121_optimize_profiles_insert_policy.sql
20251121_add_milestone_index.sql
20251122_simplify_transactions_policy.sql
20251209_fix_rls_volatile.sql
20251209_fix_transactions_rls.sql
20251209_fix_transactions_select_creator.sql
20251209_fix_transactions_select_policy.sql
20251210_fix_profiles_policy_hotfix.sql
20251210_add_buyer_agent_associations.sql
20251210_add_buyer_management_functions.sql
20251211_add_buyer_by_id_function.sql
20251211_add_get_participants_function.sql
20251214_add_message_translations.sql
20251214_fix_profiles_updated_at.sql
20251216_add_delete_transaction_function.sql
20251216_add_transaction_url_and_title_translations.sql
20251217_add_milestone_id_to_files.sql
20251218_seed_default_template.sql
20251218_auto_create_default_template.sql
20251218_fix_template_rls_policies.sql
20251218_fix_template_functions.sql
20251218_add_milestone_templates.sql
20251219_add_polish_language.sql
20251222_add_alert_settings.sql
20251222_fix_alert_defaults.sql
20251222_add_branding_to_profiles.sql
20251223_add_super_admin_role.sql
20251223_add_admin_audit_log.sql
20251223_update_rls_for_super_admin.sql
20251223_fix_rls_infinite_recursion.sql
20251224_add_sql_query_executor.sql
20251224_add_super_admin_to_milestone_templates.sql
20251224_fix_save_milestone_template_polish.sql
20251229_add_system_announcements.sql
20251229_add_user_notifications.sql
20250101_add_notification_translations.sql
20250102_add_last_updated_to_transactions.sql
20250102_add_update_last_updated_function.sql
20250102_add_dashboard_preferences.sql
20260102_add_agent_reference_to_transactions.sql
20260103_add_activity_filter_preferences.sql
20260103_update_dashboard_sort_options.sql
20260104_add_website_url_to_profiles.sql
20260104_update_profile_function_with_website.sql
```

**Note**: If you get errors about objects already existing, that's okay - just continue with the next migration.

---

## Environment Variables Template

Create these in your production hosting:

```bash
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Other services
DEEPL_API_KEY=your-deepl-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Verification Queries

After applying migrations, run these in SQL Editor to verify:

```sql
-- Check tables exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return ~11 tables

-- Check functions exist
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
-- Should return multiple functions

-- Check website_url column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'website_url';
-- Should return 1 row
```

---

## Common Issues & Fixes

**Issue**: Migration fails with "already exists"
- **Fix**: Skip that migration, continue with next

**Issue**: "Permission denied" errors
- **Fix**: Make sure you're using service role key for admin operations

**Issue**: Email links still point to dev
- **Fix**: Update Site URL in Supabase dashboard → Authentication → URL Configuration

**Issue**: Storage bucket not found
- **Fix**: Create buckets manually in Storage section

---

## Need Help?

See full details in: `docs/SUPABASE_PRODUCTION_MIGRATION_PLAN.md`

