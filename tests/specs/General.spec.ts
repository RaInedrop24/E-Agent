import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SettingsPage } from '../pages/SettingsPage';
import { AuthCallbackPage } from '../pages/AuthCallbackPage';
import { LoginPage } from '../pages/LoginPage';
import { TransactionsListPage } from '../pages/TransactionsListPage';
import { TransactionDetailPage } from '../pages/TransactionDetailPage';

// Credentials from environment variables
const AGENT_EMAIL = process.env.TEST_AGENT_EMAIL || 'Eagent_Admin@rainedrop.co.uk';
const AGENT_PASS = process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME';

test.describe('Public Pages', () => {
  test('home page renders', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.heading).toBeVisible();
  });

  test('auth confirmation splash renders', async ({ page }) => {
    const authCallbackPage = new AuthCallbackPage(page);
    await authCallbackPage.goto();
    await expect(authCallbackPage.welcomeText).toBeVisible();
    await expect(authCallbackPage.dashboardLink).toBeVisible();
  });

  test('login page renders', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();
  });
});

test.describe('Protected Pages', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(AGENT_EMAIL, AGENT_PASS);
    // Wait for login to complete
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await page.waitForURL('/dashboard');
  });

  test('settings page renders', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.heading).toBeVisible();
    await expect(settingsPage.saveButton).toBeVisible();
    await expect(settingsPage.fullNameInput).toBeVisible();
  });

  test('transactions list renders and links are present', async ({ page }) => {
    const txListPage = new TransactionsListPage(page);
    await txListPage.goto();
    await expect(txListPage.heading).toBeVisible();
    // Assuming the user has transactions. If not, this might fail, but checking heading is safe.
    // We can check if at least one view link exists if we expect data.
    // Given we created data in regression test, likely yes.
    await expect(txListPage.firstViewLink).toBeVisible();
  });

  test('transaction detail renders from list navigation', async ({ page }) => {
    const txListPage = new TransactionsListPage(page);
    const detailPage = new TransactionDetailPage(page);
    
    await txListPage.goto();
    
    // Using Promise.all for robust navigation handling
    await Promise.all([
      page.waitForURL(/\/transaction\/.+/),
      txListPage.clickFirstTransaction()
    ]);

    await expect(detailPage.participantsTab).toBeVisible();
  });
});
