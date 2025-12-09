import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CreateTransactionPage } from '../pages/CreateTransactionPage';
import { TransactionDetailPage } from '../pages/TransactionDetailPage';

test.describe('Invite Buyer Flow', () => {
    let loginPage: LoginPage;
    let createPage: CreateTransactionPage;
    let detailPage: TransactionDetailPage;

    const timestamp = Date.now();
    const AGENT_EMAIL = process.env.TEST_AGENT_EMAIL || 'Eagent_Admin@rainedrop.co.uk';
    const AGENT_PASS = process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME';

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        createPage = new CreateTransactionPage(page);
        detailPage = new TransactionDetailPage(page);

        // Login as Agent
        await loginPage.goto();
        await loginPage.login(AGENT_EMAIL, AGENT_PASS);
        
        // Wait for auth
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
        await page.waitForURL('/dashboard');
    });

    test('should show error when inviting a non-existent buyer', async ({ page }) => {
        // 1. Create Transaction
        await createPage.goto();
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
        
        const title = `Invite Error Test ${timestamp}`;
        await createPage.createTransaction(title, '123 Test St, Rome');
        
        // Wait for redirect
        await expect(page).toHaveURL(/\/transaction\/[0-9a-f-]{36}/, { timeout: 15000 });
        
        // 2. Invite Non-existent Buyer
        const NON_EXISTENT_EMAIL = `nobody-${timestamp}@example.com`;
        
        await detailPage.participantsTab.click();
        await detailPage.inviteButton.click();
        await detailPage.inviteEmailInput.fill(NON_EXISTENT_EMAIL);
        await detailPage.sendInviteButton.click();
        
        // 3. Verify Error
        await expect(detailPage.errorMessage).toBeVisible();
        await expect(detailPage.errorMessage).toContainText('User not found');
    });

    // Skipped: Requires a valid buyer account with profile. 
    // Currently blocked by Rate Limits on registration and missing profile for 'eagent_louise'.
    test.skip('should allow agent to invite a registered buyer', async ({ page }) => {
        const BUYER_EMAIL = 'eagent_louise@rainedrop.co.uk'; 
        
        // Create Transaction
        await createPage.goto();
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
        await createPage.createTransaction(`Invite Success Test ${timestamp}`);
        await expect(page).toHaveURL(/\/transaction\/.*/);

        // Invite
        await detailPage.inviteBuyer(BUYER_EMAIL);
        await detailPage.validateBuyerPresent(BUYER_EMAIL);
    });
});
