import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CreateTransactionPage } from '../pages/CreateTransactionPage';
import { TransactionDetailPage } from '../pages/TransactionDetailPage';

test.describe('Transaction Creation Flow', () => {
  let loginPage: LoginPage;
  let createPage: CreateTransactionPage;
  let detailPage: TransactionDetailPage;

  // Credentials provided in requirements
  const AGENT_EMAIL = 'Eagent_Admin@rainedrop.co.uk';
  const AGENT_PASS = 'EA@l0u15e001';

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    createPage = new CreateTransactionPage(page);
    detailPage = new TransactionDetailPage(page);

    // Login as Agent
    await loginPage.goto();
    await loginPage.login(AGENT_EMAIL, AGENT_PASS);
    
    // Ensure we are logged in by waiting for the Logout button in the header
    // This confirms the session is active and profile is loaded
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await page.waitForURL('/dashboard');
  });

  test('Agent can create a new transaction', async ({ page }) => {
    // Navigate to Create Page
    await createPage.goto();
    // Re-verify auth state persists on new page
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    const timestamp = new Date().toISOString();
    const txTitle = `Automated Test Transaction [${timestamp}]`;
    const txAddress = '123 Test Street, QA City';

    // Create Transaction
    await createPage.createTransaction(txTitle, txAddress);

    // Assertion 1: Verify redirection to detail page
    // Pattern: /transaction/[uuid]
    // Increased timeout for DB operations
    await expect(page).toHaveURL(/\/transaction\/[0-9a-f-]{36}/, { timeout: 10000 });

    // Assertion 2: Regression Check - No RLS error (Redundant if we passed URL check, but good for safety)
    const rlsError = page.getByText('new row violates row-level security policy');
    await expect(rlsError).not.toBeVisible();

    // Assertion 3: Verify title on detail page
    await detailPage.validateTitle(txTitle);

    // Assertion 4: Verify Participants count is (1)
    await detailPage.validateParticipantsCount(1);
  });
});
