# Super Admin Feature - Setup & Testing Guide

## Overview

The super admin feature provides elevated privileges for system administrators with the following capabilities:

- ✅ Access all admin and debug tools
- ✅ View ALL transactions across all agents
- ✅ Filter transactions by specific agent
- ✅ View any user's settings and data (for support purposes)
- ✅ Protected by mandatory MFA (Multi-Factor Authentication)
- ✅ All access is logged in audit trail
- ✅ Middleware protection on admin routes

## Database Migrations Required

Run these migrations in order:

1. **20251223_add_super_admin_role.sql** - Adds is_super_admin column and RPC function
2. **20251223_add_admin_audit_log.sql** - Creates audit logging table
3. **20251223_update_rls_for_super_admin.sql** - Updates RLS policies to allow super admin access
4. **20251223_fix_alert_defaults.sql** - Fixes alert settings defaults (if not already run)

```bash
# Apply migrations via Supabase CLI or Dashboard
# Dashboard: Database > SQL Editor > paste and run each migration
```

## Creating Your First Super Admin

### Method 1: Via Supabase SQL Editor (Recommended for first super admin)

```sql
-- Replace with your actual email address
UPDATE public.profiles
SET is_super_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### Method 2: Via API (for subsequent super admins)

Once you have one super admin, they can grant access to others through a future admin management UI.

## Setting Up MFA

### Step 1: Log in as Super Admin

Log in with the account you just granted super admin privileges to.

### Step 2: Navigate to Admin Route

Try to access any admin route (e.g., `/admin`, `/debug/sms-config`, `/test-sms`).

The middleware will detect you don't have MFA enabled and redirect you to `/admin/mfa-setup`.

### Step 3: Complete MFA Setup

1. **Download an Authenticator App** (if you don't have one):
   - Google Authenticator (iOS/Android)
   - Microsoft Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
   - 1Password (has built-in TOTP)
   - Bitwarden (has built-in TOTP)

2. **Scan the QR Code**:
   - Open your authenticator app
   - Click "Add Account" or "+"
   - Scan the QR code shown on screen

3. **Enter Verification Code**:
   - Enter the 6-digit code from your authenticator app
   - Click "Verify and Enable MFA"

4. **Success!**:
   - You'll be redirected to the page you were trying to access
   - MFA is now required for all future logins to admin areas

## Features

### 1. Protected Routes

These routes are protected by middleware and require super admin + MFA:

- `/admin` - Main admin dashboard
- `/admin/**` - All admin sub-routes
- `/debug/**` - All debug tools
- `/test-sms` - SMS testing tool

### 2. Transactions View

Super admins see an enhanced transactions page (`/transactions`):

- **View All Transactions**: See every transaction in the system
- **Agent Filter**: Dropdown to filter by specific agent
- **Agent Attribution**: Each transaction shows which agent created it
- **Badge Indicator**: "Super Admin View" badge shows you're in elevated mode

### 3. Audit Logging

All super admin actions are logged to `admin_audit_log` table:

- Route access attempts (successful and unauthorized)
- Filter changes
- Data access

View logs:
```sql
SELECT
  admin_user_id,
  action,
  resource_type,
  resource_id,
  details,
  ip_address,
  created_at
FROM public.admin_audit_log
ORDER BY created_at DESC
LIMIT 100;
```

### 4. RLS Bypass

Super admins can see all data thanks to updated RLS policies:

- All transactions (creator + participants)
- All milestones
- All messages
- All files
- All user profiles

This is essential for support and troubleshooting.

## Testing Checklist

### Pre-requisites
- [ ] All migrations applied
- [ ] At least one user granted super_admin = true
- [ ] MFA authenticator app installed on mobile device

### Basic Access Tests
- [ ] Non-super-admin user **CANNOT** access `/admin`
- [ ] Non-super-admin user **CANNOT** access `/debug/sms-config`
- [ ] Non-super-admin user **CANNOT** access `/test-sms`
- [ ] Non-super-admin redirected to `/dashboard` with error

### Super Admin Without MFA
- [ ] Super admin without MFA redirected to `/admin/mfa-setup`
- [ ] Cannot access admin routes until MFA is configured
- [ ] MFA setup page shows QR code
- [ ] Can scan QR code with authenticator app
- [ ] Entering correct 6-digit code completes setup
- [ ] After MFA setup, redirected to original destination

### Super Admin With MFA
- [ ] Super admin with MFA can access `/admin`
- [ ] Super admin with MFA can access `/debug/sms-config`
- [ ] Super admin with MFA can access `/test-sms`
- [ ] Access is logged in `admin_audit_log` table

### Transactions View
- [ ] Super admin sees "Super Admin View" badge
- [ ] Super admin sees ALL transactions (not just their own)
- [ ] Agent filter dropdown appears
- [ ] "All Agents" option shows total count
- [ ] Individual agent options work correctly
- [ ] Transaction cards show agent name with shield icon
- [ ] Can click into any transaction (even ones they didn't create)

### Data Access (RLS)
- [ ] Super admin can view transactions they didn't create
- [ ] Super admin can view other users' profiles
- [ ] Super admin can view files from any transaction
- [ ] Super admin can view messages from any transaction

## Security Considerations

### What's Protected
✅ All admin routes require super_admin = true
✅ All admin routes require MFA enrollment
✅ Middleware enforces these checks server-side
✅ All access is logged for audit trail
✅ Failed access attempts are logged

### What's NOT Protected (Yet)
⚠️ No session timeout enforcement (uses default Supabase session)
⚠️ No IP whitelisting (as requested by user)
⚠️ No rate limiting on admin routes
⚠️ No email notifications for new MFA enrollments

### Production Recommendations
1. Monitor `admin_audit_log` regularly
2. Set up alerts for unauthorized_access_attempt
3. Review super admin list quarterly
4. Consider adding session timeout for admin routes
5. Add email notifications for security events

## Troubleshooting

### "Unauthorized" error when accessing admin routes
- Check `profiles.is_super_admin` is `true` for your user
- Check you've completed MFA setup
- Clear browser cookies and log in again
- Check middleware logs in terminal

### MFA setup not working
- Ensure time on phone and server are synchronized
- Try manual entry of secret key instead of QR scan
- Check `supabase.auth.mfa.enroll()` isn't blocked by policy

### Can't see all transactions
- Verify RLS policies were updated correctly
- Check `current_user_is_super_admin()` returns `true`
- Try direct SQL query to verify data exists

### Audit logs not appearing
- Check `admin_audit_log` table exists
- Verify RLS policies allow super admin to INSERT
- Check middleware isn't silently failing (check terminal logs)

## Future Enhancements

Potential additions for later:

1. **Admin Management UI**: Page to grant/revoke super admin access
2. **Audit Log Viewer**: UI to browse and search audit logs
3. **Session Management**: Force logout, session timeout controls
4. **Impersonation Mode**: View app as another user (for support)
5. **Bulk Operations**: Mass update settings, transactions, etc.
6. **Advanced Filters**: Date ranges, status, buyer filters, etc.

## API Reference

### Check if current user is super admin
```typescript
const { data: isSuperAdmin } = await supabase.rpc('current_user_is_super_admin');
```

### Using the hook
```typescript
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

function MyComponent() {
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) return <div>Loading...</div>;
  if (!isSuperAdmin) return <div>Access Denied</div>;

  return <div>Super Admin Content</div>;
}
```

### Log an admin action
```typescript
await supabase.from('admin_audit_log').insert({
  admin_user_id: user.id,
  action: 'view_transaction',
  resource_type: 'transaction',
  resource_id: transactionId,
  details: { /* any extra data */ },
});
```

## Support

For issues or questions about super admin functionality:
1. Check this documentation
2. Review audit logs for clues
3. Check middleware logs in terminal
4. Verify migrations were applied correctly
5. Test with SQL queries to isolate RLS vs application issues
