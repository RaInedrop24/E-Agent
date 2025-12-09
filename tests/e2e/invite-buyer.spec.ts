import { test, expect } from '@playwright/test';

test.describe('Invite Buyer Flow', () => {
    const timestamp = Date.now();
    const buyerEmail = 'eagent_louise@rainedrop.co.uk';
    const agentEmail = 'Eagent_Admin@rainedrop.co.uk';
    const agentPassword = 'EA@l0u15e001';

    test('should allow agent to invite a registered buyer', async ({ page }) => {
        // 1. Login as Agent
        await page.goto('/login');
        if (await page.url().includes('/dashboard')) {
            await page.click('button:has-text("Sign out")');
        }

        await page.goto('/login');
        await page.fill('input#email', agentEmail);
        await page.fill('input#password', agentPassword);
        await page.click('button:has-text("Sign in")');

        await expect(page).toHaveURL(/\/dashboard/);

        // 2. Create a Transaction
        await page.goto('/transactions/create');

        // Wait for NO error (auth loading complete)
        // If "You must be logged in" appears, wait for it to disappear
        await page.waitForTimeout(3000); // Give profile time to load

        await page.fill('input#title', `Transaction ${timestamp}`);
        await page.fill('textarea#propertyAddress', '123 Test St, Rome');

        // Wait for button to be enabled
        await page.waitForSelector('button:has-text("Create Transaction"):not([disabled])');
        await page.click('button:has-text("Create Transaction")');

        // Wait for redirect to transaction detail page
        await page.waitForURL(/\/transaction\/[a-f0-9-]+/, { timeout: 15000 });

        // 3. Invite the Buyer
        await page.click('button[value="participants"]');
        await page.click('button:has-text("Invite Buyer")');
        await page.fill('input[placeholder="buyer@example.com"]', buyerEmail);
        await page.click('button:has-text("Invite")');

        // 4. Verify Success
        await expect(page.locator('text=Buyer added successfully')).toBeVisible({ timeout: 10000 });
        await expect(page.locator(`text=${buyerEmail}`)).toBeVisible();
    });
});
