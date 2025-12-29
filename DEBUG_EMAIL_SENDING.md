# Debug Email Sending Issues

## Problem
Email API reported sending to 6 agents and 22 buyers, but only 2 emails received for each group.

## Diagnostic SQL Queries

### 1. Check All Agents and Their Email Addresses

```sql
-- See all agents with their email status
SELECT 
  p.id,
  p.full_name,
  p.role,
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN u.email IS NULL THEN '❌ No Email'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email Not Confirmed'
    ELSE '✅ Email OK'
  END as email_status
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'agent'
ORDER BY p.full_name;
```

### 2. Check All Buyers and Their Email Addresses

```sql
-- See all buyers with their email status
SELECT 
  p.id,
  p.full_name,
  p.role,
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN u.email IS NULL THEN '❌ No Email'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email Not Confirmed'
    ELSE '✅ Email OK'
  END as email_status
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'buyer'
ORDER BY p.full_name;
```

### 3. Count Users by Email Status

```sql
-- Summary of email availability by role
SELECT 
  p.role,
  COUNT(*) as total_users,
  COUNT(u.email) as users_with_email,
  COUNT(*) - COUNT(u.email) as users_without_email,
  COUNT(u.email_confirmed_at) as users_with_confirmed_email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
GROUP BY p.role
ORDER BY p.role;
```

### 4. Check Recent System Announcements Sent

```sql
-- See what was actually sent
SELECT 
  id,
  subject,
  recipient_type,
  message_type,
  recipient_count,
  sent_at,
  admin_user_id
FROM system_announcements
ORDER BY sent_at DESC
LIMIT 5;
```

### 5. Find Agents Without Valid Emails

```sql
-- Agents that won't receive emails
SELECT 
  p.id,
  p.full_name,
  p.created_at as profile_created,
  CASE 
    WHEN u.email IS NULL THEN 'No email address in auth.users'
    WHEN u.email_confirmed_at IS NULL THEN 'Email not confirmed: ' || u.email
    ELSE 'Should be OK: ' || u.email
  END as issue
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'agent'
AND (u.email IS NULL OR u.email_confirmed_at IS NULL)
ORDER BY p.created_at DESC;
```

### 6. Find Buyers Without Valid Emails

```sql
-- Buyers that won't receive emails
SELECT 
  p.id,
  p.full_name,
  p.created_at as profile_created,
  CASE 
    WHEN u.email IS NULL THEN 'No email address in auth.users'
    WHEN u.email_confirmed_at IS NULL THEN 'Email not confirmed: ' || u.email
    ELSE 'Should be OK: ' || u.email
  END as issue
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'buyer'
AND (u.email IS NULL OR u.email_confirmed_at IS NULL)
ORDER BY p.created_at DESC;
```

### 7. Check Auth Users Table Directly

```sql
-- See all users in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
```

### 8. Compare Profiles vs Auth Users

```sql
-- Find orphaned profiles (profile exists but no auth.users entry)
SELECT 
  p.id,
  p.full_name,
  p.role,
  'Missing from auth.users' as issue
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;
```

## Common Issues and Solutions

### Issue 1: Profiles Without Email Addresses
**Symptom**: Query #5 or #6 shows users with "No email address in auth.users"

**Cause**: Profile was created but doesn't have a corresponding auth.users entry, or the entries are mismatched

**Solution**: These are likely test profiles. Either:
- Delete them: `DELETE FROM profiles WHERE id = 'uuid';`
- Or create proper auth users for them via Supabase Auth

### Issue 2: Unconfirmed Email Addresses
**Symptom**: Users have emails but `email_confirmed_at` is NULL

**Cause**: Users registered but never confirmed their email

**Solution**: 
```sql
-- Manually confirm emails for testing (use with caution!)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email IS NOT NULL 
AND email_confirmed_at IS NULL;
```

### Issue 3: Test/Dummy Profiles
**Symptom**: 6 agents found but only 2 with real emails

**Cause**: Test data or incomplete registrations

**Solution**: Clean up test data:
```sql
-- Find profiles created without proper auth
SELECT p.*, u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.email IS NULL
OR u.email LIKE '%test%'
OR u.email LIKE '%dummy%';

-- Delete if needed (careful!)
-- DELETE FROM profiles WHERE id IN (SELECT ids from above);
```

## Expected Results

For successful email delivery, you should see:
- ✅ Each profile has a matching auth.users entry
- ✅ Each auth.users entry has a non-NULL email
- ✅ Each email has email_confirmed_at set (or Resend accepts unconfirmed)
- ✅ No orphaned profiles

## Quick Diagnostic

Run this comprehensive check:

```sql
-- One query to rule them all
WITH user_email_status AS (
  SELECT 
    p.id,
    p.full_name,
    p.role,
    u.email,
    CASE 
      WHEN u.id IS NULL THEN 'NO_AUTH_USER'
      WHEN u.email IS NULL THEN 'NO_EMAIL'
      WHEN u.email_confirmed_at IS NULL THEN 'UNCONFIRMED'
      ELSE 'OK'
    END as status
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
)
SELECT 
  role,
  status,
  COUNT(*) as count,
  STRING_AGG(full_name, ', ') as users
FROM user_email_status
GROUP BY role, status
ORDER BY role, status;
```

This will show you exactly how many users are in each status category!

## Next Steps

1. Run Query #3 (Count Users by Email Status) - gives you overview
2. Run the "Quick Diagnostic" query - shows exactly what's wrong
3. Based on results:
   - If many have NO_EMAIL: Need to investigate auth.users sync
   - If many are UNCONFIRMED: Manually confirm for testing
   - If many are NO_AUTH_USER: Orphaned profiles, safe to delete

## Check API Logs

Also check your terminal/console logs when sending emails. The API logs:
```
[System Email] Sent to user@example.com (User Name)
[System Email] Failed to send to user2@example.com: [error]
[System Email] Completed: X sent, Y failed
```

Look for error messages that indicate:
- Rate limiting
- Invalid email addresses
- Resend API errors

## Resend Dashboard

Check your Resend dashboard:
- Go to: https://resend.com/emails
- See which emails were accepted vs rejected
- Check for bounces or spam flags

