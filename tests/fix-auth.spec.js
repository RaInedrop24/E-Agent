/**
 * Playwright test to diagnose and fix authentication issues
 * Run with: npx playwright test tests/fix-auth.spec.js --headed
 */

const { test, expect } = require('@playwright/test');

const TEST_USER = {
  email: process.env.TEST_AGENT_EMAIL || 'Eagent_Admin@rainedrop.co.uk',
  password: process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME',
};

test.describe('Authentication Fix and Testing', () => {
  test('Check authentication status and fix if needed', async ({ page }) => {
    console.log('\n🔍 Starting authentication diagnostic...\n');

    // Step 1: Navigate to debug page to check auth status
    console.log('📍 Step 1: Navigating to debug page...');
    await page.goto('http://localhost:3001/debug/profile');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-debug-page-initial.png', fullPage: true });

    // Check if we're on login page (redirect)
    if (page.url().includes('/login')) {
      console.log('❌ Not authenticated - on login page');
      console.log('🔐 Step 2: Attempting to login...');

      // Fill in login form
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);

      // Take screenshot before login
      await page.screenshot({ path: 'test-results/02-login-form-filled.png', fullPage: true });

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Give time for redirects

      // Take screenshot after login attempt
      await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });

      console.log('Current URL after login:', page.url());

      // Check if we're still on login page (redirect loop)
      if (page.url().includes('/login')) {
        console.log('⚠️  LOGIN LOOP DETECTED - Still on login page after login attempt');
        console.log('This confirms the RLS infinite recursion issue');

        // Navigate directly to debug page using auth
        await page.goto('http://localhost:3001/debug/profile');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/04-debug-page-after-login.png', fullPage: true });
      }
    } else {
      console.log('✅ Already on debug page (authenticated or public access)');
    }

    // Step 3: Check auth user status on debug page
    console.log('\n📊 Step 3: Checking auth status on debug page...');

    // Look for auth user card
    const authUserCard = page.locator('text=Auth User').first();
    const hasAuthUser = await authUserCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAuthUser) {
      console.log('✅ Auth User found on page');

      // Check if profile exists
      const noProfileText = page.locator('text=No profile found in database');
      const hasNoProfile = await noProfileText.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasNoProfile) {
        console.log('❌ No profile found - attempting to create...');

        // Look for create profile button
        const createButton = page.locator('button:has-text("Create Profile Manually")');
        const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasCreateButton) {
          console.log('🔨 Step 4: Creating profile...');
          await createButton.click();
          await page.waitForTimeout(3000); // Wait for profile creation

          await page.screenshot({ path: 'test-results/05-after-create-profile.png', fullPage: true });

          // Check if profile was created successfully
          const profileCard = page.locator('text=Profile in Database').first();
          const profileContent = await profileCard.locator('..').textContent();

          if (profileContent.includes('No profile found')) {
            console.log('❌ Profile creation failed');
            console.log('⚠️  SQL FIX REQUIRED: Please apply supabase/APPLY_THIS_FIX.sql');

            // Look for error details
            const errorCard = page.locator('text=Error Details');
            if (await errorCard.isVisible({ timeout: 1000 }).catch(() => false)) {
              const errorContent = await errorCard.locator('..').textContent();
              console.log('\n🔴 Error details:', errorContent);
            }
          } else {
            console.log('✅ Profile created successfully!');
          }
        } else {
          console.log('⚠️  Create profile button not found');
        }
      } else {
        console.log('✅ Profile exists');
      }
    } else {
      console.log('❌ Not authenticated - Auth User not found');
    }

    // Step 5: Test dashboard access
    console.log('\n📍 Step 5: Testing dashboard access...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/06-dashboard.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Dashboard URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('❌ Dashboard redirected to login - Authentication not working');
      console.log('\n📋 SUMMARY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔴 CRITICAL: SQL fix needs to be applied');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📝 Instructions:');
      console.log('1. Open: https://skvfgvlwccxetglmfhpm.supabase.co');
      console.log('2. Go to: SQL Editor → New Query');
      console.log('3. Open: supabase/APPLY_THIS_FIX.sql');
      console.log('4. Copy ALL contents and paste into SQL Editor');
      console.log('5. Click RUN');
      console.log('6. Run this test again: npx playwright test tests/fix-auth.spec.js');
      console.log('\n' + '━'.repeat(60));
    } else {
      console.log('✅ Dashboard accessible!');

      // Check what's on the dashboard
      const dashboardTitle = await page.locator('h1, h2').first().textContent().catch(() => 'No title found');
      console.log('Dashboard title:', dashboardTitle);

      // Test transaction creation
      console.log('\n📍 Step 6: Testing transaction creation...');
      const createTransactionButton = page.locator('button:has-text("Create Transaction"), a:has-text("Create Transaction")');
      const hasCreateButton = await createTransactionButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCreateButton) {
        console.log('✅ Create Transaction button found');
        // Don't click yet, just verify it's there
      } else {
        console.log('⚠️  Create Transaction button not found on dashboard');
      }

      console.log('\n✅ AUTHENTICATION WORKING!');
    }
  });
});
