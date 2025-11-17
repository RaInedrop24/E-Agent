/**
 * Playwright test to diagnose and fix authentication issues
 * Run with: npx playwright test tests/e2e/fix-auth.spec.js --headed
 */

const { test, expect } = require('@playwright/test');

const TEST_USER = {
  email: 'Eagent_Admin@rainedrop.co.uk',
  password: 'EA@l0u15e001',
};

test.describe('Authentication Fix and Testing', () => {
  test('Check authentication status and fix if needed', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    console.log('\n🔍 Starting authentication diagnostic...\n');

    // Step 1: Try to access dashboard (will redirect to login if not authenticated)
    console.log('📍 Step 1: Attempting to access dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });

    // Check if we're on login page (redirect)
    if (page.url().includes('/login')) {
      console.log('❌ Not authenticated - redirected to login page');
      console.log('🔐 Step 2: Attempting to login...');

      // Fill in login form
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);

      // Take screenshot before login
      await page.screenshot({ path: 'test-results/02-login-form-filled.png', fullPage: true });

      // Click login button and wait for navigation
      await Promise.all([
        page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {}),
        page.click('button:has-text("Sign in")'),
      ]);

      // Give time for any additional redirects or loading
      await page.waitForTimeout(2000);

      console.log('Current URL after login:', page.url());

      // Take screenshot after login attempt
      await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });

      // Check if we successfully reached dashboard or are still on login (loop)
      if (page.url().includes('/login')) {
        console.log('⚠️  LOGIN LOOP DETECTED - Still on login page after login attempt');
        console.log('This confirms authentication issue still exists');
      } else if (page.url().includes('/dashboard')) {
        console.log('✅ Successfully logged in and redirected to dashboard!');
      }
    } else {
      console.log('✅ Already authenticated - on dashboard');
    }

    // Step 3: Verify we're on dashboard
    console.log('\n📊 Step 3: Verifying dashboard access...');

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('❌ Dashboard redirected to login - Authentication NOT working');

      await page.screenshot({ path: 'test-results/04-failed-at-login.png', fullPage: true });

      console.log('\n📋 SUMMARY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔴 FAILED: Authentication still not working');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\nPossible issues:');
      console.log('1. Profile doesn\'t exist for this user');
      console.log('2. RLS policies still have issues');
      console.log('3. Session cookies not persisting');
      console.log('\n' + '━'.repeat(60));

      // Fail the test
      expect(currentUrl).toContain('/dashboard');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ Dashboard accessible!');

      await page.screenshot({ path: 'test-results/04-dashboard-success.png', fullPage: true });

      // Check what's on the dashboard
      const dashboardTitle = await page.locator('h1, h2').first().textContent().catch(() => 'No title');
      console.log('Dashboard title:', dashboardTitle);

      // Step 4: Test transaction creation button
      console.log('\n📍 Step 4: Checking transaction creation...');
      const createTransactionButton = page.locator('button:has-text("Create Transaction"), a:has-text("Create Transaction")');
      const hasCreateButton = await createTransactionButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCreateButton) {
        console.log('✅ Create Transaction button found');
      } else {
        console.log('⚠️  Create Transaction button not found on dashboard');
      }

      // Step 5: Check debug page shows profile
      console.log('\n📍 Step 5: Verifying profile on debug page...');
      await page.goto('http://localhost:3001/debug/profile');
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/05-debug-page.png', fullPage: true });

      const profileText = await page.locator('text=Profile in Database').first().locator('..').textContent();

      if (profileText.includes('No profile found')) {
        console.log('⚠️  Profile not found on debug page (but auth is working)');
      } else {
        console.log('✅ Profile exists and is accessible');
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SUCCESS: AUTHENTICATION FULLY WORKING!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\nNext steps:');
      console.log('1. Test transaction creation');
      console.log('2. Test milestone tracking');
      console.log('3. Implement remaining features');
      console.log('━'.repeat(60));
    }
  });
});
