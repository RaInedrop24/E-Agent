import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Sort and Filter Settings Sync', () => {
  const AGENT_EMAIL = process.env.TEST_AGENT_EMAIL || 'test@example.com';
  const AGENT_PASSWORD = process.env.TEST_AGENT_PASSWORD || 'test_password';

  test.beforeEach(async ({ page }) => {
    // Login as agent
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(AGENT_EMAIL, AGENT_PASSWORD);

    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('settings should sync between dashboard and transactions page', async ({ page }) => {
    console.log('=== Testing Settings Sync ===');

    // STEP 1: Set sort on dashboard to "Transaction Name"
    console.log('Step 1: Setting dashboard sort to Transaction Name');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    const dashboardSort = page.locator('[role="combobox"]').first();
    await dashboardSort.click();
    await page.getByRole('option', { name: /Transaction Name/i }).click();

    // Also enable filter
    await page.getByRole('switch', { name: /show active only/i }).click();
    await page.getByRole('button', { name: /Done/i }).click();
    await page.waitForTimeout(1500); // Wait for database save

    console.log('Dashboard settings: Sort=Title, Filter=Active Only');

    // STEP 2: Navigate to transactions page
    console.log('Step 2: Navigating to transactions page');
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // STEP 3: Check that transactions page has the SAME settings
    console.log('Step 3: Checking transactions page settings');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();

    const transactionsSort = page.locator('[role="combobox"]').first();
    const sortValue = await transactionsSort.textContent();
    console.log('Transactions page sort:', sortValue);

    const filterSwitch = page.getByRole('switch', { name: /show active only/i });
    const isChecked = await filterSwitch.isChecked();
    console.log('Transactions page filter active:', isChecked);

    // Verify they match
    expect(sortValue).toContain('Transaction Name');
    expect(isChecked).toBe(true);

    await page.getByRole('button', { name: /Done/i }).click();

    // STEP 4: Change settings on transactions page
    console.log('Step 4: Changing settings on transactions page');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    await transactionsSort.click();
    await page.getByRole('option', { name: /Agent Reference/i }).click();

    // Disable filter
    await filterSwitch.click();
    await page.getByRole('button', { name: /Done/i }).click();
    await page.waitForTimeout(1500); // Wait for database save

    console.log('Transactions settings: Sort=Agent Reference, Filter=Off');

    // STEP 5: Go back to dashboard
    console.log('Step 5: Going back to dashboard');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // STEP 6: Check that dashboard has the SAME updated settings
    console.log('Step 6: Checking dashboard settings');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();

    const dashboardSortCheck = page.locator('[role="combobox"]').first();
    const dashSortValue = await dashboardSortCheck.textContent();
    console.log('Dashboard sort:', dashSortValue);

    const dashFilterSwitch = page.getByRole('switch', { name: /show active only/i });
    const dashIsChecked = await dashFilterSwitch.isChecked();
    console.log('Dashboard filter active:', dashIsChecked);

    // Verify they match
    expect(dashSortValue).toContain('Agent Reference');
    expect(dashIsChecked).toBe(false);

    console.log('✅ Settings sync verified!');
  });
});
