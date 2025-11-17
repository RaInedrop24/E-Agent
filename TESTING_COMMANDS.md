# 🧪 Testing Commands Reference

Quick reference for testing after SQL fix is applied.

---

## 🔄 Before Testing - Apply SQL Fix First!

```bash
# This MUST be done first in Supabase Dashboard:
# 1. Open: https://skvfgvlwccxetglmfhpm.supabase.co
# 2. SQL Editor → New Query
# 3. Copy/paste: supabase/APPLY_THIS_FIX.sql
# 4. Click RUN
```

---

## 🎭 Automated Testing with Playwright

### Full Authentication Test (Recommended)
```bash
npx playwright test tests/e2e/fix-auth.spec.js --headed
```

**What it tests:**
- ✅ Debug page access
- ✅ Authentication status
- ✅ Profile existence
- ✅ Profile creation
- ✅ Dashboard access
- ✅ Login redirect behavior

**Expected Output (After SQL Fix):**
```
✅ Auth User found on page
✅ Profile exists
✅ Dashboard accessible!
✅ AUTHENTICATION WORKING!
```

### Run in Headless Mode (Faster)
```bash
npx playwright test tests/e2e/fix-auth.spec.js
```

### View Test Results
Screenshots are saved to `test-results/`:
- `01-debug-page-initial.png` - Initial auth state
- `02-login-form-filled.png` - Login form
- `03-after-login.png` - After login attempt
- `04-debug-page-after-login.png` - Debug page state
- `05-after-create-profile.png` - After profile creation
- `06-dashboard.png` - Dashboard page

---

## 🌐 Manual Testing in Browser

### Test Credentials
```
Email: Eagent_Admin@rainedrop.co.uk
Password: EA@l0u15e001
Role: Agent
```

### Test Sequence

#### 1. Debug Page Check
```
URL: http://localhost:3001/debug/profile
```

**Should Show:**
- ✅ Auth User section with user details
- ✅ Profile in Database section with profile data
- ✅ No errors

**If Profile Missing:**
- Click "Create Profile Manually" button
- Should succeed after SQL fix

---

#### 2. Login Flow Test
```
URL: http://localhost:3001/login
```

**Steps:**
1. Enter email: `Eagent_Admin@rainedrop.co.uk`
2. Enter password: `EA@l0u15e001`
3. Click "Sign In"

**Expected:**
- ✅ Redirects to `/dashboard`
- ✅ Shows "Agent Dashboard"
- ✅ Shows user avatar in header
- ✅ No redirect loop back to login

**If Still Loops:**
- Clear browser cookies
- Try again
- Check SQL fix was applied correctly

---

#### 3. Dashboard Test
```
URL: http://localhost:3001/dashboard
```

**Should Show:**
- ✅ "Agent Dashboard" heading
- ✅ "Create Transaction" button
- ✅ User info in header
- ✅ Recent transactions (may be empty initially)

---

#### 4. Transaction Creation Test
```
From Dashboard → Click "Create Transaction"
```

**Fill Form:**
- Title: "Test Villa in Tuscany"
- Client Name: "Test Buyer"
- Property Address: "Via Roma 123, Florence, Italy"
- Purchase Price: "500000"
- Transaction Type: "Sale"

**Expected:**
- ✅ Redirects to transaction detail page
- ✅ Shows transaction info
- ✅ Shows 5 default milestones in Tracker tab
- ✅ Progress bar shows 0%

---

#### 5. Milestone Test
```
On Transaction Detail → Tracker Tab
```

**Actions:**
1. Click "Mark Complete" on first milestone
2. Check progress bar updates to 20%
3. Check completion date appears
4. Check checkmark shows

**Expected:**
- ✅ Milestone marked as complete
- ✅ Progress bar animates to 20%
- ✅ Completion date shows current date
- ✅ Visual feedback (checkmark icon)

---

## 🔍 Diagnostic Commands

### Check Server Status
```bash
# Check if dev server is running
netstat -ano | findstr :3001
```

### Start Dev Server
```bash
npm run dev:3001
```

### View Server Logs
```bash
# Server logs show in terminal where you ran dev:3001
# Look for:
# - GET /login?redirect=%2Fdashboard (should not repeat infinitely)
# - GET /dashboard (should return 200, not redirect)
```

### Check Browser Cookies
Open DevTools → Application → Cookies → `localhost:3001`

**Should See:**
```
sb-skvfgvlwccxetglmfhpm-auth-token
  Value: {JSON object with access_token, refresh_token, etc}
```

---

## 🚨 Troubleshooting Tests

### Test Fails: "Cannot connect to localhost:3001"
```bash
# Start the dev server first
npm run dev:3001

# In another terminal, run test
npx playwright test tests/e2e/fix-auth.spec.js
```

### Test Fails: "Port already in use"
**Issue:** Playwright config trying to start server when one exists

**Fix:** Already configured in `playwright.config.ts`:
```typescript
webServer: {
  reuseExistingServer: true  // This allows reusing existing server
}
```

### Test Passes But Browser Shows Issues
**Try:**
1. Clear browser cache and cookies
2. Hard refresh (Ctrl+Shift+R)
3. Try incognito/private browsing
4. Check console for errors (F12)

### Profile Creation Still Fails
**Verify SQL Fix Applied:**

Go to Supabase Dashboard → SQL Editor → New Query:
```sql
-- Check if function exists
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'create_profile_for_current_user';

-- Should return 1 row showing the function exists
```

```sql
-- Check policies
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Should show:
-- - "Authenticated users can view profiles" (SELECT)
-- - "Users can insert their own profile" (INSERT)
-- - "Users can update their own profile" (UPDATE)
```

---

## ✅ Success Criteria

After SQL fix applied, all tests should pass:

### Automated Test
```bash
npx playwright test tests/e2e/fix-auth.spec.js
# Output: 1 passed
```

### Manual Checklist
- [ ] Can login without redirect loop
- [ ] Dashboard accessible
- [ ] Profile shows in debug page
- [ ] Can create transaction
- [ ] Can see 5 milestones
- [ ] Can mark milestone complete
- [ ] Progress updates correctly
- [ ] No console errors related to RLS

---

## 📊 Performance Benchmarks

### Expected Test Times
- Playwright full test: ~7 seconds
- Page load (dashboard): <500ms
- Profile fetch: <100ms
- Transaction creation: <1 second
- Milestone update: <500ms

### If Slower
- Check network tab in DevTools
- Look for slow Supabase queries
- Check RLS policies aren't too complex

---

## 🎯 Next Testing Phase (After Auth Works)

1. **Multi-user testing**
   - Create buyer account
   - Add buyer to transaction
   - Test participant access

2. **Message testing**
   - Send message as agent
   - Receive as buyer
   - Test translations (when DeepL added)

3. **File upload testing**
   - Upload document
   - Verify storage permissions
   - Test file access by participants

4. **Settings testing**
   - Update profile
   - Change avatar
   - Update language preference
   - Change password

---

## 📝 Test Reporting

### Create Test Report
After each test run, note:
- Date/time
- Test type (automated/manual)
- Pass/fail status
- Any errors encountered
- Screenshots if issues found

### Example Report Format
```markdown
## Test Run - Nov 17, 2025

**Automated:** ✅ PASS
**Duration:** 6.9s
**Issues:** None

**Manual:**
- Login: ✅
- Dashboard: ✅
- Create Transaction: ✅
- Milestones: ✅

**Notes:** All features working after SQL fix applied
```

---

**Remember:** Always apply the SQL fix FIRST before running any tests!

*Last Updated: 2025-11-17 17:31 UTC*
