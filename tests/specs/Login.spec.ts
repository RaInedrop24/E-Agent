import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Feature', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should render login form correctly', async () => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should show error with invalid credentials', async () => {
    // We can't easily mock Supabase client directly in E2E without network interception or mocking the module.
    // For this test, we assume the backend (or mock) rejects invalid creds.
    // Given we don't have a running backend guaranteed, we might rely on the client-side error handling if we can trigger it.
    // Or we can assume the dev server is running and Supabase might fail.
    
    // Attempt login with garbage
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // The UI should show an error. 
    // Note: If no backend is running, this might just hang or show a network error.
    // For now, we'll check if the error appears.
    await expect(loginPage.errorText).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await loginPage.registerLink.click();
    // Check URL or heading
    await expect(page).toHaveURL(/.*register/);
  });
});

