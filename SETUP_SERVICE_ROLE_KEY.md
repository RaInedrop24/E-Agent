# Setup Instructions: Service Role Key

## Issue Fixed
The "User not allowed" error when creating buyers has been resolved by moving the admin API call to a secure server-side API route.

## What Changed

### 1. New API Route
**File:** `src/app/api/buyers/create/route.ts`
- Handles buyer creation server-side using the service role key
- Validates that the requesting user is an authenticated agent
- Creates the buyer user account
- Creates the buyer-agent association
- Sends the password reset email

### 2. Updated Buyers Page
**File:** `src/app/buyers/page.tsx`
- Changed `handleCreateBuyer` to call the API route instead of using admin API directly
- Passes the user's session token for authentication

### 3. Environment Variable
**File:** `.env.local`
- Added placeholder for `SUPABASE_SERVICE_ROLE_KEY`

---

## Required Setup Steps

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **skvfgvlwccxetglmfhpm**
3. Click **Project Settings** (gear icon in sidebar)
4. Click **API** in the left menu
5. Scroll down to **Project API keys**
6. Find the **service_role** key (NOT the anon key)
7. Click the eye icon to reveal it
8. Copy the entire key

**⚠️ IMPORTANT:** The service role key is SECRET and bypasses Row Level Security. Never expose it to the client or commit it to version control.

### Step 2: Add the Key to .env.local

1. Open `.env.local` in your project root
2. Find the line: `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`
3. Replace `your_service_role_key_here` with your actual service role key
4. Save the file

Example:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

### Step 3: Restart the Development Server

1. Stop your current dev server (Ctrl+C)
2. Start it again:
```bash
cd estate-portal
npm run dev
```

The server needs to restart to pick up the new environment variable.

---

## Testing

Once you've completed the setup:

1. Log in as an **agent**
2. Go to **Dashboard** → Click **"Manage Buyers"**
3. Click **"Create Buyer"**
4. Fill in:
   - Email: (any valid email)
   - Full Name: (any name)
   - Preferred Language: (select one)
5. Click **"Create & Send Invite"**
6. ✅ The buyer should be created without errors
7. ✅ The buyer should appear in your buyers list
8. ✅ The buyer should receive a password setup email

---

## Security Notes

### Why This Approach is Secure

1. **Service role key stays on the server**: The key is only used in the API route which runs server-side in Node.js, never exposed to the browser

2. **Authentication required**: The API route validates the user's session token before allowing any operation

3. **Role-based access control**: Only users with role='agent' can create buyers

4. **Environment variable**: The service role key is stored in `.env.local` which should NOT be committed to git (it should be in your `.gitignore`)

### What NOT To Do

❌ Don't use `NEXT_PUBLIC_` prefix for the service role key
❌ Don't use the service role key in client components
❌ Don't commit the service role key to git
❌ Don't share the service role key publicly

---

## Troubleshooting

### Error: "Missing authorization header"
- Make sure you're logged in
- Try refreshing the page and logging in again

### Error: "Only agents can create buyers"
- Verify your user role is set to 'agent' in the profiles table
- Check the Supabase dashboard: Authentication → Users → Your user → User Metadata

### Buyer created but no email received
- Check the buyer's spam folder
- Verify Supabase email is configured: Authentication → Email Templates
- Use the "Resend Invite" button in the buyer management page

### API route returns 500 error
- Check that `SUPABASE_SERVICE_ROLE_KEY` is correctly set in `.env.local`
- Verify the dev server was restarted after adding the key
- Check the terminal/console for error messages

---

## Next Steps

After completing this setup, the buyer management system should be fully functional. You'll still need to:

1. ✅ Run the database migrations (if not already done)
2. ✅ Configure email templates in Supabase (optional but recommended)
3. ✅ Test the complete buyer creation flow

See `BUYER_MANAGEMENT_IMPLEMENTATION.md` for full testing instructions.
