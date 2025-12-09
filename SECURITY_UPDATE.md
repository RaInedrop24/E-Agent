# 🔒 Security Update - Credentials Moved to Environment Variables

## What Changed

All hardcoded test credentials have been removed from the codebase and replaced with environment variable references.

## Files Updated

### Test Specs (`.env` variables now required)
- `tests/specs/InviteBuyer.spec.ts`
- `tests/specs/General.spec.ts`
- `tests/specs/CreateTransaction.spec.ts`
- `tests/fix-auth.spec.js`

### Scripts
- `scripts/test-login.js`
- `scripts/fix-profile.js`

### Configuration
- `.gitignore` - Added patterns for sensitive session logs
- `env.test.local.example` - Template for test credentials

## Required Action: Set Up Your Environment

### 1. Create `.env.test.local`

Copy the example file:
```bash
cp env.test.local.example .env.test.local
```

### 2. Add Your Credentials

Edit `.env.test.local` with your actual test credentials:
```env
TEST_AGENT_EMAIL=Eagent_Admin@rainedrop.co.uk
TEST_AGENT_PASSWORD=your-new-secure-password
```

**⚠️ IMPORTANT:** `.env.test.local` is gitignored and will NEVER be committed.

### 3. Rotate Your Password

Since the old password was exposed in git history:
1. Go to Supabase Dashboard → Authentication → Users
2. Find `Eagent_Admin@rainedrop.co.uk`
3. Reset password to a new secure value
4. Update `.env.test.local` with the new password

## Running Tests

Tests will now use environment variables:

```bash
# Make sure .env.test.local exists with valid credentials
npm run test:e2e
```

## Why This Matters

Hardcoded credentials in git history:
- ✅ Can be accessed by anyone with repo access
- ✅ Persist forever in git history (even if files are deleted)
- ✅ May be discovered by automated scanners

Using environment variables:
- ✅ Keeps secrets out of version control
- ✅ Allows different credentials per developer/environment
- ✅ Follows security best practices

## Still at Risk?

Files that STILL contain the old password (in git history):
- `AUTHENTICATION_FIXED.md` (line 273)
- `docs/Autonomous_Session_Nov17_Continued.md`
- `docs/URGENT_FIXES_NEEDED.md`
- `TESTING_COMMANDS.md`
- `START_HERE.md`

**Recommendation:** These will be removed/redacted in a future commit and the password rotated.

