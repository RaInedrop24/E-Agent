# Buyer Creation Issue - Summary for New Agent

## Problem Statement
Agents are unable to create new buyers in the system. The buyer creation flow is failing with multiple errors, and there are console errors appearing when attempting to create a buyer.

## Expected Behavior
1. Agent navigates to `/buyers` page
2. Agent clicks "Create Buyer" button
3. Agent fills in form: email, full name, preferred language
4. Agent submits form
5. System should:
   - Create auth user via `supabaseAdmin.auth.admin.inviteUserByEmail()`
   - Create profile entry in `profiles` table with role='buyer'
   - Create association in `buyer_agent_associations` table
   - Send invitation email to buyer
   - Show success message and refresh buyer list

## Current Errors
- **Primary Error**: `POST /api/buyers/create 400 (Bad Request)`
- **Error Message**: "Database error saving new user"
- **Console Errors**: Multiple errors appearing in browser console (exact errors need to be captured)

## Technical Context

### Key Files
- **API Route**: `src/app/api/buyers/create/route.ts`
- **Frontend Component**: `src/app/buyers/page.tsx` (lines 113-164 for `handleCreateBuyer`)
- **Database Schema**: 
  - `profiles` table (id, full_name, preferred_language, role, avatar_url, created_at)
  - `buyer_agent_associations` table (buyer_id, agent_id)
  - Foreign key: `profiles.id` references `auth.users(id)`

### Current Implementation Flow
1. Frontend calls `/api/buyers/create` with Bearer token
2. API verifies agent is authenticated and has role='agent'
3. API calls `supabaseAdmin.auth.admin.inviteUserByEmail()` to create auth user
4. API attempts to create profile entry in `profiles` table
5. API attempts to create `buyer_agent_associations` entry
6. Returns success or error

### What We've Tried
1. **Initial Issue**: `inviteUserByEmail` creates auth user but not profile
   - **Fix Attempted**: Added explicit profile creation after `inviteUserByEmail`
   - **Result**: Still failing

2. **Build Error**: Duplicate variable name `profileError`
   - **Fix Applied**: Renamed to `buyerProfileError`
   - **Result**: Build now succeeds, but runtime error persists

### Potential Issues to Investigate
1. **RLS Policies**: Profile creation might be blocked by Row Level Security policies
   - Using `supabaseAdmin` (service role) should bypass RLS, but verify
   
2. **Database Constraints**: 
   - Check if there are any triggers or constraints on `profiles` table
   - Verify foreign key constraint on `profiles.id` → `auth.users.id`
   
3. **Profile Creation Function**: There's a `create_profile_for_current_user()` function in the database
   - Should we use this instead of direct insert?
   - Check if there's a trigger that auto-creates profiles
   
4. **Error Details**: Need to capture the exact error from `buyerProfileError`
   - Check server logs for detailed error messages
   - The error might be a constraint violation, RLS policy, or missing field

5. **Association Table**: Verify `buyer_agent_associations` table structure and constraints
   - Check if foreign keys are properly set up
   - Verify RLS policies allow admin client to insert

## Action Items
1. **Capture Exact Errors**: 
   - Check browser console for full error stack
   - Check server logs (if available) for detailed database errors
   - Add more detailed error logging in the API route

2. **Verify Database State**:
   - Check if profile is actually being created (query `profiles` table)
   - Check if auth user is being created (query `auth.users`)
   - Verify no duplicate entries or constraint violations

3. **Test Profile Creation**:
   - Try creating profile directly via Supabase admin panel
   - Test if `create_profile_for_current_user()` RPC function works
   - Check if there's a database trigger that should auto-create profiles

4. **Review RLS Policies**:
   - Verify service role key has proper permissions
   - Check if there are any RLS policies blocking profile creation
   - Ensure admin client can bypass RLS

5. **Alternative Approach**:
   - Consider using Supabase database triggers to auto-create profiles
   - Or use the `create_profile_for_current_user()` RPC function
   - Or create profile via a separate admin-only API endpoint

## Environment
- **Framework**: Next.js 16.0.10
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Admin Client**: Uses `SUPABASE_SERVICE_ROLE_KEY` for bypassing RLS

## Files to Review
- `src/app/api/buyers/create/route.ts` - Main API route
- `src/app/buyers/page.tsx` - Frontend buyer management page
- `supabase/migrations/*.sql` - Database schema and migrations
- `supabase/create_profile_function.sql` - Profile creation function

## Next Steps
1. Add comprehensive error logging to capture exact database errors
2. Test profile creation in isolation
3. Verify database schema and constraints
4. Check RLS policies
5. Consider alternative implementation approach if current one is fundamentally flawed

