import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Sort Order Persistence', () => {
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

  test('dashboard sort order should persist after reload', async ({ page }) => {
    console.log('=== Testing Dashboard Sort Persistence ===');

    // Open filter/sort modal
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();

    // Get the current sort value
    const sortSelect = page.locator('[role="combobox"]').first();
    await expect(sortSelect).toBeVisible();

    const initialValue = await sortSelect.getAttribute('data-value') || await sortSelect.textContent();
    console.log('Initial sort order on dashboard:', initialValue);

    // Change to sort by "Transaction Name"
    await sortSelect.click();
    await page.getByRole('option', { name: /Transaction Name/i }).click();
    console.log('Changed sort to: Transaction Name');

    // Close modal
    await page.getByRole('button', { name: /Done/i }).click();

    // Wait a bit for the save to complete
    await page.waitForTimeout(1000);

    // Reload the page
    console.log('Reloading dashboard...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open filter/sort modal again
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();

    // Check if sort order persisted
    const sortSelectAfterReload = page.locator('[role="combobox"]').first();
    const valueAfterReload = await sortSelectAfterReload.textContent();
    console.log('Sort order after reload:', valueAfterReload);

    // Should contain "Transaction Name"
    expect(valueAfterReload).toContain('Transaction Name');

    // Close modal
    await page.getByRole('button', { name: /Done/i }).click();
  });

  test('transactions page sort order should persist after reload', async ({ page }) => {
    console.log('=== Testing Transactions Page Sort Persistence ===');

    // Navigate to transactions page
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Open filter/sort modal
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();

    // Get the current sort value
    const sortSelect = page.locator('[role="combobox"]').first();
    await expect(sortSelect).toBeVisible();

    const initialValue = await sortSelect.textContent();
    console.log('Initial sort order on transactions page:', initialValue);

    // Change to sort by "Agent Reference"
    await sortSelect.click();
    await page.getByRole('option', { name: /Agent Reference/i }).click();
    console.log('Changed sort to: Agent Reference');

    // Close modal
    await page.getByRole('button', { name: /Done/i }).click();

    // Wait a bit for the save to complete
    await page.waitForTimeout(1000);

    // Reload the page
    console.log('Reloading transactions page...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open filter/sort modal again
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();

    // Check if sort order persisted
    const sortSelectAfterReload = page.locator('[role="combobox"]').first();
    const valueAfterReload = await sortSelectAfterReload.textContent();
    console.log('Sort order after reload:', valueAfterReload);

    // Should contain "Agent Reference"
    expect(valueAfterReload).toContain('Agent Reference');

    // Close modal
    await page.getByRole('button', { name: /Done/i }).click();
  });

  test('sort order should be independent between dashboard and transactions page', async ({ page }) => {
    console.log('=== Testing Independent Sort Orders ===');

    // Step 1: Set dashboard sort to "Transaction Name"
    console.log('Step 1: Setting dashboard sort to Transaction Name');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    const dashboardSort = page.locator('[role="combobox"]').first();
    await dashboardSort.click();
    await page.getByRole('option', { name: /Transaction Name/i }).click();
    await page.getByRole('button', { name: /Done/i }).click();
    await page.waitForTimeout(1000);

    // Step 2: Navigate to transactions page
    console.log('Step 2: Navigating to transactions page');
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Step 3: Set transactions page sort to "Agent Reference"
    console.log('Step 3: Setting transactions page sort to Agent Reference');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    const transactionsSort = page.locator('[role="combobox"]').first();
    await transactionsSort.click();
    await page.getByRole('option', { name: /Agent Reference/i }).click();
    await page.getByRole('button', { name: /Done/i }).click();
    await page.waitForTimeout(1000);

    // Step 4: Go back to dashboard
    console.log('Step 4: Going back to dashboard');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Step 5: Check dashboard sort is still "Transaction Name"
    console.log('Step 5: Checking dashboard sort order');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    const dashboardSortCheck = page.locator('[role="combobox"]').first();
    const dashboardValue = await dashboardSortCheck.textContent();
    console.log('Dashboard sort after returning:', dashboardValue);
    expect(dashboardValue).toContain('Transaction Name');
    await page.getByRole('button', { name: /Done/i }).click();

    // Step 6: Go back to transactions page
    console.log('Step 6: Going back to transactions page');
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Step 7: Check transactions page sort is still "Agent Reference"
    console.log('Step 7: Checking transactions page sort order');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    const transactionsSortCheck = page.locator('[role="combobox"]').first();
    const transactionsValue = await transactionsSortCheck.textContent();
    console.log('Transactions page sort after returning:', transactionsValue);
    expect(transactionsValue).toContain('Agent Reference');
    await page.getByRole('button', { name: /Done/i }).click();
  });

  test('check actual behavior - what user is experiencing', async ({ page }) => {
    console.log('=== Testing Actual User Experience ===');

    // Clear all preferences first
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to start fresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log('Step 1: Check default sort on dashboard');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    let sortValue = await page.locator('[role="combobox"]').first().textContent();
    console.log('Dashboard default:', sortValue);
    await page.getByRole('button', { name: /Done/i }).click();

    console.log('Step 2: Navigate to transactions page');
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    console.log('Step 3: Check default sort on transactions page');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    sortValue = await page.locator('[role="combobox"]').first().textContent();
    console.log('Transactions default:', sortValue);
    await page.getByRole('button', { name: /Done/i }).click();

    console.log('Step 4: Change sort on transactions page to Title');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole('option', { name: /Transaction Name/i }).click();
    console.log('Changed to Transaction Name');
    await page.getByRole('button', { name: /Done/i }).click();
    await page.waitForTimeout(1000);

    console.log('Step 5: Go to dashboard');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('Step 6: Check sort on dashboard');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    sortValue = await page.locator('[role="combobox"]').first().textContent();
    console.log('Dashboard after changing transactions:', sortValue);
    await page.getByRole('button', { name: /Done/i }).click();

    console.log('Step 7: Change sort on dashboard to Agent Reference');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole('option', { name: /Agent Reference/i }).click();
    console.log('Changed to Agent Reference');
    await page.getByRole('button', { name: /Done/i }).click();
    await page.waitForTimeout(1000);

    console.log('Step 8: Go back to transactions page');
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    console.log('Step 9: Check sort on transactions page');
    await page.getByRole('button', { name: /Filter.*Sort/i }).click();
    sortValue = await page.locator('[role="combobox"]').first().textContent();
    console.log('Transactions after changing dashboard:', sortValue);
    console.log('Expected: Transaction Name, Got:', sortValue);
  });
});
